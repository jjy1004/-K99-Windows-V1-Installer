import {Router} from 'express';
import {Client,StreamRequestError} from '@replit/object-storage';
import {Transform, type Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import releaseJson from '../installer-release.json';

type DownloadClient=Pick<Client,'exists'|'downloadAsStream'>;
type ReleaseFile={filename:string;bytes:number;sha256:string;objectName:string};
const release=releaseJson as ReleaseFile&{bucketId:string;portable?:ReleaseFile;installerChannel?:'github-latest'};
// Wait for a real storage byte before committing HTTP 200. pipeline() destroys
// its HTTP destination on error, so using it before storage is ready otherwise
// turns an early storage error into an empty/reset connection at the proxy.
function firstByte(stream:Readable,timeoutMs:number){
  return new Promise<void>((resolve,reject)=>{
    const cleanup=()=>{
      clearTimeout(timer);stream.off('readable',ready);stream.off('end',empty);
      stream.off('close',closed);stream.off('error',failed);
    };
    const failed=(error:Error)=>{cleanup();reject(error);};
    const empty=()=>failed(Object.assign(new Error('Release object contains no data'),{code:'EMPTY_RELEASE'}));
    const closed=()=>failed(Object.assign(new Error('Release stream closed before its first byte'),{code:'EARLY_CLOSE'}));
    const ready=()=>{
      if(stream.readableLength>0){cleanup();resolve();}
      else if(stream.readableEnded)empty();
      else stream.read(0);
    };
    const timer=setTimeout(()=>failed(Object.assign(new Error('Storage first-byte deadline exceeded'),{code:'FIRST_BYTE_TIMEOUT'})),timeoutMs);
    timer.unref();
    stream.on('readable',ready);stream.once('end',empty);stream.once('close',closed);stream.once('error',failed);
    if(stream.destroyed)closed();else ready();
  });
}
function errorFields(error:unknown){
  const value=error as {name?:string;code?:string|number;message?:string};
  const storage=error instanceof StreamRequestError?error.getRequestError():undefined;
  return {errorName:value?.name||'Error',errorCode:value?.code??storage?.statusCode,
    // Never serialize SDK request objects, authentication headers or signed URLs.
    errorMessage:String(storage?.message||value?.message||'Unknown storage failure').replace(/https?:\/\/\S+/g,'[URL omitted]').slice(0,500)};
}
// Public release binaries only. Never mount the desktop data routes or expose
// generated-artifacts/ in production. The /dev-downloads URL is retained solely
// for compatibility with previously distributed links.
export default function releaseDownloads(providedClient?:DownloadClient,options:{firstByteTimeoutMs?:number}={}){
  const router=Router();
  // The verified Windows workflow advances GitHub's latest release only after
  // native ABI and installer checksum checks. Do not cache an older redirect.
  if(release.installerChannel==='github-latest'){
    const latest='https://github.com/jjy1004/-K99-Windows-V1-Installer/releases/latest/download/';
    for(const suffix of ['','.sha256'])router.get('/'+release.filename+suffix,(_req,res)=>{
      res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.redirect(302,latest+release.filename+suffix);
    });
  }
  let client=providedClient;
  const getClient=()=>client??=new Client({bucketId:release.bucketId});
  const files=[...(release.installerChannel==='github-latest'?[]:[release]),...release.portable?[release.portable]:[]];
  for(const file of files){
  router.get('/'+file.filename+'.sha256',(_req,res)=>{
    res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.type('text/plain').send(`${file.sha256}  ${file.filename}\n`);
  });
  router.get('/'+file.filename,async(req,res):Promise<void>=>{
    let stream:Readable|undefined,bytesSent=0,phase='storage';
    const disconnected=()=>{if(!res.writableFinished)stream?.destroy();};
    res.once('close',disconnected);
    try{
      const storage=getClient();
      // HEAD supplies metadata only. GET checks availability by reading its
      // first byte, avoiding an extra storage RPC before every large transfer.
      if(req.method==='HEAD'){
        const exists=await storage.exists(file.objectName);
        if(!exists.ok||!exists.value){
          res.set({'Cache-Control':'no-store','Retry-After':'10'});
          res.status(503).json({error:'설치 파일을 준비 중입니다. 잠시 후 다시 시도해 주세요.'});return;
        }
      }else{
        stream=storage.downloadAsStream(file.objectName,{decompress:false});
        // The SDK can emit errors even after a consumer disconnects. Keep one
        // passive listener for this stream's lifetime; firstByte/pipeline still
        // handle and report the actual failure.
        stream.on('error',()=>{});
        phase='first-byte';
        await firstByte(stream,options.firstByteTimeoutMs??15000);
      }
      if(res.destroyed)return;
      res.set({
        'Content-Type':'application/octet-stream',
        'Content-Disposition':`attachment; filename="${file.filename}"`,
        'Cache-Control':'no-store, no-transform',
        'X-Content-Type-Options':'nosniff',
        'Accept-Ranges':'none',
        'X-Accel-Buffering':'no',
        'X-File-Size':String(file.bytes),
        'X-Checksum-SHA256':file.sha256,
      });
      if(req.method==='HEAD'){res.setHeader('Content-Length',String(file.bytes));res.end();return;}
      // Ignore Range safely with a full 200 response: the SDK does not expose
      // byte ranges. Do not advertise resumable transfers that are unsupported.
      // Crucially, GET must not carry Content-Length. Node then uses chunked
      // HTTP/1.1 on the origin hop instead of encouraging proxy buffering of
      // the entire 245/313 MiB response. HTTP/2 clients need no chunked header.
      res.removeHeader('Content-Length');
      res.setTimeout(0);
      res.flushHeaders();
      phase='body';
      const verifySize=new Transform({
        transform(chunk:Buffer,_encoding,callback){
          bytesSent+=chunk.length;
          if(bytesSent>file.bytes)callback(Object.assign(new Error('Release stream exceeds manifest size'),{code:'RELEASE_SIZE_MISMATCH'}));
          else callback(null,chunk);
        },
        flush(callback){
          callback(bytesSent===file.bytes?null:Object.assign(new Error('Release stream is shorter than manifest size'),{code:'RELEASE_SIZE_MISMATCH'}));
        },
      });
      await pipeline(stream!,verifySize,res);
      req.log?.info({filename:file.filename,bytesSent},'Release download completed');
    }catch(error){
      stream?.destroy();
      req.log?.warn({filename:file.filename,phase,bytesSent,expectedBytes:file.bytes,
        clientDisconnected:res.destroyed,...errorFields(error)},'Release download failed or client disconnected');
      if(res.destroyed)return;
      if(!res.headersSent){
        for(const name of ['Content-Type','Content-Length','Content-Disposition','X-Checksum-SHA256','Accept-Ranges','X-File-Size'])
          res.removeHeader(name);
        res.set({'Cache-Control':'no-store','Retry-After':'10'});
        res.status(503).json({error:'설치 파일 다운로드를 시작하지 못했습니다.'});
      }
      else if(!res.destroyed)res.destroy();
    }finally{
      res.off('close',disconnected);
      if(stream&&!stream.destroyed)stream.destroy();
    }
  });
  }
  return router;
}
