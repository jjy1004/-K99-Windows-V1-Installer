'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {downloadParts}=require('../download-release-media.cjs');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(t){
  const source=fs.mkdtempSync(path.join(os.tmpdir(),'k99-release-parts-'));
  t.after(()=>fs.rmSync(source,{recursive:true,force:true}));
  const data=[Buffer.from('video-first'),Buffer.from('video-second')];
  const manifest={bytes:Buffer.concat(data).length,sha256:sha(Buffer.concat(data)),
    parts:data.map((b,i)=>({name:`customer-videos.zip.part00${i+1}`,bytes:b.length,sha256:sha(b)}))};
  const release={schemaVersion:1,repository:'owner/repo',tag:'test-media',
    archiveSHA256:manifest.sha256,archiveBytes:manifest.bytes,partCount:data.length};
  const releaseFile=path.join(source,'customer-videos.release.json');
  const save=()=>{fs.writeFileSync(path.join(source,'customer-videos.upload.json'),JSON.stringify(manifest));
    fs.writeFileSync(releaseFile,JSON.stringify(release));};
  save();
  const options={attempts:1,delay:0,expectedRepository:'owner/repo',fetch:async url=>{
    const index=manifest.parts.findIndex(p=>url.endsWith('/'+p.name));
    assert.ok(index>=0);assert.ok(url.startsWith('https://github.com/owner/repo/releases/download/test-media/'));
    return new Response(data[index],{status:200});
  }};
  return {source,data,manifest,release,releaseFile,save,options};
}
test('downloads exact pinned names, validates bytes and hashes, then reuses valid cached files',async t=>{
  const f=fixture(t);
  assert.equal((await downloadParts(f.source,f.releaseFile,f.options)).length,2);
  for(const [i,p] of f.manifest.parts.entries())assert.deepEqual(fs.readFileSync(path.join(f.source,p.name)),f.data[i]);
  const reused=await downloadParts(f.source,f.releaseFile,{...f.options,fetch:async()=>{throw Error('unexpected network');}});
  assert.ok(reused.every(p=>p.status==='cached'));
});
test('bad hash, oversized/truncated body, wrong content length and HTTP errors fail closed',async t=>{
  for(const response of [
    ()=>new Response(Buffer.from('video-firsX')),
    ()=>new Response(Buffer.from('video-first-extra')),
    ()=>new Response(Buffer.from('short')),
    ()=>new Response(Buffer.from('video-first'),{headers:{'content-length':'999'}}),
    ()=>new Response('missing',{status:404}),
  ]){
    const f=fixture(t);
    await assert.rejects(()=>downloadParts(f.source,f.releaseFile,{...f.options,fetch:async()=>response()}));
    assert.equal(fs.existsSync(path.join(f.source,f.manifest.parts[0].name)),false);
    assert.equal(fs.readdirSync(f.source).some(p=>p.endsWith('.download')),false);
  }
});
test('path traversal, archive pin mismatch, bad order and different repository stop before network',async t=>{
  for(const change of [
    f=>{f.manifest.parts[0].name='../private';},
    f=>{f.release.archiveSHA256='0'.repeat(64);},
    f=>{f.manifest.parts.reverse();},
    f=>{f.release.repository='different/repo';},
    f=>{f.release.tag='../bad';},
    f=>{f.manifest.parts[0].bytes=-1;},
  ]){
    const f=fixture(t);change(f);f.save();
    await assert.rejects(()=>downloadParts(f.source,f.releaseFile,{...f.options,fetch:async()=>{assert.fail('network must not run');}}));
  }
});
test('corrupt existing file is replaced only after a fully verified download',async t=>{
  const f=fixture(t),target=path.join(f.source,f.manifest.parts[0].name);
  fs.writeFileSync(target,'old');
  await assert.rejects(()=>downloadParts(f.source,f.releaseFile,{...f.options,fetch:async()=>new Response('bad')}));
  assert.equal(fs.readFileSync(target,'utf8'),'old');
  await downloadParts(f.source,f.releaseFile,f.options);
  assert.deepEqual(fs.readFileSync(target),f.data[0]);
});
test('transient HTTP failure retries without leaving partial output',async t=>{
  const f=fixture(t);let calls=0;
  const result=await downloadParts(f.source,f.releaseFile,{...f.options,attempts:2,fetch:async url=>{
    if(++calls===1)return new Response('busy',{status:503});
    return f.options.fetch(url);
  }});
  assert.equal(calls,3);assert.equal(result.length,2);
});
