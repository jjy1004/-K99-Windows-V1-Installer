'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const {createRequire}=Module;
const root=path.resolve(__dirname,'../..');
const req=createRequire(path.join(root,'artifacts/api-server/package.json'));
const source=path.join(root,'artifacts/api-server/src/routes/release-downloads.ts');
const m=new Module(source,module);m.filename=source;m.paths=Module._nodeModulePaths(path.dirname(source));
const compiled=req('esbuild').transformSync(fs.readFileSync(source,'utf8'),{loader:'ts',format:'cjs'}).code;
m._compile(compiled,source);
// Legacy storage fixtures still exercise first-byte/size/disconnect protection.
const release={...req('./src/installer-release.json'),installerChannel:undefined},express=req('express');
async function withServer(client,check,fixture,options){
  let router=m.exports.default;
  {
    const isolated=new Module(source,module);isolated.filename=source;isolated.paths=m.paths;
    const original=isolated.require.bind(isolated);
    isolated.require=id=>id==='../installer-release.json'?(fixture||release):original(id);
    isolated._compile(compiled,source);router=isolated.exports.default;
  }
  const app=express();app.use('/api/dev-downloads',router(client,options));
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  try{await check(`http://127.0.0.1:${server.address().port}/api/dev-downloads`);}
  finally{await new Promise(resolve=>server.close(resolve));}
}
test('published release route exposes only fixed filename and checksum, not arbitrary local files',async()=>{
  assert.match(fs.readFileSync(path.join(root,'artifacts/api-server/build.mjs'),'utf8'),/"@replit\/object-storage"/);
  assert.ok(req('./package.json').dependencies['@replit/object-storage']);
  await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>{throw Error('HEAD must not open body');}},async(base)=>{
    const head=await fetch(base+'/'+release.filename,{method:'HEAD'});
    assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),String(release.bytes));
    assert.equal(head.headers.get('x-checksum-sha256'),release.sha256);
    assert.equal(head.headers.get('accept-ranges'),'none');
    const sha=await fetch(base+'/'+release.filename+'.sha256');
    assert.equal(await sha.text(),`${release.sha256}  ${release.filename}\n`);
    assert.equal((await fetch(base+'/other.exe')).status,404);
    assert.equal((await fetch(base+'/install-guide')).status,404);
  });
});
test('canonical EXE and checksum track latest verified GitHub release without cached stale metadata or storage reads',async()=>{
  await withServer({exists:()=>assert.fail('latest must not touch legacy storage'),
    downloadAsStream:()=>assert.fail('latest must not stream legacy bytes')},async base=>{
      for(const method of ['GET','HEAD'])for(const suffix of ['','.sha256']){
        const r=await fetch(base+'/'+release.filename+suffix,{method,redirect:'manual'});
        assert.equal(r.status,302);
        assert.equal(r.headers.get('location'),'https://github.com/jjy1004/-K99-Windows-V1-Installer/releases/latest/download/'+release.filename+suffix);
        assert.equal(r.headers.get('cache-control'),'no-store');
        assert.equal(r.headers.get('x-checksum-sha256'),null);
      }
      assert.equal((await fetch(base+'/unapproved.exe')).status,404);
    },{...release,installerChannel:'github-latest'});
});
test('portable ZIP uses the same immutable release routing, checksum and full-body Range behavior',async()=>{
  const {Readable}=require('node:stream'),crypto=require('node:crypto');
  const bytes=Buffer.from([0x50,0x4b,3,4]);
  const portable={filename:'K99-Laundry-V2-test-win-unpacked.zip',bytes:bytes.length,
    sha256:crypto.createHash('sha256').update(bytes).digest('hex'),objectName:'releases/test/portable.zip'};
  const objects=[];
  await withServer({exists:async object=>{objects.push(object);return {ok:true,value:true};},
    downloadAsStream:object=>{assert.equal(object,portable.objectName);return Readable.from([bytes]);}},async base=>{
    const head=await fetch(base+'/'+portable.filename,{method:'HEAD'});
    assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),String(bytes.length));
    assert.equal(head.headers.get('x-checksum-sha256'),portable.sha256);
    assert.equal(await(await fetch(base+'/'+portable.filename+'.sha256')).text(),`${portable.sha256}  ${portable.filename}\n`);
    const response=await fetch(base+'/'+portable.filename,{headers:{Range:'bytes=0-1'}});
    assert.equal(response.status,200);assert.equal(response.headers.get('accept-ranges'),'none');
    assert.equal(response.headers.get('content-length'),null);
    assert.equal(response.headers.get('transfer-encoding'),'chunked');
    assert.equal(response.headers.get('x-file-size'),String(bytes.length));
    assert.equal(response.headers.get('x-accel-buffering'),'no');
    assert.match(response.headers.get('cache-control'),/no-transform/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
    assert.equal((await fetch(base+'/k99.db')).status,404);
    assert.ok(objects.every(o=>o===portable.objectName));
  },{...release,portable});
});
test('unavailable persistent object returns 503 instead of a fake successful binary',async()=>{
  for(const result of [{ok:true,value:false},{ok:false,error:'test unavailable'}])
    await withServer({exists:async()=>result,downloadAsStream:()=>{throw Error('unavailable object');}},async(base)=>{
      const r=await fetch(base+'/'+release.filename);assert.equal(r.status,503);
      assert.match(r.headers.get('content-type'),/json/);
      assert.equal((await fetch(base+'/'+release.filename,{method:'HEAD'})).status,503);
    });
});
test('asynchronous storage errors before first byte return JSON 503 instead of resetting the connection',async()=>{
  const {Readable}=require('node:stream');
  await withServer({exists:async()=>{throw Error('GET should not need a metadata RPC');},
    downloadAsStream:()=>new Readable({read(){this.destroy(Object.assign(Error('upstream read failed'),{code:'EIO'}));}})},async base=>{
    const r=await fetch(base+'/'+release.filename,{signal:AbortSignal.timeout(2000)});
    assert.equal(r.status,503);assert.equal(r.headers.get('content-disposition'),null);
    assert.equal(r.headers.get('retry-after'),'10');assert.match((await r.json()).error,/다운로드/);
  });
});
test('empty and stalled storage streams terminate before HTTP 200 with bounded 503',async()=>{
  const {Readable}=require('node:stream');
  for(const empty of [true,false]){
    let source;
    await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>{
      source=empty?Readable.from([]):new Readable({read(){}});
      return source;
    }},async base=>{
      const r=await fetch(base+'/'+release.filename,{signal:AbortSignal.timeout(2000)});
      assert.equal(r.status,503);await r.json();assert.equal(source.destroyed,true);
    },undefined,{firstByteTimeoutMs:40});
  }
});
test('GET is genuinely streamed before EOF and does not wait to buffer the complete object',async()=>{
  const {PassThrough}=require('node:stream');
  const source=new PassThrough(),bytes=Buffer.from('MZ-streamed-release');
  const fixture={...release,portable:undefined,bytes:bytes.length};
  await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>{
    setImmediate(()=>source.write(bytes.subarray(0,2)));return source;
  }},async base=>{
    const r=await fetch(base+'/'+release.filename,{signal:AbortSignal.timeout(2000)});
    assert.equal(r.status,200);assert.equal(source.writableEnded,false);
    assert.equal(r.headers.get('content-length'),null);
    const reader=r.body.getReader(),first=await reader.read();
    assert.deepEqual(Buffer.from(first.value),bytes.subarray(0,2));
    source.end(bytes.subarray(2));
    const rest=[];for(;;){const next=await reader.read();if(next.done)break;rest.push(Buffer.from(next.value));}
    assert.deepEqual(Buffer.concat([Buffer.from(first.value),...rest]),bytes);
  },fixture);
});
test('40 MiB release crosses common buffered-response thresholds using bounded producer chunks',async()=>{
  const {Readable}=require('node:stream'),crypto=require('node:crypto');
  const chunk=Buffer.alloc(64*1024,0x4b),count=640,expected=crypto.createHash('sha256');
  for(let i=0;i<count;i++)expected.update(chunk);
  const fixture={...release,portable:undefined,bytes:chunk.length*count,sha256:expected.digest('hex')};
  await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>Readable.from((function*(){
    for(let i=0;i<count;i++)yield chunk;
  })())},async base=>{
    const r=await fetch(base+'/'+release.filename,{signal:AbortSignal.timeout(15000)});
    assert.equal(r.headers.get('content-length'),null);
    const hash=crypto.createHash('sha256');let bytes=0;
    for await(const part of r.body){bytes+=part.length;hash.update(part);}
    assert.equal(bytes,fixture.bytes);assert.equal(hash.digest('hex'),fixture.sha256);
  },fixture);
});
test('wrong object size aborts the transfer instead of silently returning a corrupt complete EXE',async()=>{
  const {Readable}=require('node:stream');
  for(const bytes of [Buffer.from('MZ'),Buffer.alloc(10)]){
    const fixture={...release,portable:undefined,bytes:5};
    await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>Readable.from([bytes])},async base=>{
      await assert.rejects(async()=>{const r=await fetch(base+'/'+release.filename,{signal:AbortSignal.timeout(2000)});await r.arrayBuffer();});
    },fixture);
  }
});
test('cancelled clients destroy the source and a later SDK error does not crash the server',async()=>{
  const {PassThrough}=require('node:stream');
  let source;
  const fixture={...release,portable:undefined,bytes:100};
  await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>{
    source=new PassThrough();setImmediate(()=>source.write(Buffer.from('MZ')));return source;
  }},async base=>{
    const abort=new AbortController();
    const r=await fetch(base+'/'+release.filename,{signal:abort.signal});
    const reader=r.body.getReader();await reader.read();abort.abort();
    await new Promise(resolve=>setTimeout(resolve,50));
    assert.equal(source.destroyed,true);
    assert.doesNotThrow(()=>source.emit('error',Error('late SDK error')));
    assert.equal((await fetch(base+'/'+release.filename+'.sha256')).status,200);
  },fixture);
});
test('storage failure before streaming returns a bounded JSON error without stale EXE headers',async()=>{
  await withServer({exists:async()=>({ok:true,value:true}),downloadAsStream:()=>{throw Error('storage offline');}},async(base)=>{
    const r=await fetch(base+'/'+release.filename,{signal:AbortSignal.timeout(3000)});
    assert.equal(r.status,503);assert.match(r.headers.get('content-type'),/json/);
    assert.notEqual(r.headers.get('content-length'),String(release.bytes));
    assert.equal(r.headers.get('content-disposition'),null);
    assert.equal(r.headers.get('x-checksum-sha256'),null);
    assert.match((await r.json()).error,/다운로드/);
  });
});
