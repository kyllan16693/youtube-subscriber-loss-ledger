(function () {
  'use strict';
  if (globalThis.__lossLedgerMounted) return;
  globalThis.__lossLedgerMounted = true;
  const Core = globalThis.LossLedgerCore, UI = globalThis.LossLedgerUI;
  let host, shadow, panel, toggle, currentRoute = null, sequence = 0, active = false;

  function mount() {
    if (host?.isConnected) return;
    active = false;
    host = document.createElement('div'); host.id = 'subscriber-loss-ledger';
    host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483000;';
    shadow = host.attachShadow({mode:'open'});
    const style = UI.el('style',{},globalThis.LossLedgerStyles+`
      .panel { width:370px; max-width:calc(100vw - 32px); max-height:75vh; overflow:auto; margin-bottom:10px; }
      .toggle { display:block; margin-left:auto; border:1px solid #dfd2d6; background:#fff; color:#8c2635; border-radius:50px; padding:10px 15px; font:650 12px/1.4 system-ui; box-shadow:0 5px 20px #0002; cursor:pointer; }
      [hidden] { display:none!important; } @media(prefers-color-scheme:dark) { .toggle { background:#282329; color:#f18e9a; border-color:#59404a; } }
    `);
    panel = UI.el('div',{className:'ledger-card panel',hidden:'',role:'region','aria-label':'YouTube subscriber loss evidence'});
    toggle = UI.el('button',{className:'toggle','aria-expanded':'false','aria-label':'Open subscriber loss evidence',onClick:()=>{
      active = !active; panel.hidden = !active; toggle.setAttribute('aria-expanded',String(active));
    }},'↘ Subscriber losses');
    shadow.append(style,panel,toggle); document.documentElement.append(host);
  }

  async function update(force = false) {
    const route = Core.channelRoute(location.href);
    if (!route) { currentRoute = null; sequence++; host?.remove(); return; }
    if (!force && route===currentRoute && host?.isConnected) return;
    currentRoute = route; const token = ++sequence;
    mount(); UI.loading(panel); toggle.textContent = '↘ Subscriber losses';
    try {
      const result = await chrome.runtime.sendMessage({type:'LOOKUP',input:route,force});
      if (token!==sequence || route!==Core.channelRoute(location.href)) return;
      if (!result?.ok) throw new Error(result?.error || 'Extension connection unavailable. Reload this page.');
      UI.render(panel,result.data,{onRefresh:()=>update(true),onClose:()=>{
        active=false;panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();
      },onLibrary:()=>chrome.runtime.sendMessage({type:'OPEN_LIBRARY'})});
      toggle.textContent = result.data.records.length ? '↘ '+UI.number(result.data.records[0].losses)+' reported losses' : '↘ Subscriber losses · No public total';
    } catch (error) {
      if (token!==sequence) return;
      UI.error(panel,error.message,()=>update(true)); toggle.textContent='↘ Subscriber losses · Check unavailable';
    }
  }
  document.addEventListener('yt-navigate-finish',()=>update());
  window.addEventListener('popstate',()=>update());
  // SPA history events can differ by YouTube layout. This only checks the URL;
  // it never polls network counts, and resolves only on a changed channel route.
  setInterval(()=>{ if (Core.channelRoute(location.href)!==currentRoute) update(); },1500);
  update();
})();
