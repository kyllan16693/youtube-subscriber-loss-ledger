'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..');
const {fixture}=require('./synthetic_pages.cjs');
const fixtureFiles={
 '/c/kenjee1':'public_input_sources/ken_jee-verified-about.html',
 '/@KenJee_ds':'public_input_sources/ken_jee-verified-about.html',
 '/channel/UCiT9RITQ9PW6BhXK0y2jaeg':'public_input_sources/ken_jee-verified-about.html',
 '/@MrBeast':'public_input_sources/mrbeast-about.html',
 '/channel/UCX6OQ3DkcsbYNE6H8uQQuVA':'public_input_sources/mrbeast-about.html',
 '/user/saurabhschool':'public_input_sources/saurabhschool-about.html',
 '/channel/UCZSfwNcYIpqO8B9wnBg4HWA':'public_input_sources/saurabhschool-about.html',
 '/user/GeneralShaleBrick':'public_input_sources/general_shale-about.html',
 '/channel/UC9UFpCljyEsj4kQ9CjvoPYQ':'public_input_sources/general_shale-about.html',
 '/@FIRESafeMARIN':'matched_control_sources/marin-about.html',
 '/channel/UCiD4JVMf9z7YiO2lj_f6uew':'matched_control_sources/marin-about.html',
};
function harness(options={}){
 let listener;const data={...(options.initial||{})},requests=[];
 const chrome={tabs:{get:async()=>({url:options.tabUrl})},runtime:{id:'ledger-test-id',getURL:p=>'chrome-extension://ledger-test-id/'+p,
   openOptionsPage:async()=>{},onMessage:{addListener:fn=>listener=fn}},storage:{local:{
     get:async key=>({[key]:structuredClone(data[key])}),
     set:async values=>{if(options.writeDelay)await new Promise(r=>setTimeout(r,options.writeDelay));Object.assign(data,structuredClone(values));},
     setAccessLevel:async()=>{},
   }}};
 const context=vm.createContext({chrome,URL,AbortSignal,structuredClone,setTimeout,clearTimeout,console,Date,
   fetch:async(url,opts)=>{requests.push({url,opts});if(options.fetch)return options.fetch(url,opts);
     const route=new URL(url).pathname.replace(/\/about$/,'');const file=fixtureFiles[route];
     if(!file)return {ok:false,status:404,url,headers:new Headers()};
     return {ok:true,status:200,url,headers:new Headers(),text:async()=>fixture(file)};
   }});
 context.importScripts=(...files)=>{for(const f of files)vm.runInContext(fs.readFileSync(path.join(base,'extension',f),'utf8'),context,{filename:f});};
 vm.runInContext(fs.readFileSync(path.join(base,'extension/background.js'),'utf8'),context,{filename:'background.js'});
 const request=(message,sender={id:chrome.runtime.id,url:chrome.runtime.getURL('library.html')})=>new Promise(resolve=>listener(message,sender,resolve));
 return {request,data,requests,chrome,context};
}
module.exports={harness,fixtureFiles};
