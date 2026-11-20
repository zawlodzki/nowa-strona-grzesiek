# Motion review

| Before | After | Why |
| --- | --- | --- |
| Default navigation swap | Native 150ms opacity cross-fade on the `ease-out` token | Bridges the document change without slides, JS routing or extra waiting |
| Root fade includes header | Header gets one opaque named snapshot | Avoids a doubled logo and nav text |
| Banner flash in review frames | Harness runs on an origin c15t allow-lists | The flash came from c15t re-showing the banner on a non-allow-listed origin, not from the transition |

The 150 ms opacity-only fade fits a page change people see tens of times a session. It runs on the compositor, uses no transforms and is off entirely under reduced motion. No banner appears in any frame at 375 or 1280 with consent rejected or accepted (`acceptance-results.json`, `after-*-sheet.jpg`). Safari/WebKit remains unverified in this VM.
