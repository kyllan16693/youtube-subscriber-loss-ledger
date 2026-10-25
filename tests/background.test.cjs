'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {harness}=require('./worker_harness.cjs');
const ken='UCiT9RITQ9PW6BhXK0y2jaeg',beast='UCX6OQ3DkcsbYNE6H8uQQuVA';
test('channel lookup connects synthetic fixture parsing, citations, storage and history',async()=>{
 const h=harness();const r=await h.request({type:'LOOKUP',input:'@KenJee_ds'});
 assert.equal(r.ok,true);assert.equal(r.data.channel.id,ken);assert.equal(r.data.records[0].losses,45790);
 assert.equal(h.data.ledger[ken].points.length,1);assert.equal(r.data.history.decreases,null);
 assert.equal(h.requests[0].opts.credentials,'omit');assert.equal(h.requests[0].url,'https://www.youtube.com/@KenJee_ds/about?hl=en&gl=US');
});
test('concurrent channel lookups do not overwrite another saved channel',async()=>{
 const h=harness({writeDelay:10});const rs=await Promise.all([h.request({type:'LOOKUP',input:'@KenJee_ds'}),h.request({type:'LOOKUP',input:'@MrBeast'})]);
 assert.ok(rs.every(r=>r.ok));assert.equal(Object.keys(h.data.ledger).length,2);assert.ok(h.data.ledger[ken]);assert.ok(h.data.ledger[beast]);
});
test('unknown report is not zero, public requests cache and refresh explicitly',async()=>{
 const h=harness();let r=await h.request({type:'LOOKUP',input:'@MrBeast'});assert.equal(r.data.records.length,0);
 await h.request({type:'LOOKUP',input:'@MrBeast'});assert.equal(h.requests.length,1);
 await h.request({type:'LOOKUP',input:'@MrBeast',force:true});assert.equal(h.requests.length,2);
});
test('invalid hosts and unsupported routes never fetch',async()=>{
 const h=harness();for(const input of ['https://evil.test/@x','https://youtube.com/watch?v=foo','https://youtube.com:123/@test'])assert.equal((await h.request({type:'LOOKUP',input})).ok,false);
 assert.equal(h.requests.length,0);
});
test('YouTube content cannot read all history, delete history, or spoof another input',async()=>{
 const h=harness();const sender={id:h.chrome.runtime.id,url:'https://www.youtube.com/@MrBeast',tab:{incognito:false}};
 assert.equal((await h.request({type:'LIBRARY'},sender)).ok,false);
 assert.equal((await h.request({type:'DELETE_CHANNEL',id:ken},sender)).ok,false);
 assert.equal((await h.request({type:'LOOKUP',input:'@KenJee_ds'},sender)).ok,false);
 const r=await h.request({type:'LOOKUP',input:'@MrBeast'},sender);assert.equal(r.data.channel.id,beast);
 assert.equal((await h.request({type:'LOOKUP',input:'@MrBeast'},{id:'other-id',url:sender.url})).ok,false);
});
test('incognito and recording pause do not save observations',async()=>{
 const h=harness();let r=await h.request({type:'LOOKUP',input:'@MrBeast',incognito:true});assert.equal(r.data.recording,false);assert.equal(h.data.ledger,undefined);
 await h.request({type:'RECORDING',enabled:false});r=await h.request({type:'LOOKUP',input:'@MrBeast'});assert.equal(r.data.recording,false);assert.equal(h.data.ledger,undefined);
 await h.request({type:'RECORDING',enabled:true});await h.request({type:'LOOKUP',input:'@MrBeast'});assert.ok(h.data.ledger[beast]);
});
test('deletion removes only requested channel and settings survive',async()=>{
 const h=harness();await h.request({type:'LOOKUP',input:'@MrBeast'});await h.request({type:'LOOKUP',input:'@KenJee_ds'});
 await h.request({type:'RECORDING',enabled:false});assert.equal((await h.request({type:'DELETE_CHANNEL',id:ken})).ok,true);
 const r=await h.request({type:'LIBRARY'});assert.equal(r.data.ledger[ken],undefined);assert.ok(r.data.ledger[beast]);assert.equal(r.data.settings.recordVisits,false);
});
test('content lookup follows current tab URL after SPA navigation, not stale sender.url',async()=>{
 const h=harness({tabUrl:'https://www.youtube.com/@MrBeast'});
 const sender={id:h.chrome.runtime.id,url:'https://www.youtube.com/@KenJee_ds',tab:{id:7,incognito:false}};
 const r=await h.request({type:'LOOKUP',input:'/@MrBeast'},sender);
 assert.equal(r.ok,true);assert.equal(r.data.channel.id,beast);
});
test('consent/HTTP/identity failures do not enter saved counts',async()=>{
 for(const fetch of [async()=>({ok:false,status:429}),async()=>({ok:true,url:'https://consent.youtube.com/',headers:new Headers(),text:async()=>''}),async()=>({ok:true,url:'https://www.youtube.com/@test/about',headers:new Headers(),text:async()=>'<html>Consent</html>'})]){
   const h=harness({fetch});const r=await h.request({type:'LOOKUP',input:'@test'});assert.equal(r.ok,false);assert.equal(h.data.ledger,undefined);
 }
});
