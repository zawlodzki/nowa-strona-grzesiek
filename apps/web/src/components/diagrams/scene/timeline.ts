// Shared timeline for the scenes rebuilt in the calm style (T92).
//
// The markup of every scene is its end state, so a scene reads complete
// without JavaScript, under reduced motion, and when it is already on screen
// as the page loads. Only a scene that starts below the fold is rewound to its
// first frame and played once when half of it scrolls into view.

export const EASE_OUT = "cubic-bezier(0.25, 1, 0.5, 1)";
export const EASE_MOVE = "cubic-bezier(0.65, 0, 0.35, 1)";

export const DURATION = {
  enter: 630,
  travel: 1300,
  count: 1620,
} as const;

export interface Timeline {
  wait(ms: number): Promise<void>;
  animate(
    el: Element,
    keyframes: Keyframe[],
    duration: number,
    easing?: string,
  ): Promise<void>;
  enter(el: Element, duration?: number): Promise<void>;
  count(
    from: number,
    to: number,
    duration: number,
    write: (value: number) => void,
  ): Promise<void>;
}

export interface Scene {
  rewind(): void;
  play(): Promise<void>;
}

const timeline: Timeline = {
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  animate(el, keyframes, duration, easing = EASE_OUT) {
    return el.animate(keyframes, { duration, easing }).finished.then(
      () => undefined,
      () => undefined,
    );
  },
  enter(el, duration = DURATION.enter) {
    el.classList.remove("sc-pending");
    return timeline.animate(
      el,
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "none" },
      ],
      duration,
    );
  },
  count(from, to, duration, write) {
    return new Promise((resolve) => {
      let start: number | null = null;
      const step = (now: number) => {
        start ??= now;
        const k = Math.min(1, (now - start) / duration);
        write(Math.round(from + (to - from) * (1 - (1 - k) ** 4)));
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  },
};

export function stage(
  key: string,
  build: (root: HTMLElement, t: Timeline) => Scene,
): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window) || !("animate" in Element.prototype))
    return;

  for (const root of document.querySelectorAll<HTMLElement>(
    `[data-diagram="${key}"]`,
  )) {
    if (
      root.dataset.sceneArmed ||
      root.getBoundingClientRect().top < innerHeight
    )
      continue;
    root.dataset.sceneArmed = "";
    const scene = build(root, timeline);
    scene.rewind();
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        void scene.play();
      },
      { threshold: 0.5 },
    );
    io.observe(root);
  }
}

/** Box of `el` relative to `root`, for moving a stand-in between two places. */
export function offset(el: Element, root: Element) {
  const a = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
}

/** Formats 24000 as 24 000 € with no-break spaces, the Polish grouping. */
export function euro(value: number): string {
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}\u00a0€`;
}
