'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../extension/core.js');
const root=path.join(__dirname,'..');
const {fixture}=require('./synthetic_pages.cjs');
const ken='UCiT9RITQ9PW6BhXK0y2jaeg';
const channel=(value,at='2026-10-22T10:00:00.000Z')=>({id:ken,title:'Ken Jee',url:'https://www.youtube.com/@KenJee_ds',subscribers:{text:value+' subscribers',value,abbreviated:false,step:1},fetchedAt:at});

test('accepts only channel routes on HTTPS YouTube',()=>{
 for(const [s,route] of [['@KenJee_ds','/@KenJee_ds'],['youtube.com/@KenJee_ds','/@KenJee_ds'],['https://www.youtube.com/@KenJee_ds/videos?x=1','/@KenJee_ds'],[ken,'/channel/'+ken],['/user/saurabhschool/about','/user/saurabhschool']])assert.equal(C.channelRoute(s),route);
 for(const s of ['https://evil.test/@foo','https://www.youtube.com.evil.test/@foo','javascript:alert(1)','https://name:pass@youtube.com/@foo','https://youtube.com:9999/@foo','https://youtube.com/watch?v=123','https://youtube.com/results?search_query=foo','https://youtube.com/playlist?list=foo','not a channel'])assert.equal(C.channelRoute(s),null,s);
});
test('parses JSON without evaluating page scripts or brace-containing text',()=>{
 const text='var ytInitialData = {"text":"brace } and \\\" quote","n":4}; globalThis.PWNED=true;';
 assert.equal(C.initialData(text).n,4);assert.equal(globalThis.PWNED,undefined);
 assert.throws(()=>C.initialData('var ytInitialData = {run:alert(1)};'));
});
test('keeps hidden/unsupported counts unknown and marks abbreviations',()=>{
 assert.equal(C.count('12.3K subscribers').value,12300);assert.equal(C.count('12.3K subscribers').abbreviated,true);
 assert.equal(C.count('1 subscriber').value,1);assert.equal(C.count('No subscribers').value,0);
 assert.equal(C.count('hidden'),null);assert.equal(C.count(undefined),null);assert.equal(C.count('1,2 M Abonnenten'),null);
});
test('reads and verifies identities on nine synthetic channel structures',()=>{
 const files=[['public_input_sources/ken_jee-verified-about.html','/c/kenjee1',ken],['public_input_sources/saurabhschool-about.html','/user/saurabhschool','UCZSfwNcYIpqO8B9wnBg4HWA'],['public_input_sources/general_shale-about.html','/user/GeneralShaleBrick','UC9UFpCljyEsj4kQ9CjvoPYQ'],['public_input_sources/mrbeast-about.html','/@MrBeast','UCX6OQ3DkcsbYNE6H8uQQuVA'],['public_input_sources/stem-about.html','/@SiguemeLaCorriente','UCmJ64or5eH-aYZs9Ogohq0A'],['public_input_sources/breakway-about.html','/@BreakwayYT','UCO3LHqYvA9KRby_BSE0ndaQ'],['matched_control_sources/nation-about.html','/@NationMun-958','UCX819jN5Te5_GKRgfdIB37g'],['matched_control_sources/bears-about.html','/@BearsandPandas','UCFjQUtG2TNclzWQdD-RIM1g'],['matched_control_sources/marin-about.html','/@FIRESafeMARIN','UCiD4JVMf9z7YiO2lj_f6uew']];
 for(const [file,route,id] of files){const ch=C.parseChannel(fixture(file),route);assert.equal(ch.id,id);assert.ok(ch.title);assert.ok(ch.subscribers);}
});
test('rejects a wrong ID and never uses recommendation counts as channel metadata',()=>{
 assert.throws(()=>C.parseChannel(fixture('matched_control_sources/marin-about.html'),'/channel/'+ken));
 const fake={metadata:{channelMetadataRenderer:{externalId:ken,title:'real'}},recommendation:{subscriberCountText:'999M subscribers'},a:{aboutChannelViewModel:{channelId:ken,canonicalChannelUrl:'https://www.youtube.com/@real'}}};
 assert.equal(C.parseChannel('var ytInitialData = '+JSON.stringify(fake),'/@real').subscribers,null);
 fake.a.aboutChannelViewModel.channelId='UCX6OQ3DkcsbYNE6H8uQQuVA';assert.throws(()=>C.parseChannel('var ytInitialData = '+JSON.stringify(fake),'/@real'));
});
test('first observation does not become zero lifetime loss or zero measured decline',()=>{
 const ledger=C.observe({},channel(100));assert.equal(C.historySummary(ledger[ken]).decreases,null);
 assert.equal(C.historySummary({points:[]}).decreases,null);
});
test('separates observed displayed decreases from gains and preserves precision',()=>{
 let ledger=C.observe({},channel(100));ledger=C.observe(ledger,channel(90,'2026-10-22T11:00:00.000Z'),'2026-10-22T11:00:00.000Z');
 const next=channel(95,'2026-10-22T12:00:00.000Z');next.subscribers.abbreviated=true;ledger=C.observe(ledger,next,next.fetchedAt);
 const s=C.historySummary(ledger[ken]);assert.equal(s.decreases,10);assert.equal(s.dropIntervals,1);assert.equal(s.approximate,true);
 assert.equal(s.lifetimeLosses,undefined);
});
test('ignores stale/out-of-order cached observations and bounds local history',()=>{
 let ledger=C.observe({},channel(100));ledger=C.observe(ledger,channel(90,'2026-10-22T09:00:00.000Z'),'2026-10-22T09:00:00.000Z');assert.equal(ledger[ken].points.length,1);
 const saved=channel(100);ledger=C.observe(ledger,saved,'2026-10-22T17:00:00.000Z');assert.equal(ledger[ken].points.length,1);
 for(let i=1;i<=130;i++){const at=new Date(Date.UTC(2026,9,22,10,i)).toISOString();ledger=C.observe(ledger,channel(100+i,at),at);}
 assert.equal(ledger[ken].points.length,C.MAX_POINTS);
 const hidden=channel(100);hidden.subscribers=null;assert.deepEqual(C.observe(ledger,hidden),ledger);
});
test('retains at most 100 channels, evicting oldest observations',()=>{
 let ledger={};for(let i=0;i<101;i++){const ch=channel(i,new Date(Date.UTC(2026,9,22,0,i)).toISOString());ch.id='UC'+String(i).padStart(22,'0');ledger=C.observe(ledger,ch,ch.fetchedAt);}
 assert.equal(Object.keys(ledger).length,100);assert.equal(ledger['UC'+'0'.repeat(22)],undefined);
});
test('bundled reports have reviewed IDs, source citations, scope and dates',()=>{
 const context={};vm.runInNewContext(fs.readFileSync(path.join(root,'extension/registry.js'),'utf8'),context);
 const registry=context.LossLedgerRegistry;assert.equal(registry.channels.length,4);
 assert.equal(registry.channels.flatMap(c=>c.records).length,10);
 for(const c of registry.channels){assert.match(c.id,C.ID);for(const r of c.records){assert.equal(r.completeLifetimeToday,false);assert.ok(Number.isInteger(r.losses));assert.match(r.sourceUrl,/^https:\/\//);assert.ok(r.sourceLocation);assert.ok(r.label);}}
 assert.equal(C.recordsFor(registry,'UC'+'a'.repeat(22)).length,0);
 const marin=C.recordsFor(registry,'UCiD4JVMf9z7YiO2lj_f6uew');assert.equal(marin[0].losses,38);assert.equal(marin[0].through,'2025-01-31');
});
test('similarly named channels never inherit another channel’s loss disclosure',()=>{
 const context={};vm.runInNewContext(fs.readFileSync(path.join(root,'extension/registry.js'),'utf8'),context);
 const wrong=C.parseChannel(fixture('public_input_sources/ken_jee-about.html'),'/@KenJee');
 assert.equal(wrong.id,'UCNFLBcdchuJ1SbfBAvV3gjw');assert.notEqual(wrong.id,ken);
 assert.equal(C.recordsFor(context.LossLedgerRegistry,wrong.id).length,0);
});
