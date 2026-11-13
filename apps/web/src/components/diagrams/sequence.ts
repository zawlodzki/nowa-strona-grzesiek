// Shared player for scenes marked data-scene="sequence" (T97).
//
// The markup is the end state: every [data-step] carries .is-done and the
// closing number is final. A scene below the fold is rewound (steps lose
// .is-done, the number drops to data-start) and then plays once: steps are
// marked done one at a time, and a step with data-value counts the closing
// number to that value. All motion is each scene's CSS transition on .is-done.
import { DURATION, stage } from "./scene/timeline";

const group = (value: number) =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const keys = new Set(
  [...document.querySelectorAll<HTMLElement>('[data-scene="sequence"]')].map(
    (root) => root.dataset.diagram ?? "",
  ),
);

for (const key of keys) {
  stage(key, (root, t) => {
    const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
    const total = root.querySelector<HTMLElement>("[data-total]");
    const start = Number(total?.dataset.start ?? 0);
    const write = (value: number) => {
      if (total)
        total.textContent = group(value) + (total.dataset.suffix ?? "");
    };

    return {
      rewind() {
        steps.forEach((step) => step.classList.remove("is-done"));
        write(start);
      },
      async play() {
        let value = start;
        await t.wait(900);
        for (const step of steps) {
          step.classList.add("is-done");
          const next = step.dataset.value ? Number(step.dataset.value) : value;
          if (next === value) await t.wait(DURATION.enter + 270);
          else await t.count(value, next, 900, write);
          value = next;
          await t.wait(500);
        }
      },
    };
  });
}
