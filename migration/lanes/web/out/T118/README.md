# T118 verification

Run from the repository root after installing dependencies:

```sh
.claude/skills/verify-web/scripts/web.sh up --port 8790
.claude/skills/verify-web/scripts/web.sh doctor --port 8790
node migration/lanes/web/out/T118/verify.mjs
.claude/skills/verify-web/scripts/web.sh down --port 8790
```

An optional width argument (375 or 1280) reruns that width and preserves the other width in report.json.

The script uses Chromium at /opt/agent-vm/chromium/chrome. It reads the live site and local Worker. It rejects optional cookies through the consent UI. No CMS data changes.

Each compare-*.png shows live on the left and the local build on the right, at 375 or 1280 CSS pixels. Navigation uses /o-mnie with the mobile menu open; tabs use /sales-atlas-system with the selected tab scrolled into view. Modes are normal, CSS grayscale, and Chrome forced-colors emulation. Focus captures show the local focused control.

report.json records computed indicators, contrast and geometry. Removing the underline leaves the nav rectangle unchanged. Removing the pseudo-element leaves the selected tab rectangle unchanged. The extra deltaWidth/deltaX observations compare selected and deselected states; the noIndicatorLayoutShift assertion isolates the marker itself.

The nav uses Ink (#0e0f11) against Paper (#ffffff), 19.18:1. The tab uses Paper against Atlas Blue, measured at 7.05:1. Chrome's default forced-colors palette gives LinkText on Canvas at 13.99:1. User-selected system palettes remain under browser control.

The final build passed for 117 pages. All six axe cases passed against the existing baseline; no baseline changes were necessary. Axe does not detect color-only state indications, so the screenshots and geometry/contrast observations cover that requirement.
