export const FIRE_BUGS = 72;
export const WARN_BUGS = 40;
export const EQUIP_SLOTS = 2;
export const TAP_FOCUS_BASE = 0.6;
export const SAVE_KEY = "shitmountain-meta-v1";

export const RANKS = [
  { id: 0, name: "初级", linesPerSec: 8, bugsPerSec: 1.8, fixPerSec: 2.8, goodEatMul: 1, pay: 12, clearBonus: 40, promoBonus: 40 },
  { id: 1, name: "中级", linesPerSec: 13, bugsPerSec: 1.25, fixPerSec: 4.2, goodEatMul: 0.8, pay: 22, clearBonus: 55, promoBonus: 70 },
  { id: 2, name: "资深", linesPerSec: 19, bugsPerSec: 0.85, fixPerSec: 5.8, goodEatMul: 0.62, pay: 36, clearBonus: 75, promoBonus: 110 },
  { id: 3, name: "专家", linesPerSec: 26, bugsPerSec: 0.5, fixPerSec: 8, goodEatMul: 0.45, pay: 54, clearBonus: 100, promoBonus: 160 },
  { id: 4, name: "架构", linesPerSec: 34, bugsPerSec: 0.28, fixPerSec: 11, goodEatMul: 0.3, pay: 80, clearBonus: 140, promoBonus: 0 },
];

export const ITEMS = [
  { id: "coffee", name: "美式", desc: "少造一点 bug", price: 50, bugsMul: 0.88 },
  { id: "duck", name: "橡皮鸭", desc: "焦点窗更长，点一下多撑一会", price: 80, tapExtra: 0.25 },
  { id: "lint", name: "ESLint", desc: "少造 bug，闲时也催着改", price: 120, bugsMul: 0.72, autoFix: 0.18 },
  { id: "tests", name: "单测", desc: "bug 更少，改得更快", price: 170, bugsMul: 0.6, fixMul: 1.25 },
  { id: "pair", name: "结对", desc: "改 bug 更快，焦点稍长", price: 230, fixMul: 1.4, tapExtra: 0.12 },
  { id: "ci", name: "CI", desc: "大幅少造 bug，闲时催修", price: 300, bugsMul: 0.5, autoFix: 0.4 },
];

export const SKINS = [
  { id: "default", name: "灰蓝卫衣", price: 0, hoodie: null, hair: null, acc: null },
  { id: "navy", name: "深蓝帽衫", price: 70, hoodie: [38, 58, 92], hair: null, acc: null },
  { id: "moss", name: "苔绿卫衣", price: 110, hoodie: [46, 82, 64], hair: null, acc: null },
  { id: "shades", name: "墨镜", price: 150, hoodie: [42, 42, 48], hair: null, acc: "shades" },
  { id: "gold", name: "金丝眼镜", price: 190, hoodie: [58, 62, 78], hair: null, acc: "gold-glasses" },
  { id: "tie", name: "红领带", price: 240, hoodie: [36, 40, 52], hair: null, acc: "tie" },
  { id: "cyber", name: "赛博发", price: 320, hoodie: [24, 28, 40], hair: [168, 212, 232], acc: null },
  { id: "pj", name: "睡衣", price: 0, require: "first_fire", hoodie: [90, 58, 112], hair: null, acc: null },
];

