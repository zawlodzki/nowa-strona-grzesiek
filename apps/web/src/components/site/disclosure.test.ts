import assert from 'node:assert/strict';
import test from 'node:test';
import { bindNavDisclosure, closeDisclosure, openDisclosure, toggleDisclosure } from './disclosure.ts';

test('openDisclosure open and closed are open', () => {
  assert.equal(openDisclosure('open'), 'open');
  assert.equal(openDisclosure('closed'), 'open');
});

test('toggleDisclosure flips, and a second closeDisclosure closed stays closed', () => {
  assert.equal(toggleDisclosure('closed'), 'open');
  assert.equal(toggleDisclosure('open'), 'closed');
  assert.equal(closeDisclosure('open'), 'closed');
  assert.equal(closeDisclosure('closed'), 'closed');
  assert.equal(closeDisclosure(closeDisclosure('closed')), 'closed');
});

test('bindNavDisclosure toggles aria-expanded, closes on Escape, and binds once', () => {
  const listeners = new Map<string, Array<(event: { key: string; preventDefault(): void }) => void>>();
  const doc = {
    addEventListener(type: string, fn: (event: { key: string; preventDefault(): void }) => void) {
      const list = listeners.get(type) ?? [];
      list.push(fn);
      listeners.set(type, list);
    },
    press(key: string) {
      const event = {
        key,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      for (const fn of listeners.get('keydown') ?? []) fn(event);
      return event;
    },
  };
  const previous = globalThis.document;
  globalThis.document = doc as unknown as Document;

  const attrs = new Map<string, string>([
    ['aria-expanded', 'false'],
    ['aria-controls', 'site-nav'],
  ]);
  const clicks: Array<() => void> = [];
  const button = {
    getAttribute(name: string) {
      if (name !== 'aria-expanded') throw new Error(`read ${name}`);
      return attrs.get(name) ?? null;
    },
    setAttribute(name: string, value: string) {
      if (name !== 'aria-expanded') throw new Error(`wrote ${name}`);
      attrs.set(name, value);
    },
    addEventListener(type: string, fn: () => void) {
      if (type === 'click') clicks.push(fn);
    },
    click() {
      for (const fn of clicks) fn();
    },
  };
  const header = {
    querySelector(selector: string) {
      return selector === 'button[aria-controls]' ? button : null;
    },
  };

  try {
    bindNavDisclosure(header as unknown as HTMLElement);
    bindNavDisclosure(header as unknown as HTMLElement);
    assert.equal(clicks.length, 1);
    assert.equal(listeners.get('keydown')?.length, 1);

    button.click();
    assert.equal(attrs.get('aria-expanded'), 'true');
    const escaped = doc.press('Escape');
    assert.equal(escaped.defaultPrevented, true);
    assert.equal(attrs.get('aria-expanded'), 'false');
    const again = doc.press('Escape');
    assert.equal(again.defaultPrevented, false);
    assert.equal(attrs.get('aria-expanded'), 'false');

    button.click();
    assert.equal(attrs.get('aria-expanded'), 'true');
    doc.press('Tab');
    assert.equal(attrs.get('aria-expanded'), 'true');

    const bare = { querySelector() { return null; } };
    bindNavDisclosure(bare as unknown as HTMLElement);
    bindNavDisclosure(bare as unknown as HTMLElement);
    assert.equal(listeners.get('keydown')?.length, 1);
  } finally {
    globalThis.document = previous;
  }
});
