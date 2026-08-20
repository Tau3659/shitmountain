#!/usr/bin/env python3
"""Upper-screen wizard-at-desk sprite. Logical 160x120, also write 3x."""

from PIL import Image

W, H = 160, 120
px = {}

PAL = {
    "o":  (14, 15, 16, 255),
    "hat": (132, 84, 46, 255),
    "hat2": (96, 58, 30, 255),
    "hat3": (168, 118, 70, 255),
    "band": (52, 32, 18, 255),
    "skin": (228, 178, 140, 255),
    "sk2": (198, 138, 102, 255),
    "eye": (22, 18, 16, 255),
    "tu": (38, 108, 112, 255),
    "tu2": (24, 72, 76, 255),
    "tu3": (78, 144, 140, 255),
    "pa": (62, 42, 30, 255),
    "pa2": (42, 28, 20, 255),
    "bt": (34, 22, 16, 255),
    "pk": (118, 72, 42, 255),
    "pk2": (78, 46, 26, 255),
    "pk3": (148, 96, 58, 255),
    "wd": (148, 96, 58, 255),
    "wd2": (98, 60, 36, 255),
    "wd3": (184, 128, 78, 255),
    "wd4": (62, 38, 24, 255),
    "lp": (48, 50, 54, 255),
    "lp2": (28, 30, 34, 255),
    "lp3": (86, 90, 94, 255),
    "sc": (176, 220, 236, 255),
    "sc2": (80, 132, 152, 255),
}


def put(x, y, k):
    if 0 <= x < W and 0 <= y < H:
        px[(x, y)] = PAL[k]


def rect(x, y, w, h, k):
    for j in range(h):
        for i in range(w):
            put(x + i, y + j, k)


def ellipse(cx, cy, rx, ry, k):
    rx = max(1, rx)
    ry = max(1, ry)
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.05:
                put(x, y, k)


def tri_hat():
    # classic floppy wizard cone + brim (not stacked blobs)
    ellipse(96, 31, 24, 5, "hat")
    ellipse(96, 30, 22, 3, "hat3")
    for y in range(0, 28):
        t = y / 27
        cx = int(108 - t * 12)
        half = max(1, int(1 + t * 13))
        shade = int(half * 0.35)
        rect(cx - half, 2 + y, half * 2, 1, "hat")
        if shade:
            rect(cx + half - shade, 2 + y, shade, 1, "hat2")
        if t < 0.2:
            rect(cx - 1, 2 + y, 3, 1, "hat3")
    # brim front drop
    ellipse(84, 32, 8, 4, "hat2")
    rect(84, 27, 26, 4, "band")


def wizard():
    # backpack (back = right)
    ellipse(118, 64, 14, 16, "pk")
    ellipse(122, 64, 8, 12, "pk2")
    ellipse(114, 56, 10, 8, "pk3")
    rect(104, 56, 8, 3, "band")
    rect(104, 74, 8, 3, "band")

    # torso
    ellipse(94, 64, 18, 16, "tu")
    ellipse(90, 58, 14, 10, "tu3")
    ellipse(86, 66, 8, 12, "tu2")

    # left arm to keyboard
    ellipse(70, 66, 14, 7, "tu")
    ellipse(62, 70, 8, 6, "tu2")

    # pants / seat
    ellipse(96, 82, 16, 10, "pa")
    ellipse(90, 84, 8, 8, "pa2")

    # boots
    ellipse(88, 94, 8, 5, "bt")
    ellipse(102, 94, 8, 5, "bt")

    # neck + head
    rect(92, 44, 8, 8, "sk2")
    ellipse(94, 36, 13, 12, "skin")
    ellipse(88, 38, 6, 8, "sk2")
    # eyes looking left
    put(86, 36, "eye")
    put(87, 36, "eye")
    put(88, 36, "eye")
    put(94, 36, "eye")
    put(95, 36, "eye")
    # brow
    rect(85, 33, 4, 1, "sk2")
    rect(93, 33, 4, 1, "sk2")
    # mouth
    rect(88, 42, 5, 1, "sk2")

    # hands
    ellipse(54, 74, 6, 4, "skin")
    ellipse(62, 76, 5, 3, "sk2")

    tri_hat()


def furniture():
    # desk board
    rect(22, 84, 118, 9, "wd")
    rect(22, 84, 118, 2, "wd3")
    rect(22, 91, 118, 2, "wd2")
    rect(22, 93, 118, 2, "wd4")
    # legs
    rect(26, 95, 6, 18, "wd2")
    rect(130, 95, 6, 18, "wd2")
    rect(26, 95, 6, 2, "wd")
    rect(130, 95, 6, 2, "wd")
    # stool
    ellipse(98, 92, 14, 4, "wd")
    rect(90, 94, 5, 18, "wd2")
    rect(104, 94, 5, 18, "wd2")
    ellipse(99, 112, 12, 3, "wd4")

    # laptop deck
    rect(30, 76, 40, 8, "lp")
    rect(30, 76, 40, 2, "lp3")
    rect(30, 82, 40, 2, "lp2")
    for i in range(9):
        rect(34 + i * 4, 79, 3, 2, "lp2")
    # lid, side view, glowing toward wizard
    rect(28, 46, 12, 32, "lp")
    rect(28, 46, 12, 2, "o")
    rect(28, 76, 12, 2, "o")
    rect(28, 46, 2, 32, "o")
    rect(38, 46, 2, 32, "o")
    rect(31, 49, 6, 24, "sc2")
    rect(34, 52, 3, 18, "sc")


def outline():
    extra = []
    for (x, y), col in list(px.items()):
        if col[3] < 255:
            continue
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if (nx, ny) not in px:
                extra.append((nx, ny))
    for x, y in extra:
        put(x, y, "o")


furniture()
wizard()
outline()

img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for (x, y), color in px.items():
    img.putpixel((x, y), color)

img.save("/workspace/img/scene.png", optimize=True)
img.resize((W * 3, H * 3), Image.NEAREST).save("/workspace/img/scene@3x.png", optimize=True)
print("opaque", len(px), "bbox", min(x for x, y in px), min(y for x, y in px), max(x for x, y in px), max(y for x, y in px))
