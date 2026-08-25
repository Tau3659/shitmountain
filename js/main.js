function rung(name, linesPerSec, bugsPerSec, fixPerSec, goodToUp, bugsToDown) {
  return { name, linesPerSec, bugsPerSec, fixPerSec, goodToUp, bugsToDown };
}

const TRACKS = {
  good: [
    rung("实习生", 6, 0.9, 2.0, 40, 35),
    rung("初级", 8, 1.1, 2.4, 100, 80),
    rung("中级", 11, 1.4, 3.2, 250, 180),
    rung("高级", 15, 1.8, 4.2, 600, 400),
    rung("资深", 20, 2.3, 5.5, 1500, 900),
    rung("专家", 26, 2.9, 7.2, 4000, 2000),
    rung("架构师", 34, 3.7, 9.4, 10000, 4500),
    rung("技术总监", 44, 4.7, 12, 25000, 10000),
    rung("首席架构", 56, 6.0, 15, 60000, 22000),
    rung("技术合伙人", 72, 7.6, 19, null, 50000),
  ],
  bad: [
    rung("背锅侠", 10, 1.6, 2.2, 80, 50),
    rung("人肉补丁", 14, 2.3, 2.0, 200, 120),
    rung("救火队员", 19, 3.3, 1.8, 500, 280),
    rung("Bug体质", 26, 4.8, 1.6, 1200, 650),
    rung("屎山民工", 35, 7.0, 1.4, 3000, 1500),
    rung("祖传看守", 47, 10, 1.2, 8000, 3500),
    rung("事故本体", 63, 15, 1.0, 20000, 8000),
    rung("删不掉的", 84, 22, 0.8, 50000, 18000),
    rung("系统债主", 110, 32, 0.6, 120000, 40000),
    rung("屎山化石", 150, 46, 0.4, 300000, null),
  ],
};

const LINES = await fetch(new URL("./lines.json", import.meta.url)).then((res) => {
  if (!res.ok) throw new Error(`lines.json ${res.status}`);
  return res.json();
});

function pick(pool) {
  if (!pool || !pool.length) return "";
  return pool[(Math.random() * pool.length) | 0];
}

function pickBug() {
  return pick(LINES.bugs) || { err: "Error: unknown", fix: "fixed  unknown" };
}

function logErrorLine(skipRender) {
  const row = pickBug();
  state.openBugs.push(row);
  state.bugs += 1;
  state.goodLines = Math.max(0, state.goodLines - 1);
  pushLog(row.err, "err", skipRender);
}

function logFixLine(skipRender) {
  const row = state.openBugs.shift() || pickBug();
  pushLog(row.fix, "ok", skipRender);
}

function rollErrorGap() {
  const r = rank();
  const mean = Math.max(2, r.linesPerSec / r.bugsPerSec);
  const u = Math.max(1e-6, Math.random());
  const gap = Math.round(-Math.log(u) * mean);
  return Math.max(1, Math.min(Math.round(mean * 5), gap));
}

const el = {
  app: document.getElementById("app"),
  rank: document.getElementById("rank-name"),
  clockOut: document.getElementById("clock-out"),
  lines: document.getElementById("lines"),
  good: document.getElementById("good"),
  bugs: document.getElementById("bugs"),
  bugsWrap: document.getElementById("bugs-wrap"),
  goodWrap: document.getElementById("good-wrap"),
  scene: document.getElementById("scene"),
  stage: document.querySelector(".stage"),
  cons: document.getElementById("console"),
  intro: document.getElementById("intro"),
  introStart: document.getElementById("intro-start"),
  settings: document.getElementById("intro-settings"),
  sheet: document.getElementById("sheet"),
  sheetTitle: document.getElementById("sheet-title"),
  sumLines: document.getElementById("sum-lines"),
  sumBugs: document.getElementById("sum-bugs"),
  stamp: document.getElementById("clear-stamp"),
  actions: document.getElementById("sheet-actions"),
  sumRank: document.getElementById("sum-rank"),
  sumNext: document.getElementById("sum-next"),
  sumPrev: document.getElementById("sum-prev"),
  sumTrack: document.getElementById("sum-track"),
  sumNeedGood: document.getElementById("sum-need-good"),
  sumNeedBugs: document.getElementById("sum-need-bugs"),
  sheetHint: document.getElementById("sheet-hint"),
  sumGood: document.getElementById("sum-good"),
};

const TAP_FOCUS = 0.6;
const OUTPUT_SCALE = 0.3;
const QUOTA_MIN = 3000;
const QUOTA_MAX = 10000;

