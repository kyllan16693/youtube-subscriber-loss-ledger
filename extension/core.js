(function (root) {
  'use strict';
  const ID = /^UC[A-Za-z0-9_-]{22}$/;
  const MAX_CHANNELS = 100;
  const MAX_POINTS = 120;
  const sixHours = 6 * 60 * 60 * 1000;

  function channelRoute(input) {
    if (typeof input !== 'string' || input.length > 500) return null;
    let url;
    try {
      if (/^(?:www\.)?youtube\.com\//i.test(input)) input = 'https://' + input;
      if (ID.test(input)) input = '/channel/' + input;
      if (input.startsWith('@')) input = '/' + input;
      url = new URL(input, 'https://www.youtube.com');
    } catch { return null; }
    if (url.protocol !== 'https:' || !['www.youtube.com', 'youtube.com'].includes(url.hostname) || url.port || url.username || url.password) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    let route;
    if (/^@[^\s/<>?#]{1,100}$/u.test(parts[0] || '')) route = '/' + parts[0];
    else if (parts[0] === 'channel' && ID.test(parts[1] || '')) route = '/channel/' + parts[1];
    else if (['c', 'user'].includes(parts[0]) && /^[\w.%~-]{1,100}$/.test(parts[1] || '')) route = '/' + parts[0] + '/' + parts[1];
    return route || null;
  }

  function initialData(html) {
    if (typeof html !== 'string' || html.length > 8_000_000) throw new Error('The public page could not be read.');
    const marker = /(?:var\s+ytInitialData\s*=|window\["ytInitialData"\]\s*=|(?:^|[;\s])ytInitialData\s*=)\s*/g;
    let match;
    while ((match = marker.exec(html))) {
      const start = marker.lastIndex;
      if (html[start] !== '{') continue;
      let depth = 0, quoted = false, escaped = false;
      for (let i = start; i < html.length; i++) {
        const c = html[i];
        if (quoted) {
          if (escaped) escaped = false;
          else if (c === '\\') escaped = true;
          else if (c === '"') quoted = false;
        } else if (c === '"') quoted = true;
        else if (c === '{') depth++;
        else if (c === '}' && --depth === 0) {
          try { return JSON.parse(html.slice(start, i + 1)); } catch { break; }
        }
      }
    }
    throw new Error('YouTube did not return a readable public channel page.');
  }

  function findKey(data, key) {
    const stack = [data];
    let visited = 0;
    while (stack.length && visited++ < 200_000) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (Object.hasOwn(node, key)) return node[key];
      for (const child of Object.values(node)) if (child && typeof child === 'object') stack.push(child);
    }
    return null;
  }

  function count(text) {
    if (typeof text !== 'string') return null;
    if (/^No (subscribers|views|videos)$/i.test(text.trim())) return {text, value:0, abbreviated:false, step:1};
    const m = text.trim().match(/^([\d,]+(?:\.\d+)?)\s*([KMB])?\s+(?:subscribers?|views?|videos?)$/i);
    if (!m) return null;
    const scale = {K:1000, M:1_000_000, B:1_000_000_000}[m[2]?.toUpperCase()] || 1;
    const number = Number(m[1].replaceAll(',', ''));
    const value = Math.round(number * scale);
    if (!Number.isSafeInteger(value) || value < 0) return null;
    return {text, value, abbreviated:!!m[2], step:scale / 10 ** ((m[1].split('.')[1] || '').length)};
  }

  function parseChannel(html, requestedRoute, now = new Date().toISOString()) {
    const route = channelRoute(requestedRoute);
    if (!route) throw new Error('Enter a YouTube channel URL, handle, or channel ID.');
    const data = initialData(html);
    const meta = data.metadata?.channelMetadataRenderer;
    const about = findKey(data, 'aboutChannelViewModel');
    if (!ID.test(meta?.externalId || '') || about?.channelId !== meta.externalId) throw new Error('The channel identity could not be verified.');
    if (route.startsWith('/channel/') && route.slice(9) !== meta.externalId) throw new Error('The returned channel does not match the requested ID.');
    const canonicalRoute = channelRoute(about.canonicalChannelUrl);
    return {
      id:meta.externalId, title:String(meta.title || 'YouTube channel').slice(0, 200),
      url:'https://www.youtube.com' + (canonicalRoute || '/channel/' + meta.externalId),
      route, joinedDisplay:about.joinedDateText?.content || null,
      subscribers:count(about.subscriberCountText), views:count(about.viewCountText),
      videos:count(about.videoCountText), fetchedAt:now,
    };
  }

  function observe(ledger, channel, now = channel?.fetchedAt || new Date().toISOString()) {
    const output = structuredClone(ledger || {});
    if (!ID.test(channel?.id || '') || !channel.subscribers || !Number.isSafeInteger(channel.subscribers.value)) return output;
    const entry = output[channel.id] || {id:channel.id, title:channel.title, url:channel.url, points:[]};
    entry.title = channel.title; entry.url = channel.url;
    const last = entry.points.at(-1);
    const stamp = Date.parse(now);
    if (!Number.isFinite(stamp) || (last && stamp <= Date.parse(last.at))) return output;
    // Same cached observation does not become a fresh historical measurement.
    if (channel.fetchedAt !== now && last && Date.parse(channel.fetchedAt) <= Date.parse(last.at)) return output;
    if (!last || last.value !== channel.subscribers.value || stamp - Date.parse(last.at) >= sixHours) {
      entry.points.push({at:now, ...channel.subscribers});
      entry.points = entry.points.slice(-MAX_POINTS);
    }
    output[channel.id] = entry;
    const keys = Object.keys(output).sort((a,b) => Date.parse(output[b].points.at(-1)?.at || 0) - Date.parse(output[a].points.at(-1)?.at || 0));
    for (const key of keys.slice(MAX_CHANNELS)) delete output[key];
    return output;
  }

  function historySummary(entry) {
    const points = entry?.points || [];
    let decreases = 0, dropIntervals = 0, approximate = false;
    for (let i = 1; i < points.length; i++) {
      const previous = points[i-1], current = points[i];
      approximate ||= previous.abbreviated || current.abbreviated;
      if (previous.value > current.value) { decreases += previous.value-current.value; dropIntervals++; }
    }
    return {points, decreases:points.length > 1 ? decreases : null, dropIntervals,
      approximate, from:points[0]?.at || null, through:points.at(-1)?.at || null};
  }

  function recordsFor(registry, channelId) {
    return (registry.channels.find(c => c.id === channelId)?.records || []).slice()
      .sort((a,b) => String(b.through || '').localeCompare(String(a.through || '')));
  }

  const api = {ID, MAX_CHANNELS, MAX_POINTS, channelRoute, initialData, findKey, count, parseChannel, observe, historySummary, recordsFor};
  root.LossLedgerCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
