const RANKS = [
  { id: 0, name: "初级", linesPerSec: 8, bugsPerSec: 1.1, fixPerSec: 2.4 },
  { id: 1, name: "中级", linesPerSec: 14, bugsPerSec: 2.0, fixPerSec: 4.2 },
  { id: 2, name: "资深", linesPerSec: 22, bugsPerSec: 3.4, fixPerSec: 6.6 },
];

const SLOP_LINES = [
  "function foo() { return foo() }",
  "const x = x ?? x ?? x",
  "if (true) if (true) if (true) {}",
  "eval(userInput) // 没事的",
  "copy(); paste(); copy(); paste();",
  "git push --force origin main",
  "TODO: 以后再改",
  "catch (e) { /* ignore */ }",
  "setInterval(run, 1)",
  "document.write(innerHTML)",
  "let a = 1; a = a = a",
  "while (true) console.log('ok')",
  "undefined.doThing()",
  "password = '123456'",
  "new Array(999999).fill(0)",
  "// 临时方案 2019",
  "fix fix fix asdf",
  "export default null",
  "await fetch('/api').then(r => r) // 没处理",
  "if (data) if (data.data) if (data.data.data) use(data.data.data.item)",
  "JSON.parse(localStorage.user) // 可能炸",
  "setTimeout(save, 0); setTimeout(save, 0); setTimeout(save, 0)",
  "return res.data.data.data.list || res || []",
  "obj['__proto__'] = obj",
  "for (var i = 0; i < 10; i++) { i = 0 }",
  "console.log('debug', secretKey, token, pwd)",
  "window.location = userUrl",
  "document.cookie = 'admin=1; path=/'",
  "Number(undefined) + Number(null) * '2'",
  "try { risky() } finally { risky() }",
  "new Date(userDate).getTime() || Date.now() || 0 || 1",
  "arr[-1] = '垫一下'",
  "Promise.resolve().then(() => Promise.resolve().then(loop))",
  "cssText += 'position:fixed;' // 先顶上去",
  "innerHTML = comment + userName",
  "Math.random() * 0 // 够随机了",
  "if (count == '0') count = 0; else count = count",
  "export const API = 'http://10.0.0.3:8080'",
  "void function(){ arguments.callee() }()",
  "let lock = false; lock = !lock; lock = !lock",
  "switch (type) { default: break; default: break }",
  "fs.writeFileSync('/tmp/prod.json', JSON.stringify(state))",
  "user.age = user.age || user.Age || user.AGE || 18",
  "parseInt('08') + parseInt('09')",
  "typeof NaN === 'number' && NaN == NaN",
  "btn.onclick = btn.onclick = btn.onclick = save",
  "// 线上先这样，周五再清",
  "throw '别问，问就是历史包袱'",
  "merge(a, merge(a, merge(a, b)))",
  "cache[key] = cache[key] || cache[key] || uncached()",
  "id = id || ids[0] || ids[ids.length] || 'id'",
  "sleep(5000) // 等接口自己好",
];

const GOOD_LINES = [
  "const total = items.reduce((s, n) => s + n, 0)",
  "if (!node) return null",
  "el.addEventListener('click', onTap)",
  "return { ok: true, data }",
  "const next = Math.max(0, n - 1)",
  "try { await load() } catch (e) { log(e) }",
  "export function clamp(v, a, b)",
  "query.selectAll('.bug').forEach(fix)",
  "const safe = Number.isFinite(n) ? n : 0",
  "if (!res.ok) throw new Error(res.statusText)",
  "return structuredClone(state)",
  "el.setAttribute('aria-live', 'polite')",
  "const key = encodeURIComponent(raw)",
  "await mutex.runExclusive(write)",
  "if (signal.aborted) return",
  "const id = crypto.randomUUID()",
  "return lines.filter((row) => row.trim())",
  "const url = new URL(path, origin)",
  "queueMicrotask(() => flush())",
  "map.set(id, Object.freeze(item))",
  "for (const row of rows) yield transform(row)",
  "const html = escape(text)",
  "db.prepare('SELECT * FROM bugs WHERE id = ?').get(id)",
  "requestAnimationFrame(tick)",
  "const left = Math.max(0, budget - used)",
  "headers.set('Content-Type', 'application/json')",
  "if (bugs === 0) return rewrite(lines)",
  "test('clamp', () => expect(clamp(-1, 0, 1)).toBe(0))",
];

