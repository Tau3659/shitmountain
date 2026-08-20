#!/usr/bin/env python3
"""Subset Fusion Pixel to glyphs used by the game."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FONT_FULL = ROOT / "fonts" / "fusion-pixel-12.full.woff2"
FONT_OUT = ROOT / "fonts" / "fusion-pixel-12.woff2"


def collect_glyphs() -> str:
    chars = {chr(code) for code in range(0x20, 0x7F)}
    for path in ROOT.rglob("*"):
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        if path.suffix.lower() not in {".html", ".css", ".js", ".json", ".md"}:
            continue
        chars.update(path.read_text(encoding="utf-8", errors="ignore"))
    chars = {ch for ch in chars if ord(ch) >= 32 and ch != "\ufeff"}
    return "".join(sorted(chars, key=ord))


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
    subset_font(glyphs)
    print(f"glyphs {len(glyphs)}")
    print(f"font {FONT_OUT.stat().st_size}B {FONT_OUT}")


if __name__ == "__main__":
    main()
