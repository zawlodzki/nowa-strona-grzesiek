export const INDEXNOW_KEY = 'bdc31ccbcd4d0adf56519189a77ebf3c';
export const INDEXNOW_HOST = 'www.zawlodzki.pl';

export function keyResponse() {
  return new Response(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
