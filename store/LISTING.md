# Chrome Web Store listing

Name: YouTube Subscriber Loss Ledger

Summary: See dated public subscriber-loss disclosures and keep a private history of displayed subscriber counts on YouTube channels.

## Detailed description

See the record behind a subscriber-loss number.

YouTube Subscriber Loss Ledger adds a small button to desktop YouTube channel pages. Open it to see included public subscriber-loss reports with their original reporting dates and source links, alongside the channel's current public subscriber count.

WHAT IT DOES
- Displays ten cited historical report records for four verified channels: Ken Jee, saurabhschool, General Shale, and Fire Safe Marin.
- Matches reports by channel ID, so similarly named channels do not inherit another channel's data.
- Looks up other public YouTube channels and clearly says Not disclosed when no included loss report is available.
- Saves a private, local history of the public subscriber counts you observe.
- Lets you pause recording, forget a saved channel, or export your observations as JSON.

UNDERSTAND THE NUMBERS
Exact lifetime subscriber losses are not publicly available for arbitrary channels. Historical reports cover only their stated periods; Ken Jee's aggregate has no recoverable date bounds. The extension does not invent a lifetime estimate or add overlapping report periods. Count drops are decreases between saved public totals, not gross unsubscribes. Abbreviated YouTube counts remain approximate.

PRIVACY
No account, API key, paid provider, telemetry, remote code, or publisher backend. Public metadata requests omit account cookies. Observations stay in Chrome local storage and are not synced. No scheduled polling. Recording is initially on, can be paused, and does not record incognito lookups.

Works on desktop YouTube channel pages, not individual watch pages or the mobile domain. Public lookups may fail if YouTube changes its format, rate-limits requests, or shows consent pages. Source reports are historical publisher disclosures, not authenticated Analytics API responses. New source reports require an extension update.

Independent open-source project; not affiliated with Google, YouTube, or the channels shown. See the repository for the MIT software license and separate third-party source terms.

Source and support: https://github.com/kyllan16693/youtube-subscriber-loss-ledger
Privacy: https://github.com/kyllan16693/youtube-subscriber-loss-ledger/blob/main/PRIVACY.md

## Single purpose

Display cited public YouTube subscriber-loss disclosures and let users maintain a private local history of the public subscriber counts they observe.

## Permission justifications

storage: Save recording preferences and public channel observations locally; provide history, pause, deletion, and JSON export. No Chrome Sync or external storage.
activeTab: Read the active tab URL only when the user opens the extension popup so it can identify the current YouTube channel. It does not read unrelated page content.
https://www.youtube.com/*: Add the on-channel panel and request the public channel About page to verify channel identity and read displayed public subscriber metadata. Requests omit account cookies. No Google account access or private Analytics access.

Remote code: None. All executable code ships in the extension package.

## Reviewer test instructions

No account, credentials, payment, or API key is required. Visit https://www.youtube.com/@FIRESafeMARIN and click the lower-right Subscriber losses button. The panel should identify Fire Safe Marin and show 38 publisher-reported losses for January 1-31, 2025, with the source PDF page 77. The current public count is separate and may change. Open the toolbar popup on the same page and choose Lookup & history. Look up @MrBeast: public counts should load, loss records should say Not disclosed, and lifetime total today should remain unknown. Pause recording, refresh a channel, and check that no new observation is recorded. Re-enable recording, refresh, and use Forget to remove the channel. JSON export saves locally only. Abbreviated counts are approximate. Incognito is not required to test.