const ERR_LINES = [
  "TypeError: Cannot read properties of undefined",
  "ReferenceError: bug is not defined",
  "FATAL: 屎山局部坍塌",
  "Error: expected {, saw 💩",
  "UnhandledPromiseRejection: 又双叒崩了",
  "SyntaxError: Unexpected token ; ; ;",
  "RangeError: Maximum call stack size exceeded",
  "Warning: 这段代码有自己的想法",
  "Error: ECONNRESET prod-db 被谁 rm 了",
  "TypeError: foo is not a function, foo is foo",
  "FATAL: git 拒绝覆盖同事的周末",
  "Error: Cannot find module './utils/utils/utils'",
  "Warning: setState on unmounted 情绪",
  "SyntaxError: Unexpected end of JSON in 注释里",
  "Error: 401 但本地 token 还活着",
  "RangeError: Invalid array length 999999999",
  "TypeError: Assignment to constant 临时变量",
  "Error: timeout of 0ms exceeded",
  "Warning: 循环依赖把自己 import 进来了",
  "FATAL: 构建过了，人没过",
  "Error: ENOENT /the/file/we/swore/was-there.js",
  "Unhandled: then() 里又 then() 里又 then()",
  "Error: CORS 把锅甩给前端",
  "Warning: memory leak 从 2019 活到现在",
  "SyntaxError: missing ) after 我发誓有括号",
  "Error: 0 BUG 但 12 个 未知行为",
  "FATAL: 这行能跑，但谁也解释不了",
  "TypeError: null.forEach is not a vibe",
];

function pick(pool) {
  return pool[(Math.random() * pool.length) | 0];
}

const el = {
  app: document.getElementById("app"),
  face: document.getElementById("face"),
  rank: document.getElementById("rank-name"),
  status: document.getElementById("status"),
  clockOut: document.getElementById("clock-out"),
  lines: document.getElementById("lines"),
  good: document.getElementById("good"),
  bugs: document.getElementById("bugs"),
  bugsWrap: document.getElementById("bugs-wrap"),
  goodWrap: document.getElementById("good-wrap"),
  scene: document.getElementById("scene"),
  cons: document.getElementById("console"),
  intro: document.getElementById("intro"),
  sheet: document.getElementById("sheet"),
  sheetTitle: document.getElementById("sheet-title"),
  sumLines: document.getElementById("sum-lines"),
  sumBugs: document.getElementById("sum-bugs"),
  stamp: document.getElementById("clear-stamp"),
  actions: document.getElementById("sheet-actions"),
  sumRank: document.getElementById("sum-rank"),
  sumNext: document.getElementById("sum-next"),
  sumGood: document.getElementById("sum-good"),
};

const faceCtx = el.face.getContext("2d");
const sceneCtx = el.scene.getContext("2d");
faceCtx.imageSmoothingEnabled = false;
sceneCtx.imageSmoothingEnabled = false;

const TAP_FOCUS = 0.6;
const FLASH_DUR = 0.09;

const state = {
  started: false,
  holding: false,
  paused: false,
  rank: 0,
  lines: 0,
  goodLines: 0,
  bugs: 0,
  log: [],
  time: 0,
  last: 0,
  focusUntil: 0,
  flashAge: -1,
  lastBugShown: 0,
  lastGoodShown: 0,
};

