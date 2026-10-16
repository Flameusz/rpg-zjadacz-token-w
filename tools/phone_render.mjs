// Render 1:1 z telefonem bez telefonu (2026-10-13): bezgłowy Chrome + CDP.
// 780×360 CSS przy DPR 3 = 891×411 przy DPR 2,625 (S21 FE) = ten sam obraz
// 2340×1080 i ta sama rozdzielczość wirtualna UI 1257×580.
// Użycie: `npm run dev`, potem `node tools/phone_render.mjs scenariusz.json`
// (wzór: tools/phone_render_example.json). Zrzuty: %TEMP%/rpg-phone-render/shots
// albo SHOTS_DIR. Kroki: {eval}, {wait}, {waitFor}, {tap:[x,y]} (CSS px),
// {tapAt:"wyrażenie → [x,y]"}, {drag:"wyrażenie → [[x,y],[x,y]]", midShot}, {key}, {shot}. ⚠ Po serii zmian w kodzie
// Vite potrafi raz przeładować stronę PO starcie gry — zacznij od {wait:15000}. ⚠ Start gry: eval `game.scene.getScene('Title').startFresh()`
// (tap w tytuł w bezgłowym nie działa). ⚠ Glify slotów (`slots.png`) bywają
// tu narysowane całym arkuszem albo jako __MISSING — artefakt bezgłowego
// renderu, w grze i w Browser pane są poprawne. `game.scene.getScene('UI')
// .npcDialog` daje dostęp do rozmowy (openView/back/shop.selectMerchantSlot).
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
// Zrzuty i profil przeglądarki POZA repo (katalog tymczasowy systemu).
const TMP = join(process.env.TEMP ?? process.env.TMPDIR ?? "/tmp", "rpg-phone-render");
const SHOTS = process.env.SHOTS_DIR ?? join(TMP, "shots");
await mkdir(SHOTS, { recursive: true });
const scen = JSON.parse(await readFile(process.argv[2], "utf8"));
const W = scen.w ?? 780, H = scen.h ?? 360, DPR = scen.dpr ?? 3;
const URL = scen.url ?? "http://localhost:5173/";
const PORT = 9333;

const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", `--remote-debugging-port=${PORT}`, "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${join(TMP, "chrome-profile")}`, "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--autoplay-policy=no-user-gesture-required", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) { ws = new WebSocket(page.webSocketDebuggerUrl); break; }
  } catch {}
  await sleep(200);
}
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.consoleAPICalled" && scen.console) {
    console.log("[console]", msg.params.args.map((a) => a.value ?? a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") console.log("[exception]", msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) console.log("[eval error]", r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
  return r.result?.result?.value;
};

await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: true, screenOrientation: { type: "landscapePrimary", angle: 90 } });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.enable");
await send("Page.navigate", { url: URL });

for (const step of scen.steps) {
  if (step.wait) await sleep(step.wait);
  if (step.waitFor) {
    const t0 = Date.now();
    while (Date.now() - t0 < (step.timeout ?? 60000)) { if (await evalJs(`return !!(${step.waitFor})`)) break; await sleep(250); }
  }
  if (step.eval) { const v = await evalJs(step.eval); if (v !== undefined) console.log(step.label ?? "eval", JSON.stringify(v)); }
  // `tapAt`: wyrażenie JS zwracające [x, y] w px CSS — tapnięcie tam, gdzie
  // element NAPRAWDĘ stoi, zamiast zgadywać współrzędne z układu (stały punkt
  // trafiał w pytanie zamiast w usługę, gdy NPC miał jeden rząd usług mniej).
  if (step.tapAt) {
    const xy = await evalJs(`return (${step.tapAt})`);
    if (!Array.isArray(xy)) console.log("[tapAt] brak celu:", step.tapAt);
    else step.tap = xy;
  }
  if (step.tap) {
    const [x, y] = step.tap;
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await sleep(step.hold ?? 60);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(step.after ?? 250);
  }
  // `drag`: wyrażenie JS → [[x1,y1],[x2,y2]] (px CSS). Przytrzymanie `hold`
  // (domyślnie 400 ms — plecak ma `dragTimeThreshold` 300), ruch w krokach,
  // opcjonalny zrzut `midShot` z palcem nad celem, puszczenie.
  if (step.drag) {
    const pts = await evalJs(`return (${step.drag})`);
    if (!Array.isArray(pts) || pts.length !== 2) console.log("[drag] brak celu:", step.drag);
    else {
      const [[x1, y1], [x2, y2]] = pts;
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1 }] });
      await sleep(step.hold ?? 400);
      const n = 12;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }] });
        await sleep(30);
      }
      await sleep(200);
      if (step.midShot) {
        const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(join(SHOTS, step.midShot), Buffer.from(r.result.data, "base64"));
        console.log("shot", step.midShot);
      }
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(step.after ?? 400);
    }
  }
  if (step.key) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: step.key, code: step.key, windowsVirtualKeyCode: step.vk ?? 27 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: step.key, code: step.key, windowsVirtualKeyCode: step.vk ?? 27 });
    await sleep(200);
  }
  if (step.shot) {
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(SHOTS, step.shot), Buffer.from(r.result.data, "base64"));
    console.log("shot", step.shot);
  }
}
ws.close();
chrome.kill();
process.exit(0);
