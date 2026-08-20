import {
  ACHIEVEMENTS,
  FIRE_BUGS,
  ITEMS,
  MAX_RANK,
  SAVE_KEY,
  WARN_BUGS,
  applyPromotion,
  buyItem,
  collectAchievements,
  emptyMeta,
  emptyRun,
  equippedItems,
  faceIndex,
  grantPay,
  markClockOut,
  nextRankName,
  normalizeMeta,
  runPay,
  statsFor,
  stepWork,
  toggleEquip,
} from "./career.js";
import { loadBugs, pickBug } from "./bugs.js";
import { loadCode, takeNormal, writeSlop } from "./code.js";
import { highlight } from "./highlight.js";

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

let sheetMode = "clock";

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
  head: { x: 16, y: 51 },
  body: { x: 16, y: 60 },
  hands: { x: 20, y: 73 },
  keys: { x: 14, y: 74 },
  crt: { x: 38, y: 68 },
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
  const img = gfx.faces[faceIndex(rankId)] || gfx.faces[0];
  if (!img) return;
  const x = (32 - img.width) >> 1;
  const y = (32 - img.height) >> 1;
  ctx.drawImage(img, x, y);
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
  blit(ctx, gfx.head, SPR.head.x, SPR.head.y);
  blit(ctx, gfx.body, SPR.body.x, SPR.body.y);
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

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pushLog(text, kind) {
  state.log.push({ text, kind });
  if (state.log.length > 40) state.log.shift();
  renderLog();
}

function renderLog() {
  el.cons.innerHTML = state.log
    .map((row, i) => {
      const nr = String(i + 1).padStart(3, " ");
      const cls = row.kind === "bug" || row.kind === "err" ? "bug-line" : row.kind === "ok" ? "ok-line" : "";
      return `<div class="code-line ${cls}"><span class="ln">${nr}</span><span class="src">${highlight(row.text)}</span></div>`;
    })
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
      el.sheetNote.textContent = state.rank < MAX_RANK ? "清流：0 bug，可以晋升" : "清流：已满级";
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
    if (bugs === 0 && state.rank < MAX_RANK) {
      el.actions.append(btn("晋升", "primary", promote));
    }
    el.actions.append(
      btn("继续写", bugs === 0 && state.rank < MAX_RANK ? "" : "primary", resumeWork),
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
  el.shopList.innerHTML = "";
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
    row.innerHTML = `<span>${escapeHtml(item.name)}<small>${escapeHtml(item.desc)}</small></span><strong>${
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
      for (let i = 0; i < events.bugsFixed; i += 1) {
        pushLog(`// fixed  ${pickBug().code}`, "ok");
      }
    }
    if (events.converted > 0) {
      for (let i = 0; i < events.converted; i += 1) {
        pushLog(takeNormal(), "ok");
      }
    }
    if (events.slopLines > 0 || events.bugsGained > 0) {
      for (const row of writeSlop(events.slopLines, events.bugsGained)) {
        pushLog(row.text, row.kind);
      }
    }
    if (events.autoFixed > 0) {
      for (let i = 0; i < events.autoFixed; i += 1) {
        pushLog(`// ci 催修  ${pickBug().code}`, "ok");
      }
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
Promise.all([
  loadGfx().catch((err) => console.error(err)),
  loadBugs().catch((err) => console.error(err)),
  loadCode().catch((err) => console.error(err)),
]).then(() => requestAnimationFrame(tick));
