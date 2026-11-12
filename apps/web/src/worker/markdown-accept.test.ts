import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prefersMarkdown } from './markdown-accept.ts';

const cases: Array<[string | null, boolean]> = [
  [null, false],
  ['text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', false],
  ['text/*, */*', false],
  ['text/markdown', true],
  ['text/markdown, */*', true],
  ['text/html, text/markdown', false],
  ['text/html;q=0.4, TEXT/MARKDOWN;q=0.8', true],
  ['text/markdown;q=0.4, text/html;q=0.8', false],
  ['text/markdown;q=0.4, */*;q=0.8', false],
  ['text/markdown;q=0.4, text/*;q=0.8, text/html;q=0', true],
  ['text/markdown;q=0, text/*', false],
  ['text/markdown, text/markdown;q=0', false],
  ['text/markdown;q=invalid, */*', false],
  ['text/markdown;charset="utf-8";q=.8, text/html;q=.4', true],
  ['text/markdown;charset=iso-8859-1', false],
  ['text/plain;title="example, text/markdown", text/html', false],
];

for (const [accept, expected] of cases) {
  test(`Markdown preference for ${accept ?? 'no Accept header'}`, () => {
    assert.equal(prefersMarkdown(accept), expected);
  });
}
