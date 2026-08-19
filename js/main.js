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
  ctx.clearRect(0, 0, 48, 48);
  px(ctx, 0, 0, 48, 48, "#21262d");
  px(ctx, 8, 14, 32, 28, "#e2b48a");
  px(ctx, 14, 22, 6, 4, "#3d2918");
  px(ctx, 28, 22, 6, 4, "#3d2918");
  if (blink) {
    px(ctx, 14, 23, 6, 2, "#e2b48a");
    px(ctx, 28, 23, 6, 2, "#e2b48a");
  }
  px(ctx, 20, 28, 8, 3, "#c4896a");
  if (rankId === 0) {
    px(ctx, 8, 8, 32, 10, "#2b2118");
    px(ctx, 6, 14, 6, 16, "#2b2118");
    px(ctx, 36, 14, 6, 16, "#2b2118");
  } else if (rankId === 1) {
    px(ctx, 8, 10, 32, 6, "#3a2a1c");
    px(ctx, 6, 14, 5, 10, "#3a2a1c");
    px(ctx, 37, 14, 5, 10, "#3a2a1c");
    px(ctx, 16, 12, 16, 4, "#e2b48a");
  } else {
    px(ctx, 10, 12, 28, 6, "#e2b48a");
    px(ctx, 18, 10, 12, 4, "#f0d2b0");
    px(ctx, 12, 32, 24, 4, "#c4896a");
  }
}

function drawScene(t, holding, rankId, bugs) {
  const canvas = el.scene;
  const ctx = sceneCtx;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 220;
  const cw = Math.max(160, Math.floor(w * dpr / 4) * 2);
  const ch = Math.max(110, Math.floor(h * dpr / 4) * 2);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
    ctx.imageSmoothingEnabled = false;
  }
  const s = Math.min(cw / 160, ch / 110);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  const W = cw / s;
  const H = ch / s;

  const flashing = state.flashAge >= 0 && state.flashAge < FLASH_DUR;
  const k = Math.max(1.35, (H * 0.55) / 52);
  const u = (n) => Math.max(2, Math.round(n * k));
  const tap = Math.floor(t * 12) % 2 ? u(1) : 0;

  px(ctx, 0, 0, W, H, "#1a1c1e");
  px(ctx, 0, 0, W, Math.floor(H * 0.64), "#242628");
  px(ctx, Math.floor(W * 0.62), Math.floor(H * 0.08), Math.floor(W * 0.28), Math.floor(H * 0.34), "#101214");
  px(ctx, Math.floor(W * 0.64), Math.floor(H * 0.1), Math.floor(W * 0.11), Math.floor(H * 0.14), "#1c2430");
  px(ctx, Math.floor(W * 0.76), Math.floor(H * 0.12), Math.floor(W * 0.1), Math.floor(H * 0.12), "#181e28");
  px(ctx, 0, Math.floor(H * 0.6), W, u(3), "#323538");
  px(ctx, u(4), Math.floor(H * 0.38), u(16), Math.floor(H * 0.24), "#2a2c2e");
  px(ctx, u(6), Math.floor(H * 0.42), u(12), u(8), "#1a1c1e");

  const deskY = Math.floor(H * 0.72);
  px(ctx, 0, deskY, W, H - deskY, "#2c2f32");
  px(ctx, 0, deskY, W, u(10), "#3a3d40");
  px(ctx, 0, deskY + u(10), W, u(2), "#1e2022");

  const cx = Math.floor(W * 0.30);
  const monW = u(34);
  const monH = u(50);
  const monX = Math.floor(W * 0.66);
  const monY = deskY - monH - u(2);
  const leak = flashing ? "#d7e8f2" : holding ? "#8aa4b3" : "#5d717c";
  px(ctx, monX - u(7), monY + u(6), u(7), monH - u(14), leak);
  px(ctx, monX - u(12), monY + u(12), u(8), monH - u(24), flashing ? "#f2f7fa" : "#6d8490");

  px(ctx, monX, monY, monW, monH, "#1c1e20");
  px(ctx, monX + u(3), monY + u(3), monW - u(6), monH - u(12), "#121416");
  px(ctx, monX + u(6), monY + u(8), monW - u(12), u(3), "#2a2d30");
  px(ctx, monX + Math.floor(monW / 2) - u(5), monY + monH - u(10), u(10), u(8), "#2a2c2e");
  px(ctx, monX + Math.floor(monW / 2) - u(14), deskY - u(2), u(28), u(4), "#232528");
  px(ctx, monX - u(18), deskY - u(3), u(24), u(3), "#3e4246");
  px(ctx, monX - u(16), deskY - u(5) + tap, u(8), u(2), "#4a4e52");

  const shirt = "#4d565e";
  const torsoY = deskY - u(34);
  px(ctx, cx - u(16), torsoY, u(36), u(34), shirt);
  if (rankId === 2) {
    px(ctx, cx - u(18), torsoY + u(14), u(40), u(20), shirt);
  }
  px(ctx, cx - u(2), torsoY + u(2), u(12), u(16), flashing ? "#c5d0d6" : "#8b969e");
  const headY = torsoY - u(24);
  const lit = flashing ? "#ffe8cc" : "#f0d0b0";
  const shade = "#b88968";
  px(ctx, cx - u(12), headY, u(14), u(24), shade);
  px(ctx, cx + u(2), headY, u(16), u(24), lit);
  px(ctx, cx + u(10), headY + u(6), u(6), u(14), flashing ? "#fff3e0" : lit);
  if (rankId === 0) {
    px(ctx, cx - u(14), headY - u(8), u(32), u(12), "#2b2118");
    px(ctx, cx - u(16), headY + u(2), u(8), u(16), "#2b2118");
    px(ctx, cx + u(16), headY + u(2), u(8), u(12), "#2b2118");
  } else if (rankId === 1) {
    px(ctx, cx - u(14), headY - u(4), u(32), u(8), "#3a2a1c");
    px(ctx, cx - u(2), headY - u(6), u(16), u(6), lit);
  } else {
    px(ctx, cx + u(2), headY - u(4), u(14), u(5), "#e8d4b8");
  }
  px(ctx, cx - u(2), headY + u(10), u(5), u(4), "#3d2918");
  px(ctx, cx + u(8), headY + u(10), u(5), u(4), "#3d2918");
  px(ctx, cx + u(12), headY + u(12), u(4), u(6), "#c97a6a");
  px(ctx, cx - u(22), torsoY + u(10), u(12), u(7), shade);
  px(ctx, cx + u(18), torsoY + u(12) + tap, u(14), u(6), lit);
  px(ctx, cx + u(28) + tap, deskY - u(6), u(8), u(4), lit);
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

function renderHud() {
  const r = rank();
  el.rank.textContent = r.name;
  const lines = Math.floor(state.lines);
  const bugs = Math.floor(state.bugs);
  el.lines.textContent = String(lines);
  el.good.textContent = String(Math.floor(state.goodLines));
  el.bugs.textContent = String(bugs);
  el.bugsWrap.classList.toggle("hot", bugs > 0);
  if (bugs > 0 && bugs !== state.lastBugShown) hopBugMeter();
  state.lastBugShown = bugs;
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
