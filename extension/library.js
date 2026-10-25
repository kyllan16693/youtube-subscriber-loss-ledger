'use strict';
document.head.append(LossLedgerUI.el('style',{},LossLedgerStyles));
const UI = LossLedgerUI, app = document.getElementById('app'), field = document.getElementById('channel');
const status = document.getElementById('status'), check = document.getElementById('check'), record = document.getElementById('record');
let sequence = 0, currentState = null;
async function message(payload) {
  const result = await chrome.runtime.sendMessage(payload);
  if (!result?.ok) throw new Error(result?.error || 'The extension connection is unavailable.');
  return result.data;
}
async function refreshLibrary() {
  const library = await message({type:'LIBRARY'});
  record.checked = library.settings.recordVisits;
  const examples = document.getElementById('examples'); examples.replaceChildren();
  for (const c of library.channels) examples.append(UI.el('button',{className:'channel-link',type:'button',onClick:()=>lookup(c.id)},c.name+' ↗'));
  const saved = document.getElementById('saved'); saved.replaceChildren();
  const entries = Object.values(library.ledger).sort((a,b)=>(b.points.at(-1)?.at || '').localeCompare(a.points.at(-1)?.at || ''));
  if (!entries.length) saved.append(UI.el('p',{className:'ledger-note'},'Your visited channels will appear here.'));
  for (const c of entries) {
    let armed = false;
    const forget = UI.el('button',{className:'forget',type:'button','aria-label':'Forget '+c.title,onClick:async()=>{
      if (!armed) { armed=true;forget.textContent='Confirm';return; }
      try { await message({type:'DELETE_CHANNEL',id:c.id}); await refreshLibrary();
        // Clear the displayed snapshot as well, so it does not imply deleted data remains saved.
        if (currentState?.channel.id===c.id) {
          currentState = null;
          app.replaceChildren(UI.el('p',{className:'ledger-note'},'Saved observations forgotten. Look up the channel again to begin a new history.'));
        }
        status.textContent='Saved observations for '+c.title+' forgotten.';
      } catch(error) { status.textContent=error.message; }
    }},'Forget');
    saved.append(UI.el('div',{className:'saved-item'},UI.el('button',{className:'channel-link',type:'button',onClick:()=>lookup(c.id)},c.title),forget));
  }
  return library;
}
async function lookup(input, force = false) {
  const token = ++sequence; field.value=input; check.disabled=true;
  status.textContent='Checking public channel data…'; UI.loading(app);
  try {
    const data = await message({type:'LOOKUP',input,force,incognito:!!chrome.extension?.inIncognitoContext});
    if (token!==sequence) return;
    currentState = data;
    UI.render(app,data,{onRefresh:()=>lookup(input,true)});
    status.textContent='Public count checked. Loss records below keep their original reporting dates.';
    history.replaceState(null,'','?channel='+encodeURIComponent(data.channel.id));
    await refreshLibrary();
  } catch(error) {
    if (token!==sequence) return;
    UI.error(app,error.message,()=>lookup(input,true));status.textContent='Lookup could not be completed.';
  } finally { if (token===sequence) check.disabled=false; }
}
document.getElementById('lookup').addEventListener('submit',event=>{event.preventDefault();lookup(field.value.trim());});
record.addEventListener('change',async()=>{
  const enabled=record.checked;
  try {await message({type:'RECORDING',enabled});
    if (currentState) {
      currentState.recording=enabled && !chrome.extension?.inIncognitoContext;
      UI.render(app,currentState,{onRefresh:()=>lookup(currentState.channel.url,true)});
    }
    status.textContent=enabled?'Local history enabled.':'Local history paused. Existing observations are kept.';}
  catch(error) {record.checked=!enabled;status.textContent=error.message;}
});
document.getElementById('export').addEventListener('click',async()=>{
  try {
    const data=await message({type:'LIBRARY'});
    const blob=new Blob([JSON.stringify({format:'loss-ledger-observations-v1',exportedAt:new Date().toISOString(),metric:'Displayed public subscriber counts; not gross subscriber losses',ledger:data.ledger},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), anchor=UI.el('a',{href:url,download:'subscriber-count-history.json'});
    document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Local history exported.';
  } catch(error) {status.textContent=error.message;}
});
refreshLibrary().then(()=>{
  const initial = new URL(location.href).searchParams.get('channel');
  if (initial) lookup(initial);
}).catch(error=>{UI.error(app,error.message);});
