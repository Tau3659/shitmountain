import {
  ACHIEVEMENTS,
  ARCHITECT_RANK,
  EQUIP_SLOTS,
  FIRE_BUGS,
  ITEMS,
  MAX_RANK,
  RANKS,
  WARN_BUGS,
  applyPromotion,
  buyItem,
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
import { bugCount, parseBugs, pickBug, setBugs } from "./bugs.js";
import { readFileSync } from "node:fs";

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

assert(RANKS.length === 24, "24 research ranks");
assert(RANKS[0].name === "实习生" && RANKS[MAX_RANK].name === "CTO", "ladder starts intern ends CTO");
assert(RANKS[ARCHITECT_RANK].name === "架构师", "architect sits on the ladder");
assert(RANKS.every((rank, i) => i === 0 || rank.linesPerSec > RANKS[i - 1].linesPerSec), "higher rank writes faster");
assert(RANKS.every((rank, i) => i === 0 || rank.bugsPerSec < RANKS[i - 1].bugsPerSec), "higher rank has lower bug rate");
assert(RANKS.every((rank, i) => i === 0 || rank.fixPerSec > RANKS[i - 1].fixPerSec), "higher rank fixes faster");
assert(RANKS.every((rank, i) => i === 0 || rank.goodEatMul < RANKS[i - 1].goodEatMul), "higher rank loses less good code");

assert(canPromote(run({ bugs: 0, rank: 0 })), "0 bug can promote");
assert(canPromote(run({ bugs: 0.9, rank: 0 })), "sub-1 bug still counts as 0");
assert(!canPromote(run({ bugs: 1, rank: 0 })), "1 bug cannot promote");
assert(!canPromote(run({ bugs: 0, rank: MAX_RANK })), "max rank cannot promote");
assert(!canPromote(run({ bugs: 0, rank: 0, fired: true })), "fired cannot promote");

const cleanReport = clockOutReport(run({ bugs: 0, goodLines: 10, lines: 0, rank: 0 }));
assert(cleanReport.branch === "clean" && cleanReport.canPromote, "clean clock-out is promote branch");
const chaosReport = clockOutReport(run({ bugs: 12, rank: 0 }));
assert(chaosReport.branch === "chaos" && !chaosReport.canPromote, "bugs block promotion");
const fireReport = clockOutReport(run({ bugs: FIRE_BUGS, rank: 0 }));
assert(fireReport.fired && fireReport.branch === "fired", "hit fire line");

const intern = statsFor(0, emptyMeta());
const cto = statsFor(MAX_RANK, emptyMeta());
assert(cto.linesPerSec > intern.linesPerSec, "CTO outputs faster");
assert(cto.bugsPerSec < intern.bugsPerSec, "CTO bug rate lower");
assert(intern.bugsPerSec > 0.2 && intern.bugsPerSec < 0.5, "intern bugs stay sparse");

const withCi = emptyMeta();
withCi.ownedItems = ["ci", "tests"];
withCi.equipped = ["ci", "tests"];
const boosted = statsFor(0, withCi);
assert(boosted.bugsPerSec < intern.bugsPerSec, "items reduce bug generation");
assert(boosted.fixPerSec > intern.fixPerSec, "items speed up fixes");
assert(boosted.autoFix > 0, "ci nags / auto-fixes");
assert(modifiers(withCi).tapFocus === modifiers(emptyMeta()).tapFocus, "ci/tests do not change tap window");

const duckMeta = emptyMeta();
duckMeta.ownedItems = ["duck"];
duckMeta.equipped = ["duck"];
assert(statsFor(0, duckMeta).tapFocus > intern.tapFocus, "duck lengthens focus window");

const idle = run();
const idleEvents = stepWork(idle, intern, 1, false);
assert(idle.lines > 5 && idle.bugs > 0.2, "idle writes slop and bugs");
assert(idleEvents.slopLines >= 5, "idle logs slop lines");

const fixer = run({ bugs: 5, lines: 20 });
stepWork(fixer, intern, 1, true);
assert(fixer.bugs < 5, "holding fixes bugs");
assert(fixer.goodLines === 0, "does not rewrite until bugs gone");

const rewriter = run({ bugs: 0, lines: 20 });
stepWork(rewriter, intern, 1, true);
assert(rewriter.goodLines >= 5 && rewriter.lines < 20, "holding with 0 bugs converts slop");

const eater = run({ bugs: 0, goodLines: 10, lines: 0 });
stepWork(eater, { ...intern, goodEatMul: 1, bugsPerSec: 1.2, autoFix: 0 }, 1, false);
assert(eater.goodLines < 10, "new bugs eat good lines");

const padded = run({ bugs: 0, goodLines: 10 });
stepWork(padded, { ...intern, goodEatMul: 0.3, bugsPerSec: 1.8, autoFix: 0 }, 1, false);
assert(padded.goodLines > eater.goodLines, "higher quality eats fewer good lines");

const nag = run({ bugs: 10 });
const nagStats = { ...intern, bugsPerSec: 0.2, autoFix: 1 };
stepWork(nag, nagStats, 1, false);
assert(nag.bugs < 10, "idle auto-fix reduces existing bugs");

const doomed = run({ bugs: FIRE_BUGS - 0.2 });
const boom = stepWork(doomed, { ...intern, bugsPerSec: 1, autoFix: 0 }, 1, false);
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

const promoMeta = emptyMeta();
const promoState = run({ bugs: 0, rank: 0 });
const promo = applyPromotion(promoState, promoMeta);
assert(promo.ok && promoState.rank === 1 && promoMeta.money === RANKS[0].promoBonus, "promotion pays bonus and requires 0 bug");
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
assert(unlocked.some((a) => a.id === "junior_fire"), "unlock intern fire");

const warnState = run({ peakBugs: WARN_BUGS, fired: false, bugs: WARN_BUGS });
const warnMeta = emptyMeta();
const warnUnlock = collectAchievements(warnState, warnMeta);
assert(warnUnlock.some((a) => a.id === "peak_warn"), "high-bug survival achievement");

const restored = normalizeMeta({ money: 12.9, ownedSkins: ["navy"], skin: "navy", equipped: ["ci"], ownedItems: ["ci"], achievements: ["first_clear", "zzz"] });
assert(restored.money === 12 && !("skin" in restored), "old skin save is ignored");
assert(restored.equipped.includes("ci") && restored.achievements.includes("first_clear") && !restored.achievements.includes("zzz"), "normalize items/achievements");

assert(ACHIEVEMENTS.some((a) => a.branch === "clean") && ACHIEVEMENTS.some((a) => a.branch === "chaos"), "both branches have achievements");
assert(ITEMS.length === 6, "item shop stays small");
assert(bugCount() === 100, "bugs bundled at import");
const BUGS = parseBugs(JSON.parse(readFileSync(new URL("../config/bugs.json", import.meta.url), "utf8")));
assert(setBugs(BUGS) === 100 && bugCount() === 100, "runtime loads 100 bugs from config");
assert(BUGS.every((bug) => bug.code && bug.voice), "each bug has code and voice");
assert(new Set(BUGS.map((bug) => bug.code)).size === 100, "bug codes are unique");
const seen = new Set();
for (let i = 0; i < 240; i += 1) seen.add(pickBug().code);
assert(seen.size > 1, "runtime pick is random");
assert(parseBugs({ bugs: [{ code: "x", voice: "y" }, { code: "", voice: "no" }] }).length === 1, "invalid config rows dropped");

const loadout = emptyMeta();
loadout.ownedItems = ["ci", "tests"];
loadout.equipped = ["ci", "tests"];
const naked = run({ bugs: 10 });
const geared = run({ bugs: 10 });
stepWork(naked, statsFor(0, emptyMeta()), 5, false);
stepWork(geared, statsFor(0, loadout), 5, false);
assert(geared.bugs < naked.bugs && !geared.fired, "items cut idle bug growth");
const healer = run({ bugs: 8, rank: MAX_RANK });
stepWork(healer, statsFor(MAX_RANK, loadout), 5, false);
assert(healer.bugs < 8, "CTO + CI can nag existing bugs down");

const internIdle = run();
stepWork(internIdle, statsFor(0, emptyMeta()), 210, false);
assert(internIdle.fired, "unattended intern is fired after a long AFK");

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
