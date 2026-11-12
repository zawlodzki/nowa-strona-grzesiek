Run from the repository root after verify-web up on port 8791.

```sh
PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node migration/lanes/design/out/t56-sticky-toc/verify.mjs after
```

Use `staging` as the argument for read-only staging captures. `before` records the
local regression on unmodified main. The after run asserts sticky positioning
at mid/late scroll and visible overflow without a height cap on recommendations.
Run verify-web down after each attempt, including failures.

Each screenshot uses a 900px viewport height. Mid and late positions center the
50% and 90% points of the article. Comparisons show staging left and T56 right.
Consent is dismissed through the optional-cookie rejection button for clear shots.
