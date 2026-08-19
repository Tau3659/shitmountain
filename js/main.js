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
];

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

function drawFace(rankId, t) {
  const ctx = faceCtx;
  const blink = Math.sin(t * 2.1) > 0.92;
  ctx.clearRect(0, 0, 32, 32);
  px(ctx, 0, 0, 32, 32, "#12141a");
  px(ctx, 6, 10, 20, 18, "#8a6248");
  px(ctx, 14, 10, 12, 18, "#c8dce8");
  px(ctx, 10, 16, 3, 3, "#1a1410");
  px(ctx, 19, 16, 3, 3, "#1a1410");
  if (blink) {
    px(ctx, 10, 17, 3, 1, "#8a6248");
    px(ctx, 19, 17, 3, 1, "#c8dce8");
  }
  px(ctx, 14, 21, 5, 2, "#6a5344");
  if (rankId === 0) {
    px(ctx, 6, 4, 20, 8, "#1a1410");
    px(ctx, 4, 10, 5, 10, "#1a1410");
    px(ctx, 23, 10, 5, 8, "#1a1410");
  } else if (rankId === 1) {
    px(ctx, 6, 7, 20, 5, "#2a2018");
    px(ctx, 4, 10, 4, 6, "#2a2018");
    px(ctx, 24, 10, 4, 6, "#2a2018");
    px(ctx, 12, 6, 10, 4, "#c8dce8");
  } else {
    px(ctx, 8, 8, 16, 4, "#c8dce8");
    px(ctx, 14, 6, 8, 3, "#d8e8ee");
    px(ctx, 10, 24, 12, 3, "#8a6248");
  }
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

  dither(ctx, 0, 0, 160, 84, "#1a1c1e", "#12141a");
  px(ctx, 0, 84, 160, 36, "#2a2624");
  px(ctx, 0, 84, 160, 6, "#3c3834");
  px(ctx, 0, 84, 160, 1, "#4a4640");
  px(ctx, 0, 90, 160, 1, "#1a1816");

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

  px(ctx, 56, 82, 38, 5, "#1c1e20");
  px(ctx, 58, 83, 6, 2, "#3a3c40");
  px(ctx, 66, 83, 6, 2, "#3a3c40");
  px(ctx, 74, 83, 6, 2, "#3a3c40");
  px(ctx, 82, 83, 8, 2, "#3a3c40");

  const shirt = "#2a3c54";
  px(ctx, 20, 52, 42, 32, shirt);
  px(ctx, 22, 54, 10, 22, "#1e2c40");
  px(ctx, 36, 48, 10, 6, flashing ? "#e8f2f6" : "#c8dce8");

  const headX = 28;
  const headY = 20;
  px(ctx, headX, headY, 14, 30, "#8a6248");
  px(ctx, headX + 12, headY, 14, 30, flashing ? "#e8f2f6" : "#c8dce8");
  px(ctx, headX + 20, headY + 8, 6, 14, flashing ? "#f4fafc" : "#d4e8f0");
  if (rankId === 0) {
    px(ctx, headX - 2, headY - 6, 30, 10, "#1a1410");
    px(ctx, headX - 4, headY + 2, 8, 14, "#1a1410");
    px(ctx, headX + 22, headY + 2, 8, 10, "#1a1410");
  } else if (rankId === 1) {
    px(ctx, headX - 2, headY - 2, 30, 7, "#2a2018");
    px(ctx, headX + 8, headY - 4, 14, 5, flashing ? "#e8f2f6" : "#c8dce8");
  } else {
    px(ctx, headX + 10, headY - 2, 12, 4, "#d8e8ee");
    px(ctx, headX + 2, headY + 22, 20, 3, "#8a6248");
  }
  px(ctx, headX + 6, headY + 12, 3, 3, "#1a1410");
  px(ctx, headX + 16, headY + 12, 3, 3, "#1a1410");
  px(ctx, headX + 18, headY + 16, 3, 4, "#a07060");

  px(ctx, 14, 58, 10, 18, "#8a6248");
  px(ctx, 54, 62, 16, 8, shirt);
  px(ctx, 66, 76 + tap, 10, 5, flashing ? "#e8f2f6" : "#c8dce8");
  px(ctx, 72 + tap, 80, 6, 3, flashing ? "#e8f2f6" : "#a8d4e8");
}

function pushLog(text, kind) {
  state.log.push({ text, kind });
  if (state.log.length > 12) state.log.shift();
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
            pushLog(`fixed  ${ERR_LINES[(Math.floor(before) - i) % ERR_LINES.length]}`, "ok");
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
            pushLog(GOOD_LINES[Math.floor(prevG + i) % GOOD_LINES.length], "ok");
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
          pushLog(ERR_LINES[Math.floor(prevB + i) % ERR_LINES.length], "err");
        }
      }
      if (Math.floor(state.lines) > Math.floor(prevL)) {
        pushLog(SLOP_LINES[Math.floor(state.lines) % SLOP_LINES.length], "dim");
      }
      state.goodLines = Math.max(0, state.goodLines);
    }
  }

  if (state.flashAge >= 0) {
    state.flashAge += dt;
    if (state.flashAge >= FLASH_DUR) state.flashAge = -1;
  }

  drawFace(state.rank, state.time);
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
requestAnimationFrame(tick);
