# Motion review (T119 owner scope extension)

Applied emil-design-eng, improve-animations (focused audit), review-animations and animation-performance. User's explicit implementation request and owned paths supersede improve-animations' advisory-only/plans-directory workflow. No delegated execution or unrelated motion changes.

| Before | After | Why |
| --- | --- | --- |
| Staging scroll selection animates old/new name backgrounds and text colors concurrently | Immediate selected-state swap; no layer-name transitions | Rapid scroll and keyboard changes should not animate. Avoid repeated flashing and main-thread color painting. |
| Incoming searchable content can be deferred when `hidden` is removed | Explicit visible content-visibility and incoming layout before retiring outgoing panel, within one callback | Keep one fully rendered panel at each painted frame; no fade through empty content. |
| Mobile names follow all panel content | Active content is the next DOM sibling of its name | Reading and keyboard order agree; no journey back up the page. |
| Collapsing earlier mobile content moves the target name | Preserve the name's viewport position using an immediate scroll correction | No animated height, scroll, padding or margin; no delayed response. |

Decision: approve for the captured Chromium/virtual-display run. No panel opacity, transform, layout animations or permanent GPU layers were added. Reduced motion retains explicit selection and disables scroll pinning. No short ease-out is needed because this frequent interaction deliberately has no transition. Original desktop spacing, typography and fixed stage calculation are retained. This is browser evidence, not a claim of profiling a physical mid-range phone or all GPUs.

Reproduction: build/start with `.claude/skills/verify-web/scripts/web.sh up --port 8790`, doctor, run the CJS probes here from the repository root, then `web.sh down --port 8790`. Native find uses `xvfb-run -n 119 -s '-screen 0 1400x1100x24' node migration/lanes/web/out/T119/probe.cjs` and Python ctypes with libX11/libXtst. This host's missing libXtst was extracted into `/tmp/t119-libs` using apt-get download and dpkg-deb; set `LD_LIBRARY_PATH=/tmp/t119-libs/usr/lib/aarch64-linux-gnu` when reproducing on this host. No system package installation required.
