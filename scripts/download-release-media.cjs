'use strict';
// Public, pinned release assets only. No PAT or additional Actions secret.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=file=>{
  const result=crypto.createHash('sha256'),buffer=Buffer.alloc(1024*1024),fd=fs.openSync(file,'r');
  try{for(let n;(n=fs.readSync(fd,buffer,0,buffer.length,null));)result.update(buffer.subarray(0,n));}
  finally{fs.closeSync(fd);}
  return result.digest('hex');
};
function validate(manifest,release,expectedRepository){
  if(release.schemaVersion!==1||!/^[-\w.]+\/[-\w.]+$/.test(release.repository)||
    !/^[-\w.]+$/.test(release.tag))throw Error('릴리스 저장소·태그 설정 오류');
  if(expectedRepository&&release.repository.toLowerCase()!==expectedRepository.toLowerCase())
    throw Error('현재 빌드 저장소와 영상 릴리스 저장소가 다릅니다.');
  if(!/^[a-f0-9]{64}$/.test(manifest.sha256)||release.archiveSHA256!==manifest.sha256||
    !Number.isSafeInteger(manifest.bytes)||manifest.bytes<=0||manifest.bytes>1024**3||
    release.archiveBytes!==manifest.bytes)throw Error('고정된 영상 원본 ZIP 정보 불일치');
  if(!Array.isArray(manifest.parts)||!manifest.parts.length||manifest.parts.length>32||
    release.partCount!==manifest.parts.length)throw Error('영상 분할 목록 오류');
  let total=0;
  for(const [i,p] of manifest.parts.entries()){
    if(p.name!==`customer-videos.zip.part${String(i+1).padStart(3,'0')}`||
      !Number.isSafeInteger(p.bytes)||p.bytes<=0||p.bytes>25*1024**2||
      !/^[a-f0-9]{64}$/.test(p.sha256))throw Error('영상 분할 이름·크기·해시 오류');
    total+=p.bytes;
  }
  if(total!==manifest.bytes)throw Error('영상 분할 파일의 합산 크기 불일치');
}
async function downloadParts(source,releaseFile,options={}){
  const manifest=JSON.parse(fs.readFileSync(path.join(source,'customer-videos.upload.json'),'utf8'));
  const release=JSON.parse(fs.readFileSync(releaseFile,'utf8'));
  validate(manifest,release,options.expectedRepository??process.env.GITHUB_REPOSITORY);
  const fetcher=options.fetch??fetch,attempts=options.attempts??3,delay=options.delay??1000;
  const results=[];
  for(const p of manifest.parts){
    const target=path.join(source,p.name),temporary=target+`.${process.pid}.download`;
    if(fs.existsSync(target)){
      if(fs.lstatSync(target).isSymbolicLink())throw Error('영상 경로에 심볼릭 링크를 사용할 수 없습니다.');
      if(fs.statSync(target).size===p.bytes&&hash(target)===p.sha256){
        results.push({name:p.name,status:'cached',bytes:p.bytes,sha256:p.sha256});continue;
      }
    }
    const url=`https://github.com/${release.repository}/releases/download/${encodeURIComponent(release.tag)}/${encodeURIComponent(p.name)}`;
    let completed=false;
    for(let attempt=1;attempt<=attempts;attempt++){
      let fd;
      try{
        const response=await fetcher(url,{signal:AbortSignal.timeout(60000),redirect:'follow',
          headers:{Accept:'application/octet-stream','User-Agent':'K99-Release-Media-Downloader'}});
        if(response.status!==200||!response.body)throw Error(`영상 다운로드 HTTP ${response.status}: ${p.name}`);
        const declared=response.headers.get('content-length');
        if(declared!==null&&Number(declared)!==p.bytes)throw Error('다운로드 응답 크기 불일치: '+p.name);
        fd=fs.openSync(temporary,'wx');
        const digest=crypto.createHash('sha256');let bytes=0;
        for await(const chunk of response.body){
          bytes+=chunk.length;
          if(bytes>p.bytes)throw Error('다운로드 크기 초과: '+p.name);
          digest.update(chunk);
          let written=0;
          while(written<chunk.length)written+=fs.writeSync(fd,chunk,written,chunk.length-written);
        }
        const actual=digest.digest('hex');
        if(bytes!==p.bytes||actual!==p.sha256)throw Error('다운로드 크기·SHA-256 불일치: '+p.name);
        fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
        fs.renameSync(temporary,target);
        results.push({name:p.name,status:'downloaded',bytes,sha256:actual});
        console.log(`[K99 MEDIA] 검증 완료: ${p.name} (${bytes} bytes)`);
        completed=true;break;
      }catch(error){
        if(fd!==undefined)fs.closeSync(fd);
        fs.rmSync(temporary,{force:true});
        if(attempt===attempts)throw error;
        await new Promise(resolve=>setTimeout(resolve,delay*attempt));
      }
    }
    if(!completed)throw Error('영상 다운로드 미완료: '+p.name);
  }
  return results;
}
if(require.main===module){
  downloadParts(path.resolve(process.argv[2]||'source'),
    path.resolve(process.argv[3]||'source/customer-videos.release.json'))
    .then(result=>console.log(JSON.stringify({verifiedParts:result.length,parts:result},null,2)))
    .catch(error=>{console.error('[K99 RELEASE MEDIA] '+error.message);process.exitCode=1;});
}
module.exports={downloadParts,validate};
