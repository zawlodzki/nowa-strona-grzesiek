import type { APIRoute } from 'astro';
import { INDEXNOW_KEY, keyResponse } from '../lib/indexnow.mjs';

export function getStaticPaths() {
  return [{ params: { indexnow: INDEXNOW_KEY } }];
}

export const GET: APIRoute = keyResponse;
