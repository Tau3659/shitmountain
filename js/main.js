import {
  ACHIEVEMENTS,
  FIRE_BUGS,
  ITEMS,
  SAVE_KEY,
  SKINS,
  WARN_BUGS,
  applyPromotion,
  buyItem,
  buyOrWearSkin,
  collectAchievements,
  emptyMeta,
  emptyRun,
  equippedItems,
  faceIndex,
  findSkin,
  grantPay,
  markClockOut,
  nextRankName,
  normalizeMeta,
  runPay,
  statsFor,
  stepWork,
  toggleEquip,
} from "./career.js";

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

function loadMeta() {
  try {
    return normalizeMeta(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"));
  } catch {
    return emptyMeta();
  }
}

function saveMeta() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
}

const el = {
  app: document.getElementById("app"),
  face: document.getElementById("face"),
  rank: document.getElementById("rank-name"),
  wallet: document.getElementById("wallet"),
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
  sheetNote: document.getElementById("sheet-note"),
  sumLines: document.getElementById("sum-lines"),
  sumBugs: document.getElementById("sum-bugs"),
  stamp: document.getElementById("clear-stamp"),
  actions: document.getElementById("sheet-actions"),
  sumRank: document.getElementById("sum-rank"),
  sumNext: document.getElementById("sum-next"),
  sumGood: document.getElementById("sum-good"),
  sumPay: document.getElementById("sum-pay"),
  sumMoney: document.getElementById("sum-money"),
  shop: document.getElementById("shop"),
  shopList: document.getElementById("shop-list"),
  shopClose: document.getElementById("shop-close"),
  shopTabs: document.getElementById("shop-tabs"),
  shopMoney: document.getElementById("shop-money"),
  feats: document.getElementById("feats"),
  featList: document.getElementById("feat-list"),
  featClose: document.getElementById("feat-close"),
};

const faceCtx = el.face.getContext("2d");
const sceneCtx = el.scene.getContext("2d");
faceCtx.imageSmoothingEnabled = false;
sceneCtx.imageSmoothingEnabled = false;

const FLASH_DUR = 0.09;
const meta = loadMeta();
const state = {
  ...emptyRun(),
  log: [],
  time: 0,
  last: 0,
  focusUntil: 0,
  flashAge: -1,
  lastBugShown: 0,
  lastGoodShown: 0,
  sheetCounted: false,
};

let shopTab = "skins";
let sheetMode = "clock";
const tintCache = new Map();

function stats() {
  return statsFor(state.rank, meta);
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
  const ids = meta.equipped;
  let slot = 0;
  const drawSlot = (draw) => {
    const x = 14 + slot * 12;
    draw(x, 70);
    slot += 1;
  };
  if (ids.includes("coffee")) {
    drawSlot((x, y) => {
      px(ctx, x, y + 4, 6, 6, "#d0d4d8");
      px(ctx, x + 1, y + 5, 4, 3, "#3a2a22");
      px(ctx, x + 6, y + 6, 2, 3, "#8b9094");
    });
  }
  if (ids.includes("duck")) {
    drawSlot((x, y) => {
      px(ctx, x, y + 4, 7, 5, "#d4b45a");
      px(ctx, x + 5, y + 3, 3, 3, "#d4b45a");
      px(ctx, x + 7, y + 4, 2, 1, "#d45a4a");
    });
  }
  if (ids.includes("lint")) {
    drawSlot((x, y) => {
      px(ctx, x, y + 3, 7, 8, "#2a4a3a");
      px(ctx, x + 1, y + 5, 5, 1, "#48d060");
      px(ctx, x + 1, y + 7, 4, 1, "#48d060");
    });
  }
  if (ids.includes("tests")) {
    drawSlot((x, y) => {
      px(ctx, x + 2, y + 3, 4, 7, "#48d060");
      px(ctx, x + 1, y + 4, 6, 2, "#d0d4d8");
    });
  }
  if (ids.includes("pair")) {
    drawSlot((x, y) => {
      px(ctx, x, y + 5, 4, 4, "#8b9094");
      px(ctx, x + 5, y + 5, 4, 4, "#d0d4d8");
    });
  }
  if (ids.includes("ci")) {
    drawSlot((x, y) => {
      px(ctx, x + 1, y + 3, 6, 6, "#3a1c1c");
      px(ctx, x + 3, y + 5, 2, 2, "#d45a4a");
    });
  }
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
  handsPress: null,
  keys: null,
  crt: null,
  faces: [null, null, null],
};

