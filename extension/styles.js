globalThis.LossLedgerStyles = `
:host,.ledger-app { font:14px/1.5 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#202127; color-scheme:light; }
* { box-sizing:border-box; } button,input { font:inherit; } button,a,input { -webkit-tap-highlight-color:transparent; }
button { cursor:pointer; } button:disabled { cursor:wait; opacity:.65; } a { color:#a92c39; text-decoration:underline; text-underline-offset:3px; }
button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible { outline:3px solid #bc5262; outline-offset:3px; }
.ledger-card { background:#fff; border:1px solid #e5e5e9; border-radius:18px; padding:22px; box-shadow:0 12px 42px #17172810; }
.ledger-head { display:flex; gap:12px; justify-content:space-between; align-items:start; margin-bottom:20px; }
.ledger-brand { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:750; letter-spacing:.1em; color:#777882; text-transform:uppercase; }
.ledger-mark { display:inline-grid; place-items:center; width:25px; height:25px; background:#f8e9ec; color:#a92c39; border-radius:8px; font-size:17px; }
.ledger-title { font-size:21px; font-weight:720; line-height:1.2; letter-spacing:-.035em; margin:12px 0 6px; overflow-wrap:anywhere; }
.ledger-small { font-size:12px; color:#73747f; } .ledger-muted { color:#73747f; } .ledger-kicker { font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:#73747f; }
.ledger-icon { border:1px solid #e5e5e9; border-radius:9px; width:32px; height:32px; background:#fff; color:#666773; flex-shrink:0; }
.ledger-hero { padding:18px; background:#faf5f5; border-radius:12px; border:1px solid #f2e1e4; margin-bottom:17px; }
.ledger-number { font-size:46px; font-weight:740; letter-spacing:-.055em; line-height:1.15; margin:7px 0; color:#a92c39; font-variant-numeric:tabular-nums; }
.ledger-number.empty { font-size:28px; color:#555662; letter-spacing:-.035em; margin:13px 0; }
.ledger-period { font-size:12px; font-weight:650; color:#65616a; }
.ledger-note { font-size:12px; color:#75717a; margin:10px 0 0; }
.ledger-status { display:flex; gap:7px; align-items:baseline; padding:12px 0; border-bottom:1px solid #ededf0; font-size:12px; }
.ledger-dot { width:6px; height:6px; background:#b0a3a6; border-radius:100%; flex:0 0 auto; }
.ledger-section { margin-top:18px; } .ledger-section h2 { margin:0 0 10px; font-size:13px; font-weight:700; letter-spacing:-.01em; }
.ledger-stats { display:flex; gap:14px; justify-content:space-between; }
.ledger-stat { font-size:23px; font-weight:650; font-variant-numeric:tabular-nums; letter-spacing:-.035em; }
.ledger-chart { width:100%; height:60px; display:block; margin:12px 0 6px; border-radius:8px; background:#f8f8fa; }
.ledger-history-empty { border:1px dashed #dddde3; border-radius:10px; padding:14px; font-size:12px; color:#73747f; margin:12px 0; }
.ledger-details { border-top:1px solid #ededf0; padding-top:14px; margin-top:17px; }
.ledger-details summary { cursor:pointer; color:#52535f; font-size:12px; font-weight:650; }
.ledger-record { padding:11px 0; border-bottom:1px solid #ededf0; font-size:12px; }
.ledger-record strong { display:block; margin-bottom:3px; } .ledger-record p { margin:7px 0; }
.ledger-actions { display:flex; gap:8px; margin-top:18px; flex-wrap:wrap; }
.ledger-button { border:1px solid #dddde3; border-radius:9px; background:white; color:#52535f; padding:8px 11px; font-size:12px; font-weight:650; }
.ledger-button.primary { background:#a92c39; color:white; border-color:#a92c39; }
.ledger-foot { font-size:10px; color:#93939d; margin:14px 0 0; }
.ledger-error { background:#fff2f1; border:1px solid #f0d2d0; color:#923c3a; border-radius:10px; padding:14px; font-size:13px; }
.ledger-loading { padding:30px 10px; color:#73747f; text-align:center; }
.ledger-spinner { display:inline-block; height:13px; width:13px; border:2px solid #ddd; border-top-color:#a92c39; border-radius:100%; margin-right:8px; animation:ledger-spin 1s linear infinite; }
@keyframes ledger-spin { to { transform:rotate(360deg); } }
@media(prefers-reduced-motion:reduce) { .ledger-spinner { animation:none; } }
@media(prefers-color-scheme:dark) {
 :host,.ledger-app { color:#ebebf0; color-scheme:dark; }
 .ledger-card,.ledger-icon,.ledger-button { background:#202126; border-color:#3b3b45; color:#ddddE6; }
 .ledger-hero { background:#2d2328; border-color:#493039; } .ledger-number { color:#f18e9a; }
 .ledger-number.empty { color:#c8c5ce; } .ledger-period { color:#bbb2bc; }
 .ledger-muted,.ledger-small,.ledger-note,.ledger-kicker,.ledger-brand { color:#a7a4b1; }
 .ledger-status,.ledger-details,.ledger-record { border-color:#3b3b45; } .ledger-details summary { color:#ccc7d3; }
 .ledger-chart { background:#292a32; } .ledger-history-empty { border-color:#484650; color:#b0aab8; }
 .ledger-mark { background:#422d35; color:#f18e9a; } a { color:#f18e9a; }
 .ledger-button.primary { background:#b63648; color:#fff; border-color:#b63648; }
 .ledger-error { background:#40262b; color:#ffb7b6; border-color:#65414b; }
}
`;
