import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = "f:/游戏元素/屎山素材/弹窗切片";
const outDir = path.join(root, "assets");

const SCALE = 1;
const DISPLAY_SCALE = 2;

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
console.log(`border-image-slice: ${meta.borderImageSlice}`);