const SPR = {
  head: { x: 16, y: 50 },
  body: { x: 16, y: 60 },
  hands: { x: 20, y: 73 },
  keys: { x: 14, y: 74 },
  crt: { x: 28, y: 56 },
};

function blit(ctx, img, x, y) {
  if (!img) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x | 0, y | 0);
}

function isHoodie(r, g, b, a) {
  return a > 12 && b > r + 8 && b >= g;
}

function isHair(r, g, b, a) {
  return a > 12 && r < 48 && g < 48 && b < 56 && r + g + b < 130;
}

function tintSprite(img, skin) {
  if (!img) return img;
  if (!skin.hoodie && !skin.hair) return img;
  const key = `${img.src || img.width}x${img.height}:${skin.id}`;
  if (tintCache.has(key)) return tintCache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pix = data.data;
  for (let i = 0; i < pix.length; i += 4) {
    const r = pix[i];
    const g = pix[i + 1];
    const b = pix[i + 2];
    const a = pix[i + 3];
    if (skin.hair && isHair(r, g, b, a)) {
      const lum = (r + g + b) / 120;
      pix[i] = Math.min(255, skin.hair[0] * lum);
      pix[i + 1] = Math.min(255, skin.hair[1] * lum);
      pix[i + 2] = Math.min(255, skin.hair[2] * lum);
    } else if (skin.hoodie && isHoodie(r, g, b, a)) {
      const lum = (r + g + b) / 220;
      pix[i] = Math.min(255, Math.round(skin.hoodie[0] * lum + 16));
      pix[i + 1] = Math.min(255, Math.round(skin.hoodie[1] * lum + 16));
      pix[i + 2] = Math.min(255, Math.round(skin.hoodie[2] * lum + 16));
    }
  }
  ctx.putImageData(data, 0, 0);
  tintCache.set(key, canvas);
  return canvas;
}

function drawAcc(ctx, x, y, acc) {
  if (acc === "shades") {
    px(ctx, x + 6, y + 11, 13, 3, "#12141a");
    px(ctx, x + 7, y + 12, 5, 1, "#5a5e62");
    px(ctx, x + 13, y + 12, 5, 1, "#5a5e62");
  } else if (acc === "gold-glasses") {
    px(ctx, x + 6, y + 11, 13, 1, "#d4b45a");
    px(ctx, x + 6, y + 12, 1, 3, "#d4b45a");
    px(ctx, x + 12, y + 12, 1, 3, "#d4b45a");
    px(ctx, x + 18, y + 12, 1, 3, "#d4b45a");
    px(ctx, x + 7, y + 13, 4, 2, "#a8d4e8");
    px(ctx, x + 13, y + 13, 5, 2, "#a8d4e8");
  } else if (acc === "tie") {
    px(ctx, x + 12, y + 22, 3, 4, "#d45a4a");
  }
}

function drawTieOnBody(ctx, x, y) {
  px(ctx, x + 12, y + 2, 3, 10, "#d45a4a");
  px(ctx, x + 13, y + 3, 1, 8, "#3a1c1c");
}

function currentSkin() {
  return findSkin(meta.skin);
}

function drawFace(rankId) {
  const ctx = faceCtx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 32, 32);
  const img = gfx.faces[faceIndex(rankId)] || gfx.faces[0];
  if (!img) return;
  const skin = currentSkin();
  const tinted = tintSprite(img, skin);
  const x = (32 - img.width) >> 1;
  const y = (32 - img.height) >> 1;
  ctx.drawImage(tinted, x, y);
  drawAcc(ctx, x, y, skin.acc);
  if (skin.acc === "tie") drawTieOnBody(ctx, x, y + 18);
}

