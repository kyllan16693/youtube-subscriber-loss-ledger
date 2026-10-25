# YouTube Subscriber Loss Ledger — Chrome extension

An installable Manifest V3 extension for YouTube channel pages. Version 0.1.0.

## Install

1. Extract `youtube-subscriber-loss-ledger-0.1.0.zip` into its own folder.
2. In Chrome, open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and choose the extracted folder containing
   `manifest.json`. You can also select this project's `extension/` folder.
4. Pin **YouTube Subscriber Loss Ledger** from Chrome's extensions menu.
5. Open a YouTube channel. Click the **Subscriber losses** pill at the lower
   right, or use the toolbar popup. **Lookup & history** opens the full page.

No build step, account, API key or backend is required to use the extracted
extension. Installation follows Chrome's [unpacked extension workflow](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## What it shows

- **Published subscriber-loss records:** ten cited reports/exports for four
  verified channel identities: Ken Jee, saurabhschool, General Shale and
  Fire Safe Marin. Each record keeps its reporting period and source link.
  Ken Jee's aggregate export has no recoverable date bounds and is marked so.
- **Other channels:** look up any readable public channel by URL, @handle or
  channel ID. The extension verifies its ID and reads its public About page.
  When there is no bundled public loss disclosure, it says **Not disclosed**.
- **Lifetime total today:** marked **unknown**. Historical reporting periods
  are not silently extended to today or summed across overlapping records.
- **Local count history:** saves displayed subscriber totals when you visit
  or look up a channel. The chart and count-drop total refer only to saved
  observations. Abbreviations remain approximate.
- **History controls:** pause recording, forget an individual channel with a
  second click, or export saved counts to a JSON file.

Count drops are not gross unsubscribes. Public totals can change because of
rounding, gains occurring between observations, account removals and other
adjustments. A flat or rising count does not establish zero unsubscribes.
The failed research estimators are not used to manufacture a lifetime number.

## Privacy and permissions

`storage` stores settings and observations locally. `activeTab` lets the popup
read the active channel URL when you open it. The only host permission is
`https://www.youtube.com/*`, for channel-page support and public metadata GETs.

YouTube metadata requests omit account cookies. The extension has no telemetry,
email integration, account connection, paid provider, external database, or
scheduled background polling. Source sites are opened only when you click a
citation. Nothing is sent to other people.

Recording is enabled initially. The lookup page includes a pause switch.
Incognito lookups are not recorded. History is capped at 100 channels and the
120 most recent retained observations per channel; older entries roll off.
Uninstalling the extension removes its local history. JSON exports remain
where you save them.

## Reporting limitations

The extension is built; universal exact lifetime-loss data remains unavailable.
The four included identities are a small evidence registry, not universal
coverage. Reports are publisher disclosures rather than independently
authenticated Analytics API responses. Sources can disappear or be revised.

Current metadata parsing was checked against nine acquired public channel
pages. YouTube may change its layout, hide fields, return consent pages, block
requests or rate-limit access. A failed lookup displays an error instead of
inventing zero counts. Refresh retries the public request. The YouTube panel
supports channel routes, not individual `/watch` video pages or mobile domains.

## Development

See the repository README for tests and packaging. Original software is MIT licensed; see LICENSE and THIRD_PARTY_NOTICES.md in this package. Privacy policy: https://github.com/kyllan16693/youtube-subscriber-loss-ledger/blob/main/PRIVACY.md .
