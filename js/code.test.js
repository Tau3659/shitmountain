import { readFileSync } from "node:fs";
import { highlight } from "./highlight.js";
import { formatBugLine, loadCode, parseCode, peekIndent, planMix, setCode, takeNormal, writeSlop } from "./code.js";
import { bugCount, loadBugs, setBugs } from "./bugs.js";
import { ATLAS_SRC, SPRITES } from "./atlas.js";

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

assert(SPRITES.head.w === 24 && SPRITES.body.w === 28 && SPRITES["face-2"].x === 192, "atlas sprite rects");
assert(String(ATLAS_SRC).includes("atlas.png"), "atlas url points at packed sheet");
assert(bugCount() === 100, "bugs bundled at import");
assert((await loadBugs()).length === 100, "loadBugs uses bundled config");
assert((await loadCode()).length >= 4, "loadCode uses bundled config");

const html = highlight("const total = items.reduce((s, n) => s + n, 0)");
assert(html.includes('class="kw"') && html.includes("const"), "keyword colored");
assert(highlight("'hello'").includes('class="str"'), "string colored");
assert(highlight("  // note").includes('class="com"'), "comment colored");
assert(highlight("return 42").includes('class="num"'), "number colored");
assert(highlight("loadOrder(id)").includes('class="fn"'), "call colored as function");
assert(!highlight("const x = 1").includes("<script"), "escaped");
assert(highlight("a < b").includes("&lt;"), "lt escaped");

const raw = JSON.parse(readFileSync(new URL("../config/code.json", import.meta.url), "utf8"));
const modules = parseCode(raw);
assert(modules.length >= 4, "code config has modules");
assert(modules.every((mod) => mod.file.startsWith("src/") && mod.lines[0].startsWith("// ")), "modules look like source files");
const lineCount = setCode(modules);
assert(lineCount > 80, "enough normal lines to stream");

const first = takeNormal();
assert(first === "// src/order.js", "stream starts at first file header");
assert(takeNormal() === "import { db } from './db.js'", "then real import");

setCode([{ file: "src/x.js", lines: ["export function run() {", "  return 1", "}"] }]);
assert(peekIndent() === 0, "indent at function line is 0");
takeNormal();
assert(peekIndent() === 2, "indent inside function is 2");

const mixed = planMix(12, 2, () => 0);
assert(mixed.length === 12, "mix keeps slop length");
assert(mixed.filter((k) => k === "bug").length === 2, "mix plants requested bugs");
assert(mixed.filter((k) => k === "norm").length === 10, "rest are normal");
assert(planMix(0, 0).length === 0, "no lines when nothing was written");
assert(planMix(0, 3).length === 1 && planMix(0, 3)[0] === "bug", "at most one orphan bug line");
assert(planMix(2, 5).filter((k) => k === "bug").length === 1, "at most one bug per short batch");
assert(planMix(12, 8).filter((k) => k === "bug").length === 2, "bug lines capped vs normal code");

setBugs([{ code: "eval(userInput)", voice: "没事的" }]);
setCode([{ file: "src/x.js", lines: ["  const id = 1"] }]);
const slop = writeSlop(3, 1, () => 0);
assert(slop.length === 3, "writeSlop emits slop rows");
assert(slop.filter((row) => row.kind === "bug").length === 1, "one injected bug");
assert(slop.some((row) => row.kind === "code" && row.text.includes("const id")), "normal structure kept");
const bugRow = slop.find((row) => row.kind === "bug");
assert(bugRow.text.includes("eval(userInput)") && bugRow.text.includes("没事的"), "bug carries code and voice");
assert(formatBugLine({ code: "x()", voice: "y" }, 2) === "  x()  // y", "bug indented into block");

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
