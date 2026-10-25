(function (root) {
  'use strict';
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key,value] of Object.entries(attrs)) {
      if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'className') node.className = value;
      else node.setAttribute(key, String(value));
    }
    for (const child of children.flat()) if (child != null) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
    return node;
  }
  const number = n => n == null ? '—' : new Intl.NumberFormat('en-US').format(n);
  function dateLabel(value) {
    if (!value) return 'Date unavailable';
    const d = new Date(value.length === 10 ? value+'T12:00:00Z' : value);
    return Number.isNaN(d.getTime()) ? 'Date unavailable' : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  }
  function period(r) {
    return r.from && r.through ? dateLabel(r.from)+' – '+dateLabel(r.through) : 'Reporting dates unavailable';
  }
  function link(url, label) {
    try {
      const u = new URL(url);
      if (u.protocol === 'https:' && !u.username && !u.password) return el('a',{href:u.href,target:'_blank',rel:'noreferrer noopener'}, label);
    } catch {}
    return el('span',{},label);
  }
  function chart(points) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 320 60'); svg.setAttribute('class','ledger-chart');
    svg.setAttribute('role','img'); svg.setAttribute('aria-label','Displayed subscriber counts across '+points.length+' saved observations. Open saved observations for individual values.');
    const min = Math.min(...points.map(p=>p.value)), max = Math.max(...points.map(p=>p.value));
    const first = Date.parse(points[0].at), last = Date.parse(points.at(-1).at);
    const path = document.createElementNS(svg.namespaceURI,'polyline');
    const locations = points.map(p => [10+300*(Date.parse(p.at)-first)/(last-first || 1), 45-30*(p.value-min)/(max-min || 1)].join(','));
    path.setAttribute('points', locations.join(' ')); path.setAttribute('fill','none');
    path.setAttribute('stroke','#c35d6b'); path.setAttribute('stroke-width','2.5'); path.setAttribute('stroke-linejoin','round');
    svg.append(path); return svg;
  }
  function loading(container) {
    container.replaceChildren(el('div',{className:'ledger-loading',role:'status'},el('span',{className:'ledger-spinner','aria-hidden':'true'}),'Reading public channel data…'));
  }
  function error(container, message, onRetry) {
    const box = el('div',{className:'ledger-error',role:'alert'}, message);
    if (onRetry) box.append(el('div',{className:'ledger-actions'},el('button',{className:'ledger-button',onClick:onRetry},'Try again')));
    container.replaceChildren(box);
  }
  function render(container, state, actions = {}) {
    const {channel,records,history} = state;
    const selected = records[0];
    const head = el('div',{className:'ledger-head'},el('div',{},
      el('div',{className:'ledger-brand'},el('span',{className:'ledger-mark','aria-hidden':'true'},'↘'),'Subscriber Loss Ledger'),
      el('h1',{className:'ledger-title'},channel.title),
      el('div',{className:'ledger-small'},'Public evidence · '+(state.recording ? 'Local history on' : 'History recording paused'))));
    if (actions.onClose) head.append(el('button',{className:'ledger-icon','aria-label':'Close subscriber loss panel',onClick:actions.onClose},'×'));
    const hero = selected ? el('section',{className:'ledger-hero','aria-label':'Published subscriber loss record'},
      el('div',{className:'ledger-kicker'},'Reported subscribers lost'),
      el('div',{className:'ledger-number'},number(selected.losses)),
      el('div',{className:'ledger-period'},period(selected)),
      el('p',{className:'ledger-note'},selected.label),
      el('p',{className:'ledger-note'},link(selected.sourceUrl,'Read source'), ' · '+selected.sourceLocation)) :
      el('section',{className:'ledger-hero'},el('div',{className:'ledger-kicker'},'Reported subscribers lost'),
        el('div',{className:'ledger-number empty'},'Not disclosed'),
        el('p',{className:'ledger-note'},'No reviewed public loss report is included for this channel.'));
    const status = el('div',{className:'ledger-status'},el('span',{className:'ledger-dot','aria-hidden':'true'}),
      el('span',{},el('strong',{},'Lifetime total today: unknown.'),' Public subscriber counts do not reveal all unsubscribes.'));
    const stats = el('section',{className:'ledger-section'},el('h2',{},'Public count history'),
      el('div',{className:'ledger-stats'},
        el('div',{},el('div',{className:'ledger-kicker'},'Displayed subscribers'),
          el('div',{className:'ledger-stat'},channel.subscribers ? (channel.subscribers.abbreviated ? '≈' : '')+number(channel.subscribers.value) : 'Hidden / unavailable')),
        el('div',{},el('div',{className:'ledger-kicker'},'Count drops observed'),
          el('div',{className:'ledger-stat'},history.decreases == null ? '—' : (history.approximate ? '≈' : '')+number(history.decreases)))));
    if (history.points.length > 1) {
      stats.append(chart(history.points),el('div',{className:'ledger-small'},dateLabel(history.from)+' – '+dateLabel(history.through)+' · '+history.points.length+' observations'));
      const observations = el('details',{className:'ledger-details'},el('summary',{},'Saved observations'));
      for (const p of history.points.slice().reverse()) observations.append(el('div',{className:'ledger-record'},dateLabel(p.at)+' · '+p.text));
      stats.append(observations);
    } else stats.append(el('div',{className:'ledger-history-empty'},history.points.length ? 'First count saved. Visit again later to build a history.' : 'No saved counts yet. Enable local history to record counts when you visit or look up a channel.'));
    stats.append(el('p',{className:'ledger-note'},'Count drops are decreases between saved displayed totals. Rounding and account removals can affect them; they are not gross subscriber losses.'));
    const sections = [head,hero,status,stats];
    if (records.length) {
      const details = el('details',{className:'ledger-details'},el('summary',{},'Public evidence · '+records.length+' record'+(records.length===1?'':'s')));
      if (records.length>1) details.append(el('p',{className:'ledger-note'},'Reporting periods may overlap. These records are not added together.'));
      for (const r of records) details.append(el('article',{className:'ledger-record'},
        el('strong',{},number(r.losses)+' reported losses · '+r.label),el('div',{},period(r)),
        el('p',{className:'ledger-muted'},r.note),link(r.sourceUrl,'View original source'), ' · '+r.sourceLocation));
      sections.push(details);
    }
    const buttons = el('div',{className:'ledger-actions'});
    if (actions.onRefresh) buttons.append(el('button',{className:'ledger-button',onClick:actions.onRefresh},'Refresh public count'));
    if (actions.onLibrary) buttons.append(el('button',{className:'ledger-button primary',onClick:actions.onLibrary},'Lookup & history'));
    sections.push(buttons,el('p',{className:'ledger-foot'},'Public count checked '+dateLabel(channel.fetchedAt)+'. Source registry reviewed '+dateLabel(state.registryReviewedOn)+'.'));
    container.replaceChildren(...sections);
  }
  root.LossLedgerUI = {el,number,dateLabel,period,link,chart,loading,error,render};
})(globalThis);