function loadGfx() {
  const names = ["head", "body", "hands", "hands-press", "keys", "crt", "face-0", "face-1", "face-2"];
  return Promise.all(names.map((name) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve([name, img]);
    img.onerror = () => reject(new Error(name));
    img.src = `img/${name}.png`;
  }))).then((pairs) => {
    for (const [name, img] of pairs) {
      if (name.startsWith("face-")) gfx.faces[Number(name.slice(5))] = img;
      else if (name === "hands-press") gfx.handsPress = img;
      else gfx[name] = img;
    }
  });
}

function layerBody(ctx) {
  const skin = currentSkin();
  blit(ctx, tintSprite(gfx.head, skin), SPR.head.x, SPR.head.y);
  blit(ctx, tintSprite(gfx.body, skin), SPR.body.x, SPR.body.y);
  drawAcc(ctx, SPR.head.x, SPR.head.y, skin.acc);
  if (skin.acc === "tie") drawTieOnBody(ctx, SPR.body.x, SPR.body.y);
}

function layerHandsKeys(ctx, press) {
  blit(ctx, gfx.keys, SPR.keys.x, SPR.keys.y);
  blit(ctx, press ? gfx.handsPress : gfx.hands, SPR.hands.x, SPR.hands.y);
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

function drawScene(t, holding) {
  const canvas = el.scene;
  const ctx = sceneCtx;
  if (canvas.width !== 160 || canvas.height !== 120) {
    canvas.width = 160;
    canvas.height = 120;
    ctx.imageSmoothingEnabled = false;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const flashing = state.flashAge >= 0 && state.flashAge < FLASH_DUR;
  const press = (Math.floor(t * 10) % 2) === 1;
  layerWall(ctx);
  layerDesk(ctx);
  layerProps(ctx);
  layerMonitor(ctx, holding, flashing);
  layerBody(ctx);
  layerHandsKeys(ctx, press);
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

function flushAchievements() {
  const unlocked = collectAchievements(state, meta);
  for (const achievement of unlocked) {
    pushLog(`// 成就 ${achievement.name}`, "ok");
  }
  if (unlocked.length) saveMeta();
}

function renderHud() {
  const current = stats();
  el.rank.textContent = current.name;
  el.wallet.textContent = `¥ ${meta.money}`;
  const lines = Math.floor(state.lines);
  const bugs = Math.floor(state.bugs);
  el.lines.textContent = String(lines);
  const goods = Math.floor(state.goodLines);
  el.good.textContent = String(goods);
  el.bugs.textContent = String(bugs);
  el.bugsWrap.classList.toggle("hot", bugs > 0);
  el.bugsWrap.classList.toggle("warn", bugs >= WARN_BUGS && bugs < FIRE_BUGS);
  el.bugsWrap.classList.toggle("fire", bugs >= FIRE_BUGS || state.fired);
  if (bugs > 0 && bugs !== state.lastBugShown) hopBugMeter();
  state.lastBugShown = bugs;
  if (goods < state.lastGoodShown) hurtGoodMeter();
  state.lastGoodShown = goods;
  const fixing = state.holding && state.started && !state.paused && !state.fired;
  const clean = fixing && bugs <= 0;
  let status = !fixing ? "写屎山" : clean ? "写对的" : "改 Bug";
  if (!fixing && bugs >= WARN_BUGS && !state.fired) status = "绩效危险";
  if (state.fired) status = "被开除";
  el.status.textContent = status;
  el.status.classList.toggle("fixing", fixing);
  el.status.classList.toggle("slop", !fixing && !state.fired);
  el.status.classList.toggle("danger", !fixing && bugs >= WARN_BUGS);
  document.body.classList.toggle("is-fixing", fixing);
  document.body.classList.toggle("is-slop", !fixing);
}

function poke() {
  if (state.paused || !state.started || state.fired) return;
  state.focusUntil = state.time + stats().tapFocus;
  state.holding = true;
  state.flashAge = 0;
  renderHud();
}

function startGame() {
  if (state.started) return;
  state.started = true;
  el.intro.classList.add("hidden");
  const gear = equippedItems(meta).map((item) => item.name);
  pushLog("// 开工", "dim");
  if (gear.length) pushLog(`// 装备 ${gear.join(" / ")}`, "ok");
}

function btn(label, className, onClick) {
  const node = document.createElement("button");
  if (className) node.className = className;
  node.textContent = label;
  node.addEventListener("click", onClick);
  return node;
}

function closeOverlays() {
  el.shop.classList.add("hidden");
  el.feats.classList.add("hidden");
}

function openSheet(mode) {
  sheetMode = mode;
  state.paused = true;
  state.holding = false;
  state.focusUntil = 0;
  closeOverlays();
  const bugs = Math.floor(state.bugs);
  const finalQuit = mode === "quit";
  const fired = mode === "fired" || state.fired;
  if (fired) state.fired = true;

  if ((finalQuit || fired) && !state.settled) {
    const pay = grantPay(meta, state);
    state.settled = true;
    saveMeta();
    pushLog(fired ? `// 遣散费 ¥ ${pay}` : `// 到账 ¥ ${pay}`, fired ? "err" : "ok");
  }

  if (mode === "clock" && !fired && !state.sheetCounted) {
    markClockOut(state, meta);
    state.sheetCounted = true;
  }
  flushAchievements();
  saveMeta();

  el.sumLines.textContent = String(Math.floor(state.lines));
  el.sumGood.textContent = String(Math.floor(state.goodLines));
  el.sumBugs.textContent = String(bugs);
  el.sumRank.textContent = stats().name;
  el.sumNext.textContent = nextRankName(state.rank);
  el.sumPay.textContent = `¥ ${runPay(state)}`;
  el.sumMoney.textContent = `¥ ${meta.money}`;

  if (fired) {
    el.sheetTitle.textContent = "开除";
    el.sheetNote.textContent = `Bug 堆到 ${FIRE_BUGS}，你被赶出职场`;
    el.stamp.classList.remove("hidden");
    el.stamp.className = "stamp stamp-fire";
    el.stamp.innerHTML = "被开<br>除了";
  } else if (finalQuit) {
    el.sheetTitle.textContent = "下班";
    el.sheetNote.textContent = bugs === 0 ? "清流下班，工资进账" : "带着 bug 下班，晋升没了";
    el.stamp.classList.toggle("hidden", bugs !== 0);
    el.stamp.className = "stamp";
    el.stamp.innerHTML = "0 BUG<br>通关";
  } else {
    el.sheetTitle.textContent = "收工";
    if (bugs === 0) {
      el.sheetNote.textContent = state.rank < 4 ? "清流：0 bug，可以晋升" : "清流：已满级";
    } else {
      el.sheetNote.textContent = bugs >= WARN_BUGS
        ? "高危：有 bug 无法晋升，再堆会被开"
        : "高危：有 bug 无法晋升";
    }
    el.stamp.classList.toggle("hidden", bugs !== 0);
    el.stamp.className = "stamp";
    el.stamp.innerHTML = "0 BUG<br>通关";
  }

  el.actions.innerHTML = "";
  if (fired || finalQuit) {
    el.actions.append(
      btn("再来一局", "primary", resetRun),
      btn("商店", "", () => openShop()),
      btn("成就", "", () => openFeats()),
    );
  } else {
    if (bugs === 0 && state.rank < 4) {
      el.actions.append(btn("晋升", "primary", promote));
    }
    el.actions.append(
      btn("继续写", bugs === 0 && state.rank < 4 ? "" : "primary", resumeWork),
      btn("商店", "", () => openShop()),
      btn("成就", "", () => openFeats()),
      btn("下班", "", () => openSheet("quit")),
    );
  }
  el.sheet.classList.remove("hidden");
  renderHud();
}

function resumeWork() {
  if (state.fired || state.settled) return;
  state.paused = false;
  state.sheetCounted = false;
  el.sheet.classList.add("hidden");
  closeOverlays();
  renderHud();
}

function promote() {
  const result = applyPromotion(state, meta);
  if (!result.ok) {
    pushLog(result.reason === "bugs" ? "// 有 bug，无法晋升" : "// 已经满级", "err");
    openSheet("clock");
    return;
  }
  state.paused = false;
  el.sheet.classList.add("hidden");
  closeOverlays();
  pushLog(`// 晋升 ${result.name}，¥ ${result.bonus}`, "ok");
  flushAchievements();
  saveMeta();
  renderHud();
}

function resetRun() {
  const keep = {
    log: [],
    time: state.time,
    last: state.last,
    focusUntil: 0,
    flashAge: -1,
    lastBugShown: 0,
    lastGoodShown: 0,
    sheetCounted: false,
  };
  Object.assign(state, emptyRun(), keep);
  closeOverlays();
  el.sheet.classList.add("hidden");
  el.intro.classList.remove("hidden");
  renderLog();
  renderHud();
}

function renderShop() {
  el.shopMoney.textContent = `¥ ${meta.money}`;
  for (const tab of el.shopTabs.querySelectorAll("[data-tab]")) {
    tab.classList.toggle("on", tab.dataset.tab === shopTab);
  }
  el.shopList.innerHTML = "";
  if (shopTab === "skins") {
    for (const skin of SKINS) {
      const owned = meta.ownedSkins.includes(skin.id);
      const locked = skin.require && !meta.achievements.includes(skin.require);
      const worn = meta.skin === skin.id;
      const row = document.createElement("button");
      row.type = "button";
      row.className = "shop-row";
      row.disabled = locked;
      row.innerHTML = `<span>${skin.name}</span><strong>${
        locked ? "开除解锁" : worn ? "穿着" : owned ? "换上" : `¥ ${skin.price}`
      }</strong>`;
      row.addEventListener("click", () => {
        const result = buyOrWearSkin(meta, skin.id);
        if (!result.ok) {
          pushLog(result.reason === "poor" ? "// 钱不够" : "// 还不能买", "err");
          renderShop();
          return;
        }
        tintCache.clear();
        if (result.bought) pushLog(`// 买下 ${skin.name}`, "ok");
        else pushLog(`// 换上 ${skin.name}`, "dim");
        flushAchievements();
        saveMeta();
        renderShop();
        renderHud();
      });
      el.shopList.append(row);
    }
  } else {
    el.shopList.append(Object.assign(document.createElement("p"), {
      className: "shop-hint",
      textContent: "最多装备 2 件。减 bug、催着改。",
    }));
    for (const item of ITEMS) {
      const owned = meta.ownedItems.includes(item.id);
      const on = meta.equipped.includes(item.id);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "shop-row";
      row.innerHTML = `<span>${item.name}<small>${item.desc}</small></span><strong>${
        on ? "卸下" : owned ? "装备" : `¥ ${item.price}`
      }</strong>`;
      row.addEventListener("click", () => {
        if (!owned) {
          const bought = buyItem(meta, item.id);
          if (!bought.ok) {
            pushLog(bought.reason === "poor" ? "// 钱不够" : "// 已经有了", "err");
            renderShop();
            return;
          }
          pushLog(`// 买下 ${item.name}`, "ok");
          const equipped = toggleEquip(meta, item.id);
          if (!equipped.ok && equipped.reason === "slots") {
            pushLog("// 只能带 2 件，去卸一件", "err");
          }
        } else {
          const toggled = toggleEquip(meta, item.id);
          if (!toggled.ok && toggled.reason === "slots") {
            pushLog("// 只能带 2 件", "err");
            renderShop();
            return;
          }
          pushLog(toggled.equipped ? `// 装备 ${item.name}` : `// 卸下 ${item.name}`, "dim");
        }
        flushAchievements();
        saveMeta();
        renderShop();
        renderHud();
      });
      el.shopList.append(row);
    }
  }
}

function openShop() {
  el.sheet.classList.add("hidden");
  el.feats.classList.add("hidden");
  renderShop();
  el.shop.classList.remove("hidden");
}

function renderFeats() {
  flushAchievements();
  el.featList.innerHTML = "";
  for (const achievement of ACHIEVEMENTS) {
    const got = meta.achievements.includes(achievement.id);
    const row = document.createElement("li");
    row.className = got ? "got" : "miss";
    row.innerHTML = `<span>${achievement.name}</span><small>${achievement.desc}</small>`;
    el.featList.append(row);
  }
}

function openFeats() {
  el.sheet.classList.add("hidden");
  el.shop.classList.add("hidden");
  renderFeats();
  el.feats.classList.remove("hidden");
}

function backToSheet() {
  closeOverlays();
  el.sheet.classList.remove("hidden");
  openSheet(sheetMode);
}

function tick(now) {
  const dt = Math.min(0.05, (now - state.last) / 1000 || 0.016);
  state.last = now;
  state.time += dt;
  const current = stats();

  if (state.started && !state.paused) {
    state.holding = state.time < state.focusUntil;
    const events = stepWork(state, current, dt, state.holding);
    if (events.bugsFixed > 0) {
      for (let i = 0; i < events.bugsFixed; i += 1) pushLog(`fixed  ${pick(ERR_LINES)}`, "ok");
    }
    if (events.converted > 0) {
      for (let i = 0; i < events.converted; i += 1) pushLog(pick(GOOD_LINES), "ok");
    }
    if (events.bugsGained > 0) {
      for (let i = 0; i < events.bugsGained; i += 1) pushLog(pick(ERR_LINES), "err");
    }
    if (events.slopLines > 0) {
      for (let i = 0; i < events.slopLines; i += 1) pushLog(pick(SLOP_LINES), "dim");
    }
    if (events.autoFixed > 0) {
      for (let i = 0; i < events.autoFixed; i += 1) pushLog("ci 催修  " + pick(ERR_LINES), "ok");
    }
    if (events.fired) {
      meta.stats.fires += 1;
      pushLog("// FATAL: 你被赶出职场", "err");
      flushAchievements();
      saveMeta();
      openSheet("fired");
    }
  }

  if (state.flashAge >= 0) {
    state.flashAge += dt;
    if (state.flashAge >= FLASH_DUR) state.flashAge = -1;
  }

  drawFace(state.rank);
  drawScene(state.time, state.holding && state.started && !state.paused && !state.fired);
  renderHud();
  requestAnimationFrame(tick);
}

function isUiTarget(target) {
  return !!(
    target
    && (
      target === el.clockOut
      || el.clockOut.contains(target)
      || el.sheet.contains(target)
      || el.shop.contains(target)
      || el.feats.contains(target)
    )
  );
}

function onDown(ev) {
  if (isUiTarget(ev.target)) return;
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
  if (!state.started || state.paused || state.fired) return;
  openSheet("clock");
});

el.shopTabs.addEventListener("click", (ev) => {
  const tab = ev.target.closest("[data-tab]");
  if (!tab) return;
  shopTab = tab.dataset.tab;
  renderShop();
});
el.shopClose.addEventListener("click", backToSheet);
el.featClose.addEventListener("click", backToSheet);

window.addEventListener("keydown", (ev) => {
  if (ev.code !== "Space" || ev.repeat) return;
  ev.preventDefault();
  if (state.paused || state.fired) return;
  if (!state.started) startGame();
  poke();
});

renderHud();
state.last = performance.now();
loadGfx().then(() => requestAnimationFrame(tick)).catch((err) => {
  console.error(err);
  requestAnimationFrame(tick);
});