export const ACHIEVEMENTS = [
  { id: "first_clear", name: "零缺陷", desc: "0 bug 收工一次", branch: "clean", test: (_s, m) => m.stats.clears >= 1 },
  { id: "first_promo", name: "转正", desc: "第一次无 bug 晋升", branch: "clean", test: (_s, m) => m.stats.promotes >= 1 },
  { id: "architect", name: "清流架构", desc: "晋升到架构", branch: "clean", test: (s) => s.maxRankThisRun >= 4 || s.rank >= 4 },
  { id: "sterile", name: "无菌室", desc: "从未让 bug 大于 0 并完成一次晋升", branch: "clean", test: (s, m) => s.neverBugged && m.stats.promotes >= 1 && s.rank >= 1 },
  { id: "rich", name: "有存款", desc: "财富达到 500", branch: "clean", test: (_s, m) => m.money >= 500 },
  { id: "loaded", name: "年终奖", desc: "财富达到 2000", branch: "clean", test: (_s, m) => m.money >= 2000 },
  { id: "closet", name: "更衣柜", desc: "解锁全部皮肤", branch: "clean", test: (_s, m) => SKINS.every((skin) => m.ownedSkins.includes(skin.id)) },
  { id: "toolbox", name: "工具人", desc: "买齐全部道具", branch: "clean", test: (_s, m) => ITEMS.every((item) => m.ownedItems.includes(item.id)) },
  { id: "good_100", name: "能跑能测", desc: "单局正确行达到 100", branch: "clean", test: (s) => Math.floor(s.goodLines) >= 100 },
  { id: "good_400", name: "重构完成", desc: "单局正确行达到 400", branch: "clean", test: (s) => Math.floor(s.goodLines) >= 400 },
  { id: "first_fire", name: "优化掉", desc: "被赶出职场一次", branch: "chaos", test: (_s, m) => m.stats.fires >= 1 },
  { id: "slop_300", name: "屎山诗人", desc: "单局屎山达到 300 行", branch: "chaos", test: (s) => Math.floor(s.lines) >= 300 },
  { id: "slop_800", name: "活化石", desc: "单局屎山达到 800 行", branch: "chaos", test: (s) => Math.floor(s.lines) >= 800 },
  { id: "denied_3", name: "带病上岗", desc: "因 bug 无法晋升 3 次", branch: "chaos", test: (_s, m) => m.stats.denied >= 3 },
  { id: "denied_8", name: "绩效面谈", desc: "因 bug 无法晋升 8 次", branch: "chaos", test: (_s, m) => m.stats.denied >= 8 },
  { id: "good_eaten", name: "回滚人生", desc: "有过正确行后又被 bug 吃光", branch: "chaos", test: (s) => s.hadGood && Math.floor(s.goodLines) <= 0 && Math.floor(s.bugs) > 0 },
  { id: "junior_fire", name: "试用期结束", desc: "初级就被开除", branch: "chaos", test: (s, m) => m.stats.fires >= 1 && s.maxRankThisRun <= 0 && s.fired },
  { id: "peak_warn", name: "高危作业", desc: "Bug 一度超过警告线却还没被开", branch: "chaos", test: (s) => s.peakBugs >= WARN_BUGS && !s.fired },
];

export function emptyMeta() {
  return {
    money: 0,
    ownedSkins: ["default"],
    skin: "default",
    ownedItems: [],
    equipped: [],
    achievements: [],
    stats: {
      promotes: 0,
      fires: 0,
      denied: 0,
      clears: 0,
      bestGood: 0,
      bestSlop: 0,
      bestPay: 0,
    },
  };
}

export function emptyRun() {
  return {
    started: false,
    holding: false,
    paused: false,
    fired: false,
    settled: false,
    rank: 0,
    lines: 0,
    goodLines: 0,
    bugs: 0,
    eatAcc: 0,
    neverBugged: true,
    peakBugs: 0,
    hadGood: false,
    maxRankThisRun: 0,
    sheetCounted: false,
  };
}

export function normalizeMeta(raw) {
  const meta = emptyMeta();
  if (!raw || typeof raw !== "object") return meta;
  if (Number.isFinite(raw.money)) meta.money = Math.max(0, Math.floor(raw.money));
  if (Array.isArray(raw.ownedSkins)) {
    meta.ownedSkins = [...new Set(["default", ...raw.ownedSkins.filter((id) => SKINS.some((s) => s.id === id))])];
  }
  if (SKINS.some((s) => s.id === raw.skin) && meta.ownedSkins.includes(raw.skin)) meta.skin = raw.skin;
  if (Array.isArray(raw.ownedItems)) {
    meta.ownedItems = [...new Set(raw.ownedItems.filter((id) => ITEMS.some((i) => i.id === id)))];
  }
  if (Array.isArray(raw.equipped)) {
    meta.equipped = raw.equipped.filter((id) => meta.ownedItems.includes(id)).slice(0, EQUIP_SLOTS);
  }
  if (Array.isArray(raw.achievements)) {
    meta.achievements = [...new Set(raw.achievements.filter((id) => ACHIEVEMENTS.some((a) => a.id === id)))];
  }
  if (raw.stats && typeof raw.stats === "object") {
    for (const key of Object.keys(meta.stats)) {
      if (Number.isFinite(raw.stats[key])) meta.stats[key] = Math.max(0, Math.floor(raw.stats[key]));
    }
  }
  return meta;
}

