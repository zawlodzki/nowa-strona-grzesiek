# Motion review

| Before | After | Why |
| --- | --- | --- |
| Default navigation swap | Native 150ms opacity cross-fade | Bridge the document change without slides, JS routing or extra waiting |
| Root fade includes header | Header gets an opaque named snapshot | Avoid doubled logo/navigation text |

Review concern: mobile captures show a brief c15t banner reappearance during navigation. CSS-only snapshot isolation did not reliably remove it and was dropped. Consent choice, anchors, menu and history work in the settled pages, but the no-flicker acceptance item stays open.

Approve timing, existing tokens, reduced-motion opt-out and native navigation behavior. Block full visual acceptance pending owner review of the banner frames. Safari/WebKit remains unverified in this VM.
