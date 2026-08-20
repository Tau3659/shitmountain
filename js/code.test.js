import { readFileSync } from "node:fs";
import { highlight } from "./highlight.js";
import { formatBugLine, parseCode, peekIndent, planMix, setCode, takeNormal, writeSlop } from "./code.js";
import { setBugs } from "./bugs.js";

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

const mixed = planMix(8, 2, () => 0);
assert(mixed.length === 8, "mix keeps slop length");
assert(mixed.filter((k) => k === "bug").length === 2, "mix plants requested bugs");
assert(mixed.filter((k) => k === "norm").length === 6, "rest are normal");
assert(planMix(0, 3).every((k) => k === "bug") && planMix(0, 3).length === 3, "bug-only tick");
assert(planMix(2, 5).filter((k) => k === "bug").length === 5, "extra bugs append");

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
