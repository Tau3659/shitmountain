import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = "f:/游戏元素/屎山素材/弹窗切片";
const outDir = path.join(root, "assets");

const SCALE = 1;
const DISPLAY_SCALE = 2;

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

async function tintPanel(png, hex) {
  const tr = parseInt(hex.slice(1, 3), 16);
  const tg = parseInt(hex.slice(3, 5), 16);
  const tb = parseInt(hex.slice(5, 7), 16);
  const [th, ts] = rgbToHsl(tr, tg, tb);
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [nr, ng, nb] = hslToRgb(th, ts, data[i] / 255);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

const tiles = [
  { name: "左上.png", x: 0, y: 0 },
  { name: "顶中.png", x: 6, y: 0 },
  { name: "右上.png", x: 16, y: 0 },
  { name: "左中.png", x: 0, y: 4 },
  { name: "中.png", x: 6, y: 4 },
  { name: "右中.png", x: 16, y: 4 },
  { name: "左下.png", x: 0, y: 12 },
  { name: "底中.png", x: 6, y: 12 },
  { name: "右下.png", x: 16, y: 12 },
];

const sheetW = 22 * SCALE;
const sheetH = 18 * SCALE;
const slice = {
  top: 4 * SCALE,
  right: 6 * SCALE,
  bottom: 6 * SCALE,
  left: 6 * SCALE,
};
const display = {
  top: slice.top * DISPLAY_SCALE,
  right: slice.right * DISPLAY_SCALE,
  bottom: slice.bottom * DISPLAY_SCALE,
  left: slice.left * DISPLAY_SCALE,
};

await mkdir(outDir, { recursive: true });

const composites = await Promise.all(
  tiles.map(async (tile) => ({
    input: await readFile(path.join(srcDir, tile.name)),
    left: tile.x,
    top: tile.y,
  })),
);

const pngPath = path.join(outDir, "panel-9.png");
const webpPath = path.join(outDir, "panel-9.webp");
const metaPath = path.join(outDir, "panel-9.json");

const png = await sharp({
  create: {
    width: 22,
    height: 18,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png()
  .toBuffer();

await writeFile(pngPath, png);
await sharp(png).webp({ quality: 100, effort: 6, lossless: true }).toFile(webpPath);

const tints = [
  { name: "panel-9-primary", color: "#48d060" },
  { name: "panel-9-danger", color: "#d45a4a" },
];
for (const tint of tints) {
  const buf = await tintPanel(png, tint.color);
  await writeFile(path.join(outDir, `${tint.name}.png`), buf);
  await sharp(buf).webp({ quality: 100, effort: 6, lossless: true }).toFile(path.join(outDir, `${tint.name}.webp`));
}

const meta = {
  scale: SCALE,
  displayScale: DISPLAY_SCALE,
  sheet: { width: sheetW, height: sheetH },
  slice,
  display,
  borderImageSlice: `${slice.top} ${slice.right} ${slice.bottom} ${slice.left} fill`,
  borderImageWidth: `${display.top}px ${display.right}px ${display.bottom}px ${display.left}px`,
  tiles: tiles.map((tile) => tile.name),
};

await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

console.log(`panel sheet ${sheetW}x${sheetH} -> assets/panel-9.png / .webp`);
console.log(`tinted sheets -> assets/panel-9-primary.webp, assets/panel-9-danger.webp`);
console.log(`border-image-slice: ${meta.borderImageSlice}`);
