import {
  ACHIEVEMENTS,
  EQUIP_SLOTS,
  FIRE_BUGS,
  ITEMS,
  RANKS,
  SKINS,
  WARN_BUGS,
  applyPromotion,
  buyItem,
  buyOrWearSkin,
  canPromote,
  clockOutReport,
  collectAchievements,
  emptyMeta,
  emptyRun,
  markClockOut,
  modifiers,
  normalizeMeta,
  runPay,
  statsFor,
  stepWork,
  toggleEquip,
} from "./career.js";

let failed = 0;
let passed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    return;
  }
  failed += 1;
  console.error("FAIL", msg);
}

function run(partial = {}) {
  return { ...emptyRun(), started: true, ...partial };
}

assert(RANKS.every((rank, i) => i === 0 || rank.linesPerSec > RANKS[i - 1].linesPerSec), "higher rank writes faster");
assert(RANKS.every((rank, i) => i === 0 || rank.bugsPerSec < RANKS[i - 1].bugsPerSec), "higher rank has lower bug rate");
assert(RANKS.every((rank, i) => i === 0 || rank.fixPerSec > RANKS[i - 1].fixPerSec), "higher rank fixes faster");
assert(RANKS.every((rank, i) => i === 0 || rank.goodEatMul < RANKS[i - 1].goodEatMul), "higher rank loses less good code");

assert(canPromote(run({ bugs: 0, rank: 0 })), "0 bug can promote");
assert(canPromote(run({ bugs: 0.9, rank: 0 })), "sub-1 bug still counts as 0");
assert(!canPromote(run({ bugs: 1, rank: 0 })), "1 bug cannot promote");
assert(!canPromote(run({ bugs: 0, rank: RANKS.length - 1 })), "max rank cannot promote");
assert(!canPromote(run({ bugs: 0, rank: 0, fired: true })), "fired cannot promote");

const cleanReport = clockOutReport(run({ bugs: 0, goodLines: 10, lines: 0, rank: 0 }));
assert(cleanReport.branch === "clean" && cleanReport.canPromote, "clean clock-out is promote branch");
const chaosReport = clockOutReport(run({ bugs: 12, rank: 0 }));
assert(chaosReport.branch === "chaos" && !chaosReport.canPromote, "bugs block promotion");
const fireReport = clockOutReport(run({ bugs: FIRE_BUGS, rank: 0 }));
assert(fireReport.fired && fireReport.branch === "fired", "hit fire line");

const junior = statsFor(0, emptyMeta());
const architect = statsFor(4, emptyMeta());
assert(architect.linesPerSec > junior.linesPerSec, "architect outputs faster");
assert(architect.bugsPerSec < junior.bugsPerSec, "architect bug rate lower");

const withCi = emptyMeta();
withCi.ownedItems = ["ci", "tests"];
withCi.equipped = ["ci", "tests"];
const boosted = statsFor(0, withCi);
assert(boosted.bugsPerSec < junior.bugsPerSec, "items reduce bug generation");
assert(boosted.fixPerSec > junior.fixPerSec, "items speed up fixes");
assert(boosted.autoFix > 0, "ci nags / auto-fixes");
assert(modifiers(withCi).tapFocus === modifiers(emptyMeta()).tapFocus, "ci/tests do not change tap window");

const duckMeta = emptyMeta();
duckMeta.ownedItems = ["duck"];
duckMeta.equipped = ["duck"];
assert(statsFor(0, duckMeta).tapFocus > junior.tapFocus, "duck lengthens focus window");

const idle = run();
const idleEvents = stepWork(idle, junior, 1, false);
assert(idle.lines > 7 && idle.bugs > 1, "idle writes slop and bugs");
assert(idleEvents.slopLines >= 7, "idle logs slop lines");

const fixer = run({ bugs: 5, lines: 20 });
stepWork(fixer, junior, 1, true);
assert(fixer.bugs < 5, "holding fixes bugs");
assert(fixer.goodLines === 0, "does not rewrite until bugs gone");

const rewriter = run({ bugs: 0, lines: 20 });
stepWork(rewriter, junior, 1, true);
assert(rewriter.goodLines >= 7 && rewriter.lines < 20, "holding with 0 bugs converts slop");

const eater = run({ bugs: 0, goodLines: 10, lines: 0 });
stepWork(eater, { ...junior, goodEatMul: 1 }, 1, false);
assert(eater.goodLines < 10, "new bugs eat good lines");

const padded = run({ bugs: 0, goodLines: 10 });
stepWork(padded, { ...junior, goodEatMul: 0.3, bugsPerSec: 1.8, autoFix: 0 }, 1, false);
assert(padded.goodLines > eater.goodLines, "higher quality eats fewer good lines");

const nag = run({ bugs: 10 });
const nagStats = { ...junior, bugsPerSec: 0.2, autoFix: 1 };
stepWork(nag, nagStats, 1, false);
assert(nag.bugs < 10, "idle auto-fix reduces existing bugs");

const doomed = run({ bugs: FIRE_BUGS - 0.2 });
const boom = stepWork(doomed, { ...junior, bugsPerSec: 1, autoFix: 0 }, 1, false);
assert(boom.fired && doomed.fired, "crossing fire line fires you");

