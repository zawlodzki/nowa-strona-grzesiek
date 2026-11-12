// Scratch only: overrides logo `invert` flags in the build's Sanity query response, in memory. No dataset write.
const flags = { rentli: true, smmash: false };
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const response = await original(input, init);
  const url = String(input instanceof Request ? input.url : input);
  if (!url.includes('.api.sanity.io/') || !url.includes('/data/query/')) return response;
  const body = await response.json();
  for (const logo of body.result?.logos ?? []) {
    const flag = flags[logo.name?.toLowerCase()];
    if (flag !== undefined) { logo.invert = flag; console.error(`[t52-preload] ${logo.name} invert=${flag}`); }
  }
  return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
};
