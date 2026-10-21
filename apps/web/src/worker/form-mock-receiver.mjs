// Stand-in for the n8n webhook in tests and local `wrangler dev`. Never point forms at the real one.
// Usage: node form-mock-receiver.mjs --port 8791 --out payloads.jsonl [--status 500]
import { appendFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

export function startMockReceiver({ port = 0, status = 200, out } = {}) {
  const received = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const record = { method: req.method, path: req.url, contentType: req.headers['content-type'], body: JSON.parse(body || 'null') };
      received.push(record);
      if (out) appendFileSync(out, JSON.stringify(record) + '\n');
      res.writeHead(status, { 'Content-Type': 'application/json' }).end('{"message":"Workflow was started"}');
    });
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}/webhook/mock`;
      resolve({ url, received, close: () => new Promise((done) => server.close(done)) });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { port: { type: 'string', default: '8791' }, out: { type: 'string' }, status: { type: 'string', default: '200' } } });
  const { url } = await startMockReceiver({ port: Number(values.port), status: Number(values.status), out: values.out });
  console.log(`mock n8n listening on ${url}`);
}
