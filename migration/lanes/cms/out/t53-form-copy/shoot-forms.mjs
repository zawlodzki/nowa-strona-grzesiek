// Screenshots every contact form and newsletter section on the given pages, one PNG per section, and prints a sha256 per PNG.
// Usage: node shoot-forms.mjs <origin> <out-dir> <width> <path>...
// Chrome comes from CHROME_BIN or /opt/agent-vm/chromium/chrome. The page is scrolled to the end first so lazy content settles.
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {setTimeout as sleep} from 'node:timers/promises'

const [origin, outDir, widthArg, ...paths] = process.argv.slice(2)
if (!origin || !outDir || !widthArg || !paths.length) throw new Error('usage: node shoot-forms.mjs <origin> <out-dir> <width> <path>...')
const width = Number(widthArg)
mkdirSync(outDir, {recursive: true})

const profile = mkdtempSync(join(tmpdir(), 't53-chrome-'))
const chrome = spawn(process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', `--window-size=${width},900`, 'about:blank',
], {stdio: 'ignore'})
const portFile = join(profile, 'DevToolsActivePort')
for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100)
const port = readFileSync(portFile, 'utf8').split('\n')[0]
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve, {once: true}))

let nextId = 0
const pending = new Map()
const listeners = []
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const {resolve, reject} = pending.get(message.id)
    pending.delete(message.id)
    message.error ? reject(new Error(message.error.message)) : resolve(message.result)
  } else listeners.forEach((listener) => listener(message))
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, {resolve, reject})
  socket.send(JSON.stringify({id, method, params}))
})
const evaluate = async (expression) => (await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true})).result.value

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 600})
await send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]})
const lines = []
for (const path of paths) {
  const loaded = new Promise((resolve) => listeners.push(function onLoad(message) {
    if (message.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(onLoad), 1); resolve() }
  }))
  await send('Page.navigate', {url: new URL(path, origin).href})
  await loaded
  await evaluate(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); await document.fonts.ready; await new Promise((r) => setTimeout(r, 500)); })()`)
  const boxes = await evaluate(`[...document.querySelectorAll('section.contact, section.newsletter')].map((s) => { const r = s.getBoundingClientRect(); return {kind: s.classList.contains('contact') ? 'contact' : 'newsletter', x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height}; })`)
  for (const [index, box] of boxes.entries()) {
    const {data} = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true, clip: {x: box.x, y: box.y, width: box.width, height: box.height, scale: 1}})
    const png = Buffer.from(data, 'base64')
    const name = `${path.replace(/^\/$/, 'home').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}-${index}-${box.kind}-w${width}.png`
    writeFileSync(join(outDir, name), png)
    lines.push(`${createHash('sha256').update(png).digest('hex').slice(0, 16)}  ${name}  ${Math.round(box.width)}x${Math.round(box.height)}`)
  }
  if (!boxes.length) lines.push(`(none)  ${path}`)
}
writeFileSync(join(outDir, `hashes-w${width}.txt`), lines.join('\n') + '\n')
console.log(lines.join('\n'))
socket.close()
chrome.kill()
await sleep(300)
rmSync(profile, {recursive: true, force: true})
