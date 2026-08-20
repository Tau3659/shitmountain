export const BUGS_CONFIG_URL = new URL("../config/bugs.json", import.meta.url).href;

const FALLBACK = {
  code: "// TODO: 配置没读到",
  voice: "文案丢了也要先写上。",
};

let pool = [];

export function parseBugs(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.bugs) ? data.bugs : [];
  return rows.filter((row) => (
    row
    && typeof row.code === "string"
    && row.code.trim()
    && typeof row.voice === "string"
    && row.voice.trim()
  ));
}

export function setBugs(list) {
  pool = Array.isArray(list) ? list.slice() : [];
  return pool.length;
}

export function bugCount() {
  return pool.length;
}

export function pickBug() {
  if (!pool.length) return FALLBACK;
  return pool[(Math.random() * pool.length) | 0];
}

export async function loadBugs(url = BUGS_CONFIG_URL) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`bugs config ${res.status}`);
  const parsed = parseBugs(await res.json());
  if (!parsed.length) throw new Error("bugs config empty");
  pool = parsed;
  return pool;
}
