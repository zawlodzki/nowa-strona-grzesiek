import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sanityImage } from './site.ts';

const url = 'https://cdn.sanity.io/images/p/d/abc-1920x1080.webp';

test('large image: src capped at 1600, srcset lists every smaller candidate', () => {
  const image = sanityImage(url, 1920, 1080);
  assert.equal(image.src, `${url}?w=1600&fit=max&auto=format`);
  assert.deepEqual([image.width, image.height], [1600, 900]);
  assert.deepEqual(image.srcset.split(', ').map((c) => c.split(' ')[1]), ['160w', '320w', '480w', '640w', '960w', '1280w', '1600w']);
  assert.ok(image.srcset.includes(`${url}?w=320&fit=max&auto=format 320w`));
});

test('mid-size image keeps its own width as the largest candidate', () => {
  const image = sanityImage(url, 700, 350);
  assert.deepEqual(image.srcset.split(', ').map((c) => c.split(' ')[1]), ['160w', '320w', '480w', '640w', '700w']);
});

test('tiny image gets no srcset', () => {
  assert.equal(sanityImage(url, 120, 40).srcset, undefined);
});