export function faceIndex(rankId) {
  if (rankId <= 0) return 0;
  if (rankId <= 2) return 1;
  return 2;
}

export function bugsOf(state) {
  return Math.floor(state.bugs);
}

export function canPromote(state) {
  return !state.fired && bugsOf(state) === 0 && state.rank < RANKS.length - 1;
}

export function shouldFire(state) {
  return bugsOf(state) >= FIRE_BUGS;
}

export function nextRankName(rankId) {
  return RANKS[rankId + 1] ? RANKS[rankId + 1].name : "满级";
}

export function findItem(id) {
  return ITEMS.find((item) => item.id === id) || null;
}

export function findSkin(id) {
  return SKINS.find((skin) => skin.id === id) || SKINS[0];
}

export function skinUnlocked(meta, skin) {
  if (skin.require && !meta.achievements.includes(skin.require)) return false;
  return true;
}

export function equippedItems(meta) {
  return (meta.equipped || []).map(findItem).filter(Boolean);
}

export function modifiers(meta) {
  const mods = {
    linesMul: 1,
    bugsMul: 1,
    fixMul: 1,
    tapFocus: TAP_FOCUS_BASE,
    autoFix: 0,
    goodEatMul: 1,
  };
  for (const item of equippedItems(meta)) {
    mods.linesMul *= item.linesMul ?? 1;
    mods.bugsMul *= item.bugsMul ?? 1;
    mods.fixMul *= item.fixMul ?? 1;
    mods.tapFocus += item.tapExtra ?? 0;
    mods.autoFix += item.autoFix ?? 0;
    mods.goodEatMul *= item.goodEatMul ?? 1;
  }
  return mods;
}

export function statsFor(rankId, meta) {
  const rank = RANKS[rankId] || RANKS[0];
  const mods = modifiers(meta);
  return {
    name: rank.name,
    linesPerSec: rank.linesPerSec * mods.linesMul,
    bugsPerSec: rank.bugsPerSec * mods.bugsMul,
    fixPerSec: rank.fixPerSec * mods.fixMul,
    tapFocus: mods.tapFocus,
    autoFix: mods.autoFix,
    goodEatMul: rank.goodEatMul * mods.goodEatMul,
    pay: rank.pay,
    clearBonus: rank.clearBonus,
    promoBonus: rank.promoBonus,
  };
}

export function runPay(state) {
  const rank = RANKS[state.rank] || RANKS[0];
  const bugs = bugsOf(state);
  const good = Math.floor(state.goodLines);
  const lines = Math.floor(state.lines);
  let pay = rank.pay + good * 2 + Math.floor(lines * 0.15);
  if (bugs === 0 && (good > 0 || lines > 0 || state.rank > 0)) pay += rank.clearBonus;
  pay -= bugs * 3;
  pay = Math.max(0, Math.floor(pay));
  if (state.fired) pay = Math.floor(pay * 0.25);
  return pay;
}

export function clockOutReport(state) {
  const bugs = bugsOf(state);
  const fired = state.fired || shouldFire(state);
  return {
    fired,
    canPromote: canPromote(state),
    pay: runPay({ ...state, fired }),
    branch: fired ? "fired" : bugs === 0 ? "clean" : "chaos",
    bugs,
  };
}

export function grantPay(meta, state) {
  const pay = runPay(state);
  meta.money += pay;
  meta.stats.bestPay = Math.max(meta.stats.bestPay, pay);
  return pay;
}

export function buyItem(meta, id) {
  const item = findItem(id);
  if (!item) return { ok: false, reason: "missing" };
  if (meta.ownedItems.includes(id)) return { ok: false, reason: "owned" };
  if (meta.money < item.price) return { ok: false, reason: "poor" };
  meta.money -= item.price;
  meta.ownedItems.push(id);
  return { ok: true };
}

export function toggleEquip(meta, id) {
  if (!meta.ownedItems.includes(id)) return { ok: false, reason: "unowned" };
  const at = meta.equipped.indexOf(id);
  if (at >= 0) {
    meta.equipped.splice(at, 1);
    return { ok: true, equipped: false };
  }
  if (meta.equipped.length >= EQUIP_SLOTS) return { ok: false, reason: "slots" };
  meta.equipped.push(id);
  return { ok: true, equipped: true };
}