function rank() {
  return RANKS[state.rank];
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

function dither(ctx, x, y, w, h, a, b) {
  px(ctx, x, y, w, h, a);
  ctx.fillStyle = b;
  for (let j = 0; j < h; j += 2) {
    const odd = (j >> 1) & 1;
    for (let i = odd; i < w; i += 2) {
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}

function layerWall(ctx) {
  dither(ctx, 0, 0, 160, 84, "#1a1c1e", "#12141a");
}

function layerDesk(ctx) {
  px(ctx, 0, 84, 160, 36, "#2a2624");
  px(ctx, 0, 84, 160, 6, "#3c3834");
  px(ctx, 0, 84, 160, 1, "#4a4640");
  px(ctx, 0, 90, 160, 1, "#1a1816");
}

function layerProps(ctx) {
  px(ctx, 2, 76, 10, 8, "#d0d4d8");
  px(ctx, 3, 74, 8, 3, "#8b9094");
  px(ctx, 3, 78, 8, 1, "#7a7e82");
  px(ctx, 2, 68, 7, 7, "#4a4e52");
  px(ctx, 3, 66, 5, 3, "#3a3c40");
  px(ctx, 4, 64, 3, 3, "#d0d4d8");
}

function layerMonitor(ctx, holding, flashing) {
  const leak = flashing ? "#e8f4f8" : holding ? "#a8d4e8" : "#5a7a88";
  px(ctx, 94, 38, 4, 36, leak);
  if (flashing) px(ctx, 92, 42, 3, 26, "#c8e4f0");
  px(ctx, 98, 30, 50, 54, "#6a6e68");
  px(ctx, 100, 32, 46, 48, "#3a3c3a");
  px(ctx, 104, 36, 38, 8, "#2a2c2a");
  px(ctx, 108, 48, 30, 2, "#4a4c4a");
  px(ctx, 108, 52, 30, 2, "#4a4c4a");
  px(ctx, 108, 56, 30, 2, "#4a4c4a");
  px(ctx, 116, 78, 16, 8, "#4a4c48");
  px(ctx, 112, 84, 24, 4, "#3a3c38");
  px(ctx, 128, 88, 2, 12, "#2a2c2e");
  px(ctx, 133, 90, 2, 14, "#2a2c2e");
}

const gfx = {
  head: null,
  body: null,
  hands: null,
  crt: null,
  faces: [null, null, null],
};

const SPR = {
  head: { x: 10, y: 22 },
  body: { x: 18, y: 42 },
  hands: { x: 34, y: 70 },
  crt: { x: 23, y: 24 },
};

function blit(ctx, img, x, y) {
  if (!img) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x | 0, y | 0);
}

function drawFace(rankId) {
  const ctx = faceCtx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 32, 32);
  const img = gfx.faces[rankId] || gfx.faces[0];
  if (img) ctx.drawImage(img, 0, 0, 32, 32);
}

function loadGfx() {
  const names = ["head", "body", "hands", "crt", "face-0", "face-1", "face-2"];
  return Promise.all(names.map((name) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve([name, img]);
    img.onerror = () => reject(new Error(name));
    img.src = `img/${name}.png`;
  }))).then((pairs) => {
    for (const [name, img] of pairs) {
      if (name.startsWith("face-")) gfx.faces[Number(name.slice(5))] = img;
      else gfx[name] = img;
    }
  });
}

function layerBody(ctx) {
  blit(ctx, gfx.body, SPR.body.x, SPR.body.y);
  blit(ctx, gfx.head, SPR.head.x, SPR.head.y);
}

function layerHandsKeys(ctx, tap) {
  blit(ctx, gfx.hands, SPR.hands.x, SPR.hands.y + tap);
}

function layerCrtLight(ctx, holding, flashing) {
  if (!gfx.crt) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = flashing ? 1 : holding ? 0.72 : 0.32;
  ctx.globalCompositeOperation = "screen";
  blit(ctx, gfx.crt, SPR.crt.x, SPR.crt.y);
  ctx.restore();
}