function rollQuota() {
  return QUOTA_MIN + Math.floor(Math.random() * (QUOTA_MAX - QUOTA_MIN + 1));
}

function writeSpeed() {
  return rank().linesPerSec * OUTPUT_SCALE;
}

const state = {
  started: false,
  holding: false,
  paused: false,
  rank: 0,
  track: "good",
  lines: 0,
  goodLines: 0,
  bugs: 0,
  written: 0,
  quota: 0,
  dayDone: false,
  log: [],
  time: 0,
  last: 0,
  focusUntil: 0,
  lastBugShown: 0,
  lastGoodShown: 0,
  linesUntilError: 1,
  openBugs: [],
};

function rank() {
  return TRACKS[state.track][state.rank];
}

function peekTitle(dir) {
  if (dir === "up") {
    if (state.track === "good") {
      return state.rank < 9 ? TRACKS.good[state.rank + 1].name : "满级";
    }
    return state.rank === 0 ? TRACKS.good[0].name : TRACKS.bad[state.rank - 1].name;
  }
  if (state.track === "bad") {
    return state.rank < 9 ? TRACKS.bad[state.rank + 1].name : "已经沉底";
  }
  return state.rank === 0 ? TRACKS.bad[0].name : TRACKS.good[state.rank - 1].name;
}

function canPromote() {
  const need = rank().goodToUp;
  return need != null && Math.floor(state.goodLines) >= need;
}

function mustDemote() {
  const need = rank().bugsToDown;
  return need != null && Math.floor(state.bugs) >= need;
}

function moveRank(dir) {
  if (dir === "up") {
    if (state.track === "bad") {
      if (state.rank === 0) {
        state.track = "good";
        state.rank = 0;
      } else {
        state.rank -= 1;
      }
    } else if (state.rank < 9) {
      state.rank += 1;
    }
    return;
  }
  if (state.track === "good") {
    if (state.rank === 0) {
      state.track = "bad";
      state.rank = 0;
    } else {
      state.rank -= 1;
    }
  } else if (state.rank < 9) {
    state.rank += 1;
  }
}

function fitScene() {
  const video = el.scene;
  if (!video || !el.stage || !video.videoWidth || !video.videoHeight) return;
  el.stage.style.setProperty("--scene-w", String(video.videoWidth));
  el.stage.style.setProperty("--scene-h", String(video.videoHeight));
}

function syncVideo() {
  const video = el.scene;
  if (!video) return;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  if (state.paused) {
    video.pause();
    return;
  }
  video.muted = !state.started;
  const play = video.play();
  if (play) {
    play.catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }
}

function unmuteVideo() {
  const video = el.scene;
  if (!video) return;
  video.muted = false;
  if (video.paused) syncVideo();
}

function logCapacity() {
  const box = el.cons;
  if (!box) return 24;
  const styles = getComputedStyle(box);
  const pad = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  const line = parseFloat(styles.lineHeight) || 14.4;
  const inner = box.clientHeight - pad;
  return Math.max(1, Math.floor(inner / line));
}

function trimLog() {
  const cap = logCapacity();
  if (state.log.length > cap) state.log.splice(0, state.log.length - cap);
}

function pushLog(text, kind, skipRender) {
  state.log.push({ text, kind });
  trimLog();
  if (!skipRender) renderLog();
}

function renderLog() {
  el.cons.innerHTML = state.log
    .map((row) => `<div class="${row.kind}">${row.text}</div>`)
    .join("");
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
  const written = Math.floor(state.written);
  const bugs = Math.floor(state.bugs);
  el.lines.textContent = String(written);
  const goods = Math.floor(state.goodLines);
  el.good.textContent = String(goods);
  el.bugs.textContent = String(bugs);
  el.bugsWrap.classList.toggle("hot", bugs > 0);
  if (bugs > 0 && bugs !== state.lastBugShown) hopBugMeter();
  state.lastBugShown = bugs;
  if (goods < state.lastGoodShown) hurtGoodMeter();
  state.lastGoodShown = goods;
}

function poke() {
  if (state.paused || !state.started) return;
  state.focusUntil = state.time + TAP_FOCUS;
  state.holding = true;
  renderHud();
}

function startGame() {
  if (state.started) return;
  state.written = 0;
  state.quota = rollQuota();
  state.dayDone = false;
  state.started = true;
  unmuteVideo();
  state.linesUntilError = rollErrorGap();
  el.intro.classList.add("hidden");
  pushLog("// 开工", "dim");
}

