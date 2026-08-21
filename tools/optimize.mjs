import { spawn, spawnSync } from "node:child_process";
import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";
import subsetFont from "subset-font";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

function findFfmpeg() {
  try {
    if (ffmpegStatic) {
      const info = spawnSync(ffmpegStatic, ["-version"], { encoding: "utf8" });
      if (info.status === 0) return ffmpegStatic;
    }
  } catch {}
  const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8", shell: true });
  if (probe.status === 0) return "ffmpeg";
  throw new Error("ffmpeg not found");
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${bin} ${code}`))));
  });
}

async function compressVideo() {
  const videoDir = path.join(root, "video");
  const files = await readdir(videoDir);
  const srcName = files.find((name) => name.toLowerCase().endsWith(".mp4") && name !== "scene.tmp.mp4");
  if (!srcName) throw new Error("no mp4");
  const src = path.join(videoDir, srcName);
  const dest = path.join(videoDir, "scene.mp4");
  const tmp = path.join(videoDir, "scene.tmp.mp4");
  const ffmpegPath = findFfmpeg();
  await run(ffmpegPath, [
    "-y",
    "-i",
    src,
    "-vf",
    "scale=640:-2:flags=neighbor",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    "-ac",
    "1",
    "-movflags",
    "+faststart",
    tmp,
  ]);
  const before = (await readFile(src)).byteLength;
  const after = (await readFile(tmp)).byteLength;
  await writeFile(dest, await readFile(tmp));
  await unlink(tmp);
  if (path.resolve(src) !== path.resolve(dest)) await unlink(src);
  console.log(`video ${kb(before)} -> ${kb(after)}`);
}

async function compressImages() {
  const jobs = [
    {
      src: "assets/intro-scene.png",
      dest: "assets/intro-scene.webp",
      fn: (img) => img.resize(768, 768, { kernel: "nearest" }).webp({ quality: 72, effort: 6 }),
    },
    {
      src: "assets/intro-title.png",
      dest: "assets/intro-title.webp",
      fn: (img) => img.webp({ quality: 82, effort: 6 }),
    },
    {
      src: "assets/intro-start.png",
      dest: "assets/intro-start.webp",
      fn: (img) => img.resize(480, null, { kernel: "nearest" }).webp({ quality: 82, effort: 6 }),
    },
    {
      src: "assets/intro-hint.png",
      dest: "assets/intro-hint.webp",
      fn: (img) => img.webp({ quality: 82, effort: 6 }),
    },
    {
      src: "img/face.png",
      dest: "img/face.webp",
      fn: (img) => img.resize(128, 128, { fit: "fill" }).webp({ quality: 80, effort: 6 }),
    },
  ];
  for (const job of jobs) {
    const src = path.join(root, job.src);
    const dest = path.join(root, job.dest);
    const before = (await readFile(src)).byteLength;
    await job.fn(sharp(src)).toFile(dest);
    const after = (await readFile(dest)).byteLength;
    await unlink(src);
    console.log(`${job.src} ${kb(before)} -> ${job.dest} ${kb(after)}`);
  }
}

function uniqueText(raw) {
  const chars = new Set();
  for (const ch of raw) {
    const code = ch.codePointAt(0);
    if (code > 31) chars.add(ch);
  }
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("").forEach((ch) => chars.add(ch));
  " .,;:!?()[]{}/\\@#$%^&*+-=_<>\"'`~|".split("").forEach((ch) => chars.add(ch));
  return [...chars].join("");
}

async function subsetGlyphs() {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const js = await readFile(path.join(root, "js/main.js"), "utf8");
  const text = uniqueText(html + js);
  const src = path.join(root, "fonts/fusion-pixel-12.woff2");
  const before = (await readFile(src)).byteLength;
  const out = await subsetFont(await readFile(src), text, { targetFormat: "woff2" });
  await writeFile(src, out);
  console.log(`font ${kb(before)} -> ${kb(out.byteLength)} (${text.length} glyphs)`);
}

await compressImages();
await subsetGlyphs();
if (!process.env.SKIP_VIDEO) await compressVideo();
