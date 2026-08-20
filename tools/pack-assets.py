#!/usr/bin/env python3
"""Pack runtime atlas and subset Fusion Pixel to glyphs used by the game."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "img"
FONT_FULL = ROOT / "fonts" / "fusion-pixel-12.full.woff2"
FONT_OUT = ROOT / "fonts" / "fusion-pixel-12.woff2"
ATLAS_OUT = IMG / "atlas.png"
ATLAS_JS = ROOT / "js" / "atlas.js"

SLICES = [
    ("head", "head.png"),
    ("body", "body.png"),
    ("hands", "hands.png"),
    ("handsPress", "hands-press.png"),
    ("keys", "keys.png"),
    ("crt", "crt.png"),
    ("face-0", "face-0.png"),
    ("face-1", "face-1.png"),
    ("face-2", "face-2.png"),
]


def collect_glyphs() -> str:
    chars = {chr(code) for code in range(0x20, 0x7F)}
    for path in ROOT.rglob("*"):
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        if path.suffix.lower() not in {".html", ".css", ".js", ".json", ".md"}:
            continue
        if path.name == "atlas.js":
            continue
        chars.update(path.read_text(encoding="utf-8", errors="ignore"))
    chars = {ch for ch in chars if ord(ch) >= 32 and ch != "\ufeff"}
    return "".join(sorted(chars, key=ord))


def pack_atlas() -> dict[str, dict[str, int]]:
    images = []
    for name, filename in SLICES:
        image = Image.open(IMG / filename).convert("RGBA")
        images.append((name, image))
    height = max(image.height for _, image in images)
    pad = 1
    x = 0
    rects: dict[str, dict[str, int]] = {}
    for name, image in images:
        rects[name] = {"x": x, "y": 0, "w": image.width, "h": image.height}
        x += image.width + pad
    atlas = Image.new("RGBA", (x - pad, height), (0, 0, 0, 0))
    for name, image in images:
        box = rects[name]
        atlas.paste(image, (box["x"], box["y"]))
    atlas.save(ATLAS_OUT, optimize=True)
    return rects


def write_atlas_js(rects: dict[str, dict[str, int]]) -> None:
    lines = [
        "export const ATLAS_SRC = new URL(\"../img/atlas.png\", import.meta.url).href;",
        "",
        "export const SPRITES = {",
    ]
    for name, box in rects.items():
        key = name if name.isidentifier() else f'"{name}"'
        lines.append(
            f"  {key}: {{ x: {box['x']}, y: {box['y']}, w: {box['w']}, h: {box['h']} }},"
        )
    lines.append("};")
    lines.append("")
    ATLAS_JS.write_text("\n".join(lines), encoding="utf-8")


def subset_font(glyphs: str) -> None:
    source = FONT_FULL if FONT_FULL.exists() else FONT_OUT
    if not source.exists():
        raise SystemExit(f"missing font source: {FONT_FULL}")
    glyph_file = ROOT / "tools" / ".glyphs.txt"
    glyph_file.write_text(glyphs, encoding="utf-8")
    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(source),
        f"--text-file={glyph_file}",
        "--flavor=woff2",
        f"--output-file={FONT_OUT}",
        "--layout-features=*",
        "--drop-tables+=DSIG",
        "--no-hinting",
    ]
    subprocess.check_call(cmd)
    glyph_file.unlink(missing_ok=True)


def main() -> None:
    glyphs = collect_glyphs()
    rects = pack_atlas()
    write_atlas_js(rects)
    subset_font(glyphs)
    print(f"glyphs {len(glyphs)}")
    print(f"atlas {ATLAS_OUT.stat().st_size}B {ATLAS_OUT}")
    print(f"font {FONT_OUT.stat().st_size}B {FONT_OUT}")


if __name__ == "__main__":
    main()