function openSheet(finalQuit) {
  state.paused = true;
  state.holding = false;
  state.focusUntil = 0;
  const written = Math.floor(state.written);
  const bugs = Math.floor(state.bugs);
  const good = Math.floor(state.goodLines);
  const r = rank();
  const dayDone = state.dayDone;
  el.sumLines.textContent = String(written);
  el.sumGood.textContent = String(good);
  el.sumBugs.textContent = String(bugs);
  el.sumRank.textContent = r.name;
  el.sumTrack.textContent = state.track === "good" ? "正轨" : "屎山轨";
  el.sumNext.textContent = peekTitle("up");
  el.sumPrev.textContent = peekTitle("down");
  el.sumNeedGood.textContent = r.goodToUp == null ? "—" : String(r.goodToUp);
  el.sumNeedBugs.textContent = r.bugsToDown == null ? "—" : String(r.bugsToDown);
  el.stamp.classList.toggle("hidden", bugs !== 0);
  const demote = mustDemote();
  const promo = canPromote();
  el.sheetTitle.textContent = finalQuit
    ? "下班"
    : dayDone
      ? "今日写满"
      : demote
        ? "绩效翻车"
        : promo
          ? "绩效达标"
          : "收工";
  if (el.sheetHint) {
    if (finalQuit) el.sheetHint.textContent = "";
    else if (dayDone && demote) el.sheetHint.textContent = `今日写满；Bug ${bugs} ≥ ${r.bugsToDown}，下一档是 ${peekTitle("down")}`;
    else if (dayDone && promo) el.sheetHint.textContent = `今日写满；正确 ${good} ≥ ${r.goodToUp}，可去 ${peekTitle("up")}`;
    else if (dayDone) el.sheetHint.textContent = "今日写满，自动下班";
    else if (demote) el.sheetHint.textContent = `Bug ${bugs} ≥ ${r.bugsToDown}，下一档是 ${peekTitle("down")}`;
    else if (promo) el.sheetHint.textContent = `正确 ${good} ≥ ${r.goodToUp}，可去 ${peekTitle("up")}`;
    else {
      const needG = r.goodToUp == null ? "已满级" : `正确还差 ${Math.max(0, r.goodToUp - good)}`;
      const needB = r.bugsToDown == null ? "已沉底" : `Bug 距降级 ${Math.max(0, r.bugsToDown - bugs)}`;
      el.sheetHint.textContent = `${needG}；${needB}`;
    }
  }
  el.actions.innerHTML = "";
  if (!finalQuit) {
    if (demote) {
      const down = document.createElement("button");
      down.className = "danger";
      down.textContent = "降级";
      down.addEventListener("click", demoteRank);
      el.actions.append(down);
    } else if (promo) {
      const up = document.createElement("button");
      up.className = "primary";
      up.textContent = "晋升";
      up.addEventListener("click", promote);
      el.actions.append(up);
    }
    if (!dayDone) {
      const keep = document.createElement("button");
      if (!demote && !promo) keep.className = "primary";
      keep.textContent = "继续";
      keep.addEventListener("click", continueWork);
      el.actions.append(keep);
    } else if (!demote && !promo) {
      const next = document.createElement("button");
      next.className = "primary";
      next.textContent = "下一班";
      next.addEventListener("click", () => beginRound("// 写满，下一班", "dim"));
      el.actions.append(next);
    }
    const bye = document.createElement("button");
    bye.textContent = "下班";
    bye.addEventListener("click", () => openSheet(true));
    el.actions.append(bye);
  } else {
    const again = document.createElement("button");
    again.className = "primary";
    again.textContent = "再来一局";
    again.addEventListener("click", resetRun);
    el.actions.append(again);
  }
  el.sheet.classList.remove("hidden");
  syncVideo();
  renderHud();
}

function beginRound(note, kind) {
  state.holding = false;
  state.paused = false;
  state.lines = 0;
  state.goodLines = 0;
  state.bugs = 0;
  state.written = 0;
  state.quota = rollQuota();
  state.dayDone = false;
  state.log = [];
  state.focusUntil = 0;
  state.lastBugShown = 0;
  state.lastGoodShown = 0;
  state.linesUntilError = rollErrorGap();
  state.openBugs = [];
  el.sheet.classList.add("hidden");
  if (el.scene) el.scene.currentTime = 0;
  renderLog();
  if (note) pushLog(note, kind || "dim");
  syncVideo();
  renderHud();
}

