'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'../extension');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if(manifest.manifest_version!==3) throw new Error('Manifest V3 required');
const assets=[manifest.background.service_worker,manifest.action.default_popup,manifest.options_ui.page,
  ...Object.values(manifest.icons),...manifest.content_scripts.flatMap(c=>c.js)];
for(const asset of assets)if(!fs.existsSync(path.join(root,asset)))throw new Error('Missing extension asset: '+asset);
for(const asset of fs.readdirSync(root).filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',path.join(root,asset)]);
if(JSON.stringify(manifest.permissions)!==JSON.stringify(['storage','activeTab']))throw new Error('Unexpected broad permission');
if(manifest.host_permissions.join('')!=='https://www.youtube.com/*')throw new Error('Unexpected remote host');
for(const page of ['popup.html','library.html']){
 const text=fs.readFileSync(path.join(root,page),'utf8');
 if(/<script(?![^>]*\bsrc=)[^>]*>/i.test(text)||/\son\w+=/i.test(text))throw new Error('Inline scripts are not compatible with extension CSP');
 for(const m of text.matchAll(/(?:src|href)="([^"#]+)"/g))if(!m[1].startsWith('https:')&&!fs.existsSync(path.join(root,m[1])))throw new Error('Missing HTML asset: '+m[1]);
}
console.log('Manifest, permissions, script syntax, CSP-compatible HTML, and packaged assets checked.');