const payClean = runPay(run({ rank: 0, bugs: 0, goodLines: 20, lines: 10 }));
const payBugs = runPay(run({ rank: 0, bugs: 20, goodLines: 20, lines: 10 }));
assert(payClean > payBugs, "0 bug pays more than buggy run");
const payFat = runPay(run({ rank: 0, bugs: 4, goodLines: 40, lines: 10 }));
const payFire = runPay(run({ rank: 0, bugs: 4, goodLines: 40, lines: 10, fired: true }));
assert(payFire < payFat && payFire >= 0, "fired severance is smaller");

const meta = emptyMeta();
meta.money = 400;
assert(buyItem(meta, "coffee").ok && meta.ownedItems.includes("coffee") && meta.money === 350, "buy coffee");
assert(!buyItem(meta, "coffee").ok, "cannot buy twice");
assert(toggleEquip(meta, "coffee").equipped, "equip coffee");
assert(toggleEquip(meta, "lint").reason === "unowned", "cannot equip unowned");
buyItem(meta, "duck");
buyItem(meta, "lint");
assert(toggleEquip(meta, "duck").ok && toggleEquip(meta, "lint").reason === "slots", "equip capped at 2");
assert(meta.equipped.length === EQUIP_SLOTS, "two slots filled");

const poor = emptyMeta();
assert(buyOrWearSkin(poor, "navy").reason === "poor", "cannot afford navy");
poor.money = 70;
assert(buyOrWearSkin(poor, "navy").bought && poor.skin === "navy", "buy and wear navy");
assert(buyOrWearSkin(poor, "pj").reason === "locked", "pajama locked behind firing");
poor.achievements.push("first_fire");
assert(buyOrWearSkin(poor, "pj").ok && poor.ownedSkins.includes("pj"), "pajama unlocks after firing");

const promoMeta = emptyMeta();
const promoState = run({ bugs: 0, rank: 0 });
const promo = applyPromotion(promoState, promoMeta);
assert(promo.ok && promoState.rank === 1 && promoMeta.money === 40, "promotion pays bonus and requires 0 bug");
assert(!applyPromotion(run({ bugs: 2, rank: 0 }), emptyMeta()).ok, "promotion rejected when buggy");

const clockMeta = emptyMeta();
const denied = markClockOut(run({ bugs: 4 }), clockMeta);
assert(denied.branch === "chaos" && clockMeta.stats.denied === 1, "buggy clock-out counts as denied promo");
const cleared = markClockOut(run({ bugs: 0, goodLines: 3 }), emptyMeta());
assert(cleared.branch === "clean", "zero bug clock-out is clean");

const fireMeta = emptyMeta();
const firedState = run({ bugs: FIRE_BUGS, rank: 0, maxRankThisRun: 0 });
markClockOut(firedState, fireMeta);
const unlocked = collectAchievements(firedState, fireMeta);
assert(fireMeta.stats.fires === 1, "fire counted");
assert(unlocked.some((a) => a.id === "first_fire"), "unlock fired achievement");
assert(unlocked.some((a) => a.id === "junior_fire"), "unlock junior fire");

const warnState = run({ peakBugs: WARN_BUGS, fired: false, bugs: WARN_BUGS });
const warnMeta = emptyMeta();
const warnUnlock = collectAchievements(warnState, warnMeta);
assert(warnUnlock.some((a) => a.id === "peak_warn"), "high-bug survival achievement");

const restored = normalizeMeta({ money: 12.9, ownedSkins: ["navy", "nope"], skin: "navy", equipped: ["ci"], ownedItems: ["ci"], achievements: ["first_clear", "zzz"] });
assert(restored.money === 12 && restored.ownedSkins.includes("default") && restored.ownedSkins.includes("navy"), "normalize skins");
assert(restored.equipped.includes("ci") && restored.achievements.includes("first_clear") && !restored.achievements.includes("zzz"), "normalize items/achievements");

assert(ACHIEVEMENTS.some((a) => a.branch === "clean") && ACHIEVEMENTS.some((a) => a.branch === "chaos"), "both branches have achievements");
assert(SKINS.length >= 8 && ITEMS.length === 6, "enough unlockables");

const loadout = emptyMeta();
loadout.ownedItems = ["ci", "tests"];
loadout.equipped = ["ci", "tests"];
const naked = run({ bugs: 10 });
const geared = run({ bugs: 10 });
stepWork(naked, statsFor(0, emptyMeta()), 5, false);
stepWork(geared, statsFor(0, loadout), 5, false);
assert(geared.bugs < naked.bugs && !geared.fired, "items cut idle bug growth");
const healer = run({ bugs: 8, rank: 4 });
stepWork(healer, statsFor(4, loadout), 5, false);
assert(healer.bugs < 8, "architect + CI can nag existing bugs down");

const juniorIdle = run();
stepWork(juniorIdle, statsFor(0, emptyMeta()), 41, false);
assert(juniorIdle.fired, "unattended junior is fired around 40s");

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
