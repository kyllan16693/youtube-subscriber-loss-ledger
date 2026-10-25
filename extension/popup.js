'use strict';
document.head.append(LossLedgerUI.el('style',{},LossLedgerStyles));
const app = document.getElementById('app');
async function load(force = false) {
  LossLedgerUI.loading(app);
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!LossLedgerCore.channelRoute(tab?.url || '')) {
      app.replaceChildren(LossLedgerUI.el('div',{className:'ledger-brand'},'Subscriber Loss Ledger'),
        LossLedgerUI.el('h1',{className:'ledger-title'},'Look up a channel'),
        LossLedgerUI.el('p',{className:'ledger-muted'},'Open a YouTube channel, or look one up by URL, @handle, or channel ID.'),
        LossLedgerUI.el('button',{className:'ledger-button primary',onClick:()=>chrome.runtime.openOptionsPage()},'Open lookup & history'));
      return;
    }
    const result = await chrome.runtime.sendMessage({type:'LOOKUP',input:tab.url,force,incognito:!!tab.incognito});
    if (!result?.ok) throw new Error(result?.error || 'Could not connect to the extension.');
    LossLedgerUI.render(app,result.data,{onRefresh:()=>load(true),onLibrary:()=>chrome.runtime.openOptionsPage()});
  } catch (error) { LossLedgerUI.error(app,error.message,()=>load(true)); }
}
load();
