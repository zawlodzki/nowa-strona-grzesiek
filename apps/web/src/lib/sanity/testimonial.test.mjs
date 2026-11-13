import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invertsLikeLogo } from './testimonial.ts';

const image = (ref) => ({ _type: 'contentImage', asset: { _type: 'reference', _ref: ref } });
const logo = (ref, invert) => ({ _id: `logo-${ref}`, _type: 'logo', image: image(ref), ...(invert !== undefined && { invert }) });
const logos = [logo('image-white-349x72-webp', true), logo('image-dark-292x58-webp', false), logo('image-plain-100x40-svg')];

test('image shared with an inverted logo is inverted', () => {
  assert.equal(invertsLikeLogo(logos, image('image-white-349x72-webp')), true);
});

test('image shared with a logo whose invert is off or unset is not inverted', () => {
  assert.equal(invertsLikeLogo(logos, image('image-dark-292x58-webp')), false);
  assert.equal(invertsLikeLogo(logos, image('image-plain-100x40-svg')), false);
});

test('image no logo uses is not inverted', () => {
  assert.equal(invertsLikeLogo(logos, image('image-other-10x10-png')), false);
});

test('testimonial without an image is not inverted', () => {
  assert.equal(invertsLikeLogo(logos, undefined), false);
  assert.equal(invertsLikeLogo([{ _id: 'logo-x', _type: 'logo', invert: true }], { _type: 'contentImage' }), false);
});
