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
};

const faceCtx = el.face.getContext("2d");
const sceneCtx = el.scene.getContext("2d");
faceCtx.imageSmoothingEnabled = false;
sceneCtx.imageSmoothingEnabled = false;

const TAP_FOCUS = 0.6;
const JUMP_DUR = 0.16;

const state = {
  started: false,
  holding: false,
  paused: false,
  rank: 0,
  lines: 0,
  bugs: 0,
  log: [],
  time: 0,
  last: 0,
  focusUntil: 0,
  jumpsLeft: 0,
  jumpAge: -1,
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

  px(ctx, 0, 0, W, H, holding ? "#243044" : "#1a1420");
  px(ctx, 0, H * 0.62, W, H, "#2b1c12");
  px(ctx, 0, H * 0.62, W, 3, "#4a3222");

  const deskY = H * 0.7;
  px(ctx, 12, deskY, W - 24, 14, "#5a3b24");
  px(ctx, 18, deskY + 14, 10, H - deskY, "#3a2416");
  px(ctx, W - 28, deskY + 14, 10, H - deskY, "#3a2416");

  const monX = W * 0.54;
  const monY = deskY - 46;
  px(ctx, monX, monY, 58, 40, "#111");
  px(ctx, monX + 3, monY + 3, 52, 30, holding ? "#0d2a18" : "#2a1010");
  const flicker = holding ? 0 : (Math.sin(t * 18) > 0 ? 1 : 0);
  for (let i = 0; i < 5; i += 1) {
    const col = holding ? "#3fb950" : (flicker && i % 2 ? "#f85149" : "#e3b341");
    px(ctx, monX + 6, monY + 6 + i * 5, 20 + (i * 7) % 26, 2, col);
  }
  px(ctx, monX + 24, monY + 34, 10, 8, "#222");
  px(ctx, monX + 14, deskY - 4, 30, 4, "#333");

  const hunch = holding ? 0 : 7;
  const tap = !holding && Math.floor(t * 10) % 2;
  const u = state.jumpAge >= 0 ? Math.min(1, state.jumpAge / JUMP_DUR) : 0;
  const hop = state.jumpAge >= 0 ? Math.sin(u * Math.PI) * 12 : 0;
  const bodyX = W * 0.28;
  const bodyY = deskY - 8 - (holding ? 4 : 0) - hop;
  px(ctx, bodyX - 10, bodyY - 28 + hunch, 28, 26, "#1f6feb");
  px(ctx, bodyX - 6, bodyY - 44 + hunch, 20, 18, "#e2b48a");
  if (rankId === 0) {
    px(ctx, bodyX - 8, bodyY - 50 + hunch, 24, 10, "#2b2118");
  } else if (rankId === 1) {
    px(ctx, bodyX - 8, bodyY - 48 + hunch, 24, 6, "#3a2a1c");
    px(ctx, bodyX - 2, bodyY - 50 + hunch, 12, 4, "#e2b48a");
  } else {
    px(ctx, bodyX - 2, bodyY - 48 + hunch, 12, 4, "#f0d2b0");
    px(ctx, bodyX - 10, bodyY - 18 + hunch, 28, 10, "#1f6feb");
  }
  px(ctx, bodyX - 16, bodyY - 12 + hunch, 12, 6, "#e2b48a");
  px(ctx, bodyX + 12, bodyY - 8 + hunch + tap, 16, 5, "#e2b48a");
  px(ctx, bodyX + 24, deskY - 2, 10, 3, "#c9d1d9");

  if (holding && bugs <= 0) {
    px(ctx, bodyX - 2, bodyY - 36 + hunch, 6, 2, "#3d2918");
    px(ctx, bodyX + 8, bodyY - 36 + hunch, 6, 2, "#3d2918");
  }

  if (!holding) {
    px(ctx, monX + 40, monY - 8, 3, 3, "#f85149");
    px(ctx, monX + 48, monY - 4, 2, 2, "#e3b341");
  }
}

function pushLog(text, kind) {
  state.log.push({ text, kind });
  if (state.log.length > 18) state.log.shift();
  renderLog();
}

function renderLog() {
  el.cons.innerHTML = state.log
    .map((row) => `<div class="${row.kind}">${row.text}</div>`)
    .join("");
  el.cons.scrollTop = el.cons.scrollHeight;
}

function renderHud() {
  const r = rank();
  el.rank.textContent = r.name;
  const lines = Math.floor(state.lines);
  const bugs = Math.floor(state.bugs);
  el.lines.textContent = String(lines);
  el.bugs.textContent = String(bugs);
  el.bugsWrap.classList.toggle("hot", bugs > 0);
  const fixing = state.holding;
  el.status.textContent = fixing ? "改 Bug" : "写屎山";
  el.status.classList.toggle("fixing", fixing);
  el.status.classList.toggle("slop", !fixing);
  document.body.classList.toggle("is-fixing", fixing);
  document.body.classList.toggle("is-slop", !fixing);
}

function poke() {
  if (state.paused || !state.started) return;
  state.focusUntil = state.time + TAP_FOCUS;
  state.holding = true;
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
  el.sumBugs.textContent = String(bugs);
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
  state.bugs = 0;
  state.log = [];
  state.focusUntil = 0;
  state.jumpsLeft = 0;
  state.jumpAge = -1;
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
      const before = state.bugs;
      state.bugs = Math.max(0, state.bugs - r.fixPerSec * dt);
      const dropped = Math.floor(before) - Math.floor(state.bugs);
      if (dropped > 0) {
        for (let i = 0; i < dropped; i += 1) {
          pushLog(`fixed  ${ERR_LINES[(Math.floor(before) - i) % ERR_LINES.length]}`, "ok");
        }
        state.jumpsLeft += dropped;
        if (state.jumpAge < 0) state.jumpAge = 0;
      }
    } else {
      const prevL = state.lines;
      const prevB = state.bugs;
      state.lines += r.linesPerSec * dt;
      state.bugs += r.bugsPerSec * dt;
      if (Math.floor(state.lines) > Math.floor(prevL)) {
        const line = SLOP_LINES[Math.floor(state.lines) % SLOP_LINES.length];
        pushLog(line, "dim");
      }
      if (Math.floor(state.bugs) > Math.floor(prevB)) {
        pushLog(ERR_LINES[Math.floor(state.bugs) % ERR_LINES.length], "err");
      }
    }
  }

  if (state.jumpAge >= 0) {
    state.jumpAge += dt;
    if (state.jumpAge >= JUMP_DUR) {
      state.jumpsLeft = Math.max(0, state.jumpsLeft - 1);
      state.jumpAge = state.jumpsLeft > 0 ? 0 : -1;
    }
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