export function buyOrWearSkin(meta, id) {
  const skin = findSkin(id);
  if (!skin || skin.id !== id) return { ok: false, reason: "missing" };
  if (!skinUnlocked(meta, skin)) return { ok: false, reason: "locked" };
  if (meta.ownedSkins.includes(id)) {
    meta.skin = id;
    return { ok: true, worn: true, bought: false };
  }
  if (skin.price > 0 && meta.money < skin.price) return { ok: false, reason: "poor" };
  if (skin.price > 0) meta.money -= skin.price;
  if (!meta.ownedSkins.includes(id)) meta.ownedSkins.push(id);
  meta.skin = id;
  return { ok: true, worn: true, bought: skin.price > 0 };
}

export function collectAchievements(state, meta) {
  meta.stats.bestGood = Math.max(meta.stats.bestGood, Math.floor(state.goodLines));
  meta.stats.bestSlop = Math.max(meta.stats.bestSlop, Math.floor(state.lines));
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (meta.achievements.includes(achievement.id)) continue;
    if (achievement.test(state, meta)) {
      meta.achievements.push(achievement.id);
      unlocked.push(achievement);
    }
  }
  return unlocked;
}

export function markClockOut(state, meta) {
  const report = clockOutReport(state);
  if (report.fired) {
    state.fired = true;
    meta.stats.fires += 1;
  } else if (report.bugs === 0) {
    meta.stats.clears += 1;
  } else {
    meta.stats.denied += 1;
  }
  return report;
}

export function applyPromotion(state, meta) {
  if (!canPromote(state)) return { ok: false, reason: bugsOf(state) === 0 ? "max" : "bugs" };
  const bonus = RANKS[state.rank].promoBonus;
  state.rank += 1;
  state.maxRankThisRun = Math.max(state.maxRankThisRun, state.rank);
  meta.stats.promotes += 1;
  meta.money += bonus;
  return { ok: true, bonus, name: RANKS[state.rank].name };
}

export function stepWork(state, stats, dt, holding) {
  const events = {
    logs: [],
    goodHurt: 0,
    bugsGained: 0,
    bugsFixed: 0,
    converted: 0,
    slopLines: 0,
    autoFixed: 0,
    fired: false,
  };
  if (!state.started || state.paused || state.fired) return events;

  if (holding) {
    if (state.bugs > 0) {
      const before = state.bugs;
      state.bugs = Math.max(0, state.bugs - stats.fixPerSec * dt);
      events.bugsFixed = Math.floor(before) - Math.floor(state.bugs);
    }
    if (state.bugs <= 0 && state.lines >= 1) {
      const prevGood = state.goodLines;
      const maxConvert = Math.floor(state.lines);
      state.goodLines += stats.linesPerSec * dt;
      let gained = Math.floor(state.goodLines) - Math.floor(prevGood);
      if (gained > maxConvert) {
        state.goodLines = Math.floor(prevGood) + maxConvert;
        gained = maxConvert;
      }
      if (gained > 0) {
        state.lines = Math.max(0, state.lines - gained);
        events.converted = gained;
      }
    }
  } else {
    const prevLines = state.lines;
    const prevBugs = state.bugs;
    state.lines += stats.linesPerSec * dt;
    const bugDelta = stats.bugsPerSec - stats.autoFix;
    state.bugs = Math.max(0, state.bugs + bugDelta * dt);
    if (bugDelta < 0) {
      events.autoFixed = Math.floor(prevBugs) - Math.floor(state.bugs);
    }
    const newBugs = Math.floor(state.bugs) - Math.floor(prevBugs);
    if (newBugs > 0) {
      state.eatAcc += newBugs * stats.goodEatMul;
      const eaten = Math.floor(state.eatAcc);
      if (eaten > 0) {
        state.eatAcc -= eaten;
        const beforeGood = state.goodLines;
        state.goodLines = Math.max(0, state.goodLines - eaten);
        events.goodHurt = Math.floor(beforeGood) - Math.floor(state.goodLines);
      }
      events.bugsGained = newBugs;
    }
    events.slopLines = Math.floor(state.lines) - Math.floor(prevLines);
  }

  if (Math.floor(state.goodLines) > 0) state.hadGood = true;
  if (Math.floor(state.bugs) > 0) state.neverBugged = false;
  state.peakBugs = Math.max(state.peakBugs, Math.floor(state.bugs));
  state.maxRankThisRun = Math.max(state.maxRankThisRun, state.rank);
  if (shouldFire(state)) {
    state.fired = true;
    events.fired = true;
  }
  return events;
}
