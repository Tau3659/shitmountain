import { pickBug } from "./bugs.js";

export const CODE_CONFIG_URL = new URL("../config/code.json", import.meta.url).href;

let modules = [];
let modIndex = 0;
let lineIndex = 0;

export function parseCode(data) {
  const rows = Array.isArray(data?.modules) ? data.modules : Array.isArray(data) ? data : [];
  return rows.filter((row) => (
    row
    && typeof row.file === "string"
    && row.file.trim()
    && Array.isArray(row.lines)
    && row.lines.some((line) => String(line).trim())
  )).map((row) => ({
    file: row.file,
    lines: row.lines.map((line) => String(line)),
  }));
}

export function setCode(list) {
  modules = Array.isArray(list) ? list.slice() : [];
  modIndex = 0;
  lineIndex = 0;
  return modules.reduce((n, mod) => n + mod.lines.length, 0);
}

export function peekIndent() {
  if (!modules.length) return 2;
  const mod = modules[modIndex % modules.length];
  const line = mod.lines[lineIndex] ?? mod.lines[mod.lines.length - 1] ?? "";
  const match = String(line).match(/^ */);
  return match ? match[0].length : 0;
}

export function takeNormal() {
  if (!modules.length) return "const ok = true";
  if (modIndex >= modules.length) modIndex = 0;
  const mod = modules[modIndex];
  if (lineIndex >= mod.lines.length) {
    modIndex = (modIndex + 1) % modules.length;
    lineIndex = 0;
    return takeNormal();
  }
  const text = mod.lines[lineIndex];
  lineIndex += 1;
  return text;
}

export function formatBugLine(bug, indent = peekIndent()) {
  const pad = " ".repeat(Math.max(0, indent));
  const code = String(bug?.code || "").trim() || "undefined.doThing()";
  const voice = String(bug?.voice || "").trim();
  return voice ? `${pad}${code}  // ${voice}` : `${pad}${code}`;
}

export function planMix(slopCount, bugCount, rng = Math.random) {
  const extraBugs = Math.max(0, (bugCount | 0) - Math.max(0, slopCount | 0));
  const total = Math.max(0, slopCount | 0);
  if (total === 0) return Array(Math.max(0, bugCount | 0)).fill("bug");
  const bugs = Math.max(0, Math.min(bugCount | 0, total));
  const kinds = Array(total).fill("norm");
  const slots = [...Array(total).keys()];
  for (let i = 0; i < bugs; i += 1) {
    const j = i + Math.floor(rng() * (total - i));
    const tmp = slots[i];
    slots[i] = slots[j];
    slots[j] = tmp;
    kinds[slots[i]] = "bug";
  }
  for (let i = 0; i < extraBugs; i += 1) kinds.push("bug");
  return kinds;
}

export function writeSlop(slopCount, bugCount, rng = Math.random) {
  return planMix(slopCount, bugCount, rng).map((kind) => {
    if (kind === "bug") {
      return { kind: "bug", text: formatBugLine(pickBug(), peekIndent()) };
    }
    return { kind: "code", text: takeNormal() };
  });
}

export async function loadCode(url = CODE_CONFIG_URL) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`code config ${res.status}`);
  const parsed = parseCode(await res.json());
  if (!parsed.length) throw new Error("code config empty");
  setCode(parsed);
  return parsed;
}