function continueWork() {
  state.paused = false;
  el.sheet.classList.add("hidden");
  syncVideo();
  renderHud();
}

function finishDay() {
  if (!state.started || state.paused || state.dayDone) return;
  state.written = state.quota;
  state.dayDone = true;
  pushLog("// 今日写满，自动下班", "dim");
  openSheet(false);
}

function promote() {
  if (!canPromote() || mustDemote()) return;
  moveRank("up");
  const rail = state.track === "good" ? "正轨" : "屎山轨";
  beginRound(`// 晋升 ${rail}·${rank().name}，新的一局`, "ok");
}

function demoteRank() {
  if (!mustDemote()) return;
  moveRank("down");
  const rail = state.track === "good" ? "正轨" : "屎山轨";
  beginRound(`// 降级 ${rail}·${rank().name}，新的一局`, "err");
}

function resetRun() {
  state.started = false;
  state.holding = false;
  state.paused = false;
  state.rank = 0;
  state.track = "good";
  state.lines = 0;
  state.goodLines = 0;
  state.bugs = 0;
  state.written = 0;
  state.quota = 0;
  state.dayDone = false;
  state.log = [];
  state.focusUntil = 0;
  state.lastBugShown = 0;
  state.lastGoodShown = 0;
  state.linesUntilError = rollErrorGap();
  state.openBugs = [];
  el.sheet.classList.add("hidden");
  el.intro.classList.remove("hidden");
  if (el.scene) el.scene.currentTime = 0;
  renderLog();
  syncVideo();
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
            logFixLine(true);
          }
          renderLog();
        }
      }
      if (state.bugs <= 0 && state.lines >= 1) {
        const prevG = state.goodLines;
        const maxConvert = Math.floor(state.lines);
        state.goodLines += writeSpeed() * dt;
        let gained = Math.floor(state.goodLines) - Math.floor(prevG);
        if (gained > maxConvert) {
          state.goodLines = Math.floor(prevG) + maxConvert;
          gained = maxConvert;
        }
        if (gained > 0) {
          state.lines = Math.max(0, state.lines - gained);
          for (let i = 0; i < gained; i += 1) {
            pushLog(pick(LINES.good), "ok", true);
          }
          renderLog();
        }
      }
    } else {
      const room = state.quota - state.written;
      if (room <= 0) {
        finishDay();
      } else {
        const prevL = state.lines;
        const add = Math.min(writeSpeed() * dt, room);
        state.lines += add;
        state.written += add;
        const newLines = Math.floor(state.lines) - Math.floor(prevL);
        if (newLines > 0) {
          for (let i = 0; i < newLines; i += 1) {
            state.linesUntilError -= 1;
            if (state.linesUntilError <= 0) {
              logErrorLine(true);
              state.linesUntilError = rollErrorGap();
            } else {
              pushLog(pick(LINES.slop), "dim", true);
            }
          }
          renderLog();
        }
        if (state.written >= state.quota) finishDay();
      }
    }
  }

  renderHud();
  requestAnimationFrame(tick);
}

function isClockOutTarget(target) {
  return !!(target && (target === el.clockOut || el.clockOut.contains(target)));
}

function isSettingsTarget(target) {
  return !!(target && el.settings && (target === el.settings || el.settings.contains(target)));
}

function onDown(ev) {
  if (isClockOutTarget(ev.target)) return;
  if (isSettingsTarget(ev.target)) return;
  if (el.sheet.contains(ev.target)) return;
  if (!state.started) return;
  if (ev.pointerType === "mouse" && ev.button !== 0) return;
  ev.preventDefault();
  poke();
}

el.app.addEventListener("pointerdown", onDown);

if (el.introStart) {
  el.introStart.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  });
  el.introStart.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    startGame();
  });
}

if (el.settings) {
  el.settings.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  });
  el.settings.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  });
}

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
  if (!state.started) return;
  ev.preventDefault();
  poke();
});

window.addEventListener("resize", () => {
  trimLog();
  renderLog();
});

renderHud();
state.last = performance.now();
if (el.scene) {
  const video = el.scene;
  video.playsInline = true;
  video.loop = true;
  video.muted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.addEventListener("loadedmetadata", fitScene);
  video.addEventListener("canplay", () => {
    fitScene();
    if (!state.paused) syncVideo();
  });
  video.addEventListener("ended", () => {
    if (state.paused) return;
    video.currentTime = 0;
    syncVideo();
  });
  syncVideo();
}
requestAnimationFrame(tick);
