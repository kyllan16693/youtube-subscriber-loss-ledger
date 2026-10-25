'use strict';
importScripts('core.js', 'registry.js');
const Core = globalThis.LossLedgerCore;
const Registry = globalThis.LossLedgerRegistry;
const cache = new Map();
const pending = new Map();
let writes = Promise.resolve();

function serialize(task) {
  const next = writes.then(task, task);
  writes = next.catch(() => {});
  return next;
}

async function settings() {
  return {recordVisits:true, ...(await chrome.storage.local.get('settings')).settings};
}

async function publicChannel(route, force = false) {
  const saved = cache.get(route);
  if (!force && saved && Date.now()-Date.parse(saved.fetchedAt)<10*60*1000) return saved;
  if (pending.has(route)) return pending.get(route);
  const task = (async () => {
    const url = 'https://www.youtube.com'+route+'/about?hl=en&gl=US';
    const response = await fetch(url, {credentials:'omit', redirect:'follow', signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('YouTube returned HTTP '+response.status+'. Try again later.');
    if (new URL(response.url).origin !== 'https://www.youtube.com') throw new Error('YouTube redirected away from the public channel page.');
    if (Number(response.headers.get('content-length')) > 8_000_000) throw new Error('The public page is too large to read.');
    const channel = Core.parseChannel(await response.text(), route);
    cache.set(route, channel);
    if (cache.size > 100) cache.delete(cache.keys().next().value);
    return channel;
  })();
  pending.set(route, task);
  try { return await task; } finally { pending.delete(route); }
}

async function lookup(input, force = false, incognito = false) {
  const route = Core.channelRoute(input);
  if (!route) throw new Error('Enter a YouTube channel URL, @handle, or channel ID.');
  const channel = await publicChannel(route, force);
  return serialize(async () => {
    const prefs = await settings();
    let ledger = (await chrome.storage.local.get('ledger')).ledger || {};
    if (prefs.recordVisits && !incognito) {
      ledger = Core.observe(ledger, channel, channel.fetchedAt);
      await chrome.storage.local.set({ledger});
    }
    return {channel, records:Core.recordsFor(Registry, channel.id),
      history:Core.historySummary(ledger[channel.id]), settings:prefs,
      recording:!!prefs.recordVisits && !incognito, registryReviewedOn:Registry.reviewedOn};
  });
}

function trustedPage(sender) {
  return sender.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL(''));
}

async function handle(message, sender) {
  if (sender.id !== chrome.runtime.id) throw new Error('Unrecognized extension request.');
  const extensionPage = trustedPage(sender);
  if (!extensionPage && !/^https:\/\/www\.youtube\.com\//.test(sender.url || '')) throw new Error('Unsupported page.');
  if (message.type === 'LOOKUP') {
    let input = message.input;
    if (!extensionPage) {
      // sender.url can retain the document's original URL after an SPA route
      // change. Read the current tab URL to verify the requested channel.
      const tab = sender.tab?.id != null ? await chrome.tabs.get(sender.tab.id) : null;
      input = tab?.url || sender.url;
      if (Core.channelRoute(message.input) !== Core.channelRoute(input)) throw new Error('The channel changed. Refresh the panel to check the current channel.');
    }
    return lookup(input, message.force === true, !!sender.tab?.incognito || !!message.incognito);
  }
  if (message.type === 'SETTINGS') return settings();
  if (message.type === 'OPEN_LIBRARY') {
    await chrome.runtime.openOptionsPage();
    return {opened:true};
  }
  if (!extensionPage) throw new Error('Open the extension to manage saved history.');
  if (message.type === 'LIBRARY') {
    return {ledger:(await chrome.storage.local.get('ledger')).ledger || {},
      settings:await settings(), channels:Registry.channels.map(c => ({id:c.id,name:c.name})), reviewedOn:Registry.reviewedOn};
  }
  if (message.type === 'RECORDING') {
    return serialize(async () => {
      const prefs = {...await settings(), recordVisits:message.enabled === true};
      await chrome.storage.local.set({settings:prefs});
      return prefs;
    });
  }
  if (message.type === 'DELETE_CHANNEL') {
    if (!Core.ID.test(message.id || '')) throw new Error('Invalid channel ID.');
    return serialize(async () => {
      const ledger = (await chrome.storage.local.get('ledger')).ledger || {};
      delete ledger[message.id];
      await chrome.storage.local.set({ledger});
      return {deleted:true};
    });
  }
  throw new Error('Unsupported request.');
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  handle(message || {}, sender).then(data => reply({ok:true,data}), error => reply({ok:false,error:error.message || 'The request could not be completed.'}));
  return true;
});
// History remains readable only by trusted extension pages/service worker.
chrome.storage.local.setAccessLevel?.({accessLevel:'TRUSTED_CONTEXTS'}).catch(() => {});