function drawScene(t, holding, rankId) {
  const canvas = el.scene;
  const ctx = sceneCtx;
  if (canvas.width !== 160 || canvas.height !== 120) {
    canvas.width = 160;
    canvas.height = 120;
    ctx.imageSmoothingEnabled = false;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const flashing = state.flashAge >= 0 && state.flashAge < FLASH_DUR;
  const tap = Math.floor(t * 10) % 2;
  layerWall(ctx);
  layerDesk(ctx);
  layerProps(ctx);
  layerMonitor(ctx, holding, flashing);
  layerBody(ctx);
  layerHandsKeys(ctx, tap);
  layerCrtLight(ctx, holding, flashing);
}

function pushLog(text, kind) {
  state.log.push({ text, kind });
  if (state.log.length > 24) state.log.shift();
  renderLog();
}

function renderLog() {
  el.cons.innerHTML = state.log
    .map((row) => `<div class="${row.kind}">${row.text}</div>`)
    .join("");
  el.cons.scrollTop = el.cons.scrollHeight;
}

function hopBugMeter() {
  const node = el.bugsWrap;
  node.classList.remove("hop");
  void node.offsetWidth;
  node.classList.add("hop");
}

function hurtGoodMeter() {
  const node = el.goodWrap;
  node.classList.remove("hurt");
  void node.offsetWidth;
  node.classList.add("hurt");
  node.addEventListener("animationend", () => node.classList.remove("hurt"), { once: true });
}

function renderHud() {
  const r = rank();
  el.rank.textContent = r.name;
  const lines = Math.floor(state.lines);
  const bugs = Math.floor(state.bugs);
  el.lines.textContent = String(lines);
  const goods = Math.floor(state.goodLines);
  el.good.textContent = String(goods);
  el.bugs.textContent = String(bugs);
  el.bugsWrap.classList.toggle("hot", bugs > 0);
  if (bugs > 0 && bugs !== state.lastBugShown) hopBugMeter();
  state.lastBugShown = bugs;
  if (goods < state.lastGoodShown) hurtGoodMeter();
  state.lastGoodShown = goods;
  const fixing = state.holding;
  const clean = fixing && Math.floor(state.bugs) <= 0;
  el.status.textContent = !fixing ? "写屎山" : clean ? "写对的" : "改 Bug";
  el.status.classList.toggle("fixing", fixing);
  el.status.classList.toggle("slop", !fixing);
  document.body.classList.toggle("is-fixing", fixing);
  document.body.classList.toggle("is-slop", !fixing);
}

function poke() {
  if (state.paused || !state.started) return;
  state.focusUntil = state.time + TAP_FOCUS;
  state.holding = true;
  state.flashAge = 0;
  renderHud();
}

function startGame() {
  if (state.started) return;
  state.started = true;
  el.intro.classList.add("hidden");
  pushLog("// 开工", "dim");
}

function openSheet(finalQuit) {
  state.paused = true;
  state.holding = false;
  state.focusUntil = 0;
  const lines = Math.floor(state.lines);
  const bugs = Math.floor(state.bugs);
  el.sumLines.textContent = String(lines);
  el.sumGood.textContent = String(Math.floor(state.goodLines));
  el.sumBugs.textContent = String(bugs);
  el.sumRank.textContent = rank().name;
  const nxt = RANKS[state.rank + 1];
  el.sumNext.textContent = nxt ? nxt.name : "满级";
  el.stamp.classList.toggle("hidden", bugs !== 0);
  el.sheetTitle.textContent = finalQuit ? "下班" : "收工";
  el.actions.innerHTML = "";
  if (!finalQuit && state.rank < RANKS.length - 1) {
    const up = document.createElement("button");
    up.className = "primary";
    up.textContent = "晋升";
    up.addEventListener("click", promote);
    const bye = document.createElement("button");
    bye.textContent = "下班";
    bye.addEventListener("click", () => openSheet(true));
    el.actions.append(up, bye);
  } else {
    const again = document.createElement("button");
    again.className = "primary";
    again.textContent = "再来一局";
    again.addEventListener("click", resetRun);
    el.actions.append(again);
  }
  el.sheet.classList.remove("hidden");
  renderHud();
}

function promote() {
  if (state.rank < RANKS.length - 1) state.rank += 1;
  state.paused = false;
  el.sheet.classList.add("hidden");
  pushLog(`// 晋升 ${rank().name}，手速加快`, "ok");
  renderHud();
}

function resetRun() {
  state.started = false;
  state.holding = false;
  state.paused = false;
  state.rank = 0;
  state.lines = 0;
  state.goodLines = 0;
  state.bugs = 0;
  state.log = [];
  state.focusUntil = 0;
  state.flashAge = -1;
  state.lastBugShown = 0;
  state.lastGoodShown = 0;
  el.sheet.classList.add("hidden");
  el.intro.classList.remove("hidden");
  renderLog();
  renderHud();
}

function tick(now) {
  const dt = Math.min(0.05, (now - state.last) / 1000 || 0.016);
  state.last = now;
  state.time += dt;
  const r = rank();

  if (state.started && !state.paused) {
    state.holding = state.time < state.focusUntil;
    if (state.holding) {
      if (state.bugs > 0) {
        const before = state.bugs;
        state.bugs = Math.max(0, state.bugs - r.fixPerSec * dt);
        const dropped = Math.floor(before) - Math.floor(state.bugs);
        if (dropped > 0) {
          for (let i = 0; i < dropped; i += 1) {
            pushLog(`fixed  ${pick(ERR_LINES)}`, "ok");
          }
        }
      }
      if (state.bugs <= 0 && state.lines >= 1) {
        const prevG = state.goodLines;
        const maxConvert = Math.floor(state.lines);
        state.goodLines += r.linesPerSec * dt;
        let gained = Math.floor(state.goodLines) - Math.floor(prevG);
        if (gained > maxConvert) {
          state.goodLines = Math.floor(prevG) + maxConvert;
          gained = maxConvert;
        }
        if (gained > 0) {
          state.lines = Math.max(0, state.lines - gained);
          for (let i = 0; i < gained; i += 1) {
            pushLog(pick(GOOD_LINES), "ok");
          }
        }
      }
    } else {
      const prevL = state.lines;
      const prevB = state.bugs;
      const prevG = state.goodLines;
      state.lines += r.linesPerSec * dt;
      state.bugs += r.bugsPerSec * dt;
      const newBugs = Math.floor(state.bugs) - Math.floor(prevB);
      if (newBugs > 0) {
        state.goodLines = Math.max(0, state.goodLines - newBugs);
        for (let i = 0; i < newBugs; i += 1) {
          pushLog(pick(ERR_LINES), "err");
        }
      }
      if (Math.floor(state.lines) > Math.floor(prevL)) {
        pushLog(pick(SLOP_LINES), "dim");
      }
      state.goodLines = Math.max(0, state.goodLines);
    }
  }

  if (state.flashAge >= 0) {
    state.flashAge += dt;
    if (state.flashAge >= FLASH_DUR) state.flashAge = -1;
  }

  drawFace(state.rank);
  drawScene(state.time, state.holding && state.started && !state.paused, state.rank, state.bugs);
  renderHud();
  requestAnimationFrame(tick);
}

function isClockOutTarget(target) {
  return !!(target && (target === el.clockOut || el.clockOut.contains(target)));
}

function onDown(ev) {
  if (isClockOutTarget(ev.target)) return;
  if (el.sheet.contains(ev.target)) return;
  if (ev.pointerType === "mouse" && ev.button !== 0) return;
  ev.preventDefault();
  if (!state.started) startGame();
  poke();
}

el.app.addEventListener("pointerdown", onDown);
el.intro.addEventListener("pointerdown", onDown);

el.clockOut.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
});
el.clockOut.addEventListener("click", (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  if (!state.started || state.paused) return;
  openSheet(false);
});

window.addEventListener("keydown", (ev) => {
  if (ev.code !== "Space" || ev.repeat) return;
  ev.preventDefault();
  if (!state.started) startGame();
  poke();
});

renderHud();
state.last = performance.now();
loadGfx().then(() => requestAnimationFrame(tick)).catch((err) => {
  console.error(err);
  requestAnimationFrame(tick);
});
