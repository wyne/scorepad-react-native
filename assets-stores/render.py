#!/usr/bin/env python3
"""Render captioned App Store screenshots from raw simulator captures.

Usage: python3 assets-stores/render.py
Reads assets-stores/raw/*.png and writes assets-stores/apple/<slot>/NN-name.png.
Needs Pillow (pip install pillow).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
OUT = ROOT / "apple"

# slot folder -> (canvas size, [(output name, raw file, caption)])
SETS = {
    "iPhone 6.9": (
        (1320, 2868),
        None,  # same shots as the 6.1" set
    ),
    "iPhone 6.1": (
        (1206, 2622),
        [
            ("01-board", "iphone-board-dark.png", "Tap or swipe to score.\nNo typing."),
            ("02-dial", "iphone-dial.png", "Big rounds?\nSpin the dial."),
            ("03-history", "iphone-history.png", "Every round,\nsaved."),
            ("04-point-values", "iphone-point-values.png", "Set your own\npoint steps."),
            ("05-games", "iphone-games.png", "All your game nights\nin one place."),
        ],
    ),
    "iPhone Duo outer": (
        (1398, 2034),
        [
            ("01-board", "duo-cover.png", "Keep score\nwith it closed."),
            ("02-dial", "duo-cover-dial.png", "Big rounds?\nSpin the dial."),
            ("03-history", "duo-cover-history.png", "Every round,\nsaved."),
        ],
    ),
    "iPhone Duo inner (landscape)": (
        (2853, 2007),
        [
            ("01-open", "duo-open.png", "Unfold for a bigger board."),
            ("02-tent", "duo-tent-landscape.png", "Board and scores, side by side."),
        ],
    ),
    "iPhone Duo inner (portrait)": (
        (2007, 2853),
        [
            ("03-book", "duo-book.png", "Every round\nat a glance."),
        ],
    ),
}
SETS["iPhone 6.9"] = (SETS["iPhone 6.9"][0], SETS["iPhone 6.1"][1])

BG_TOP = (14, 22, 40)
BG_BOTTOM = (34, 52, 92)
TEXT = (255, 255, 255)

FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
    "/Library/Fonts/Inter-Bold.otf",
    "/System/Library/Fonts/SFNS.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def font(size):
    for p in FONT_CANDIDATES:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size)


def gradient(w, h):
    top = Image.new("RGB", (w, h), BG_TOP)
    bottom = Image.new("RGB", (w, h), BG_BOTTOM)
    mask = Image.linear_gradient("L").resize((w, h))
    return Image.composite(bottom, top, mask)


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *im.size), radius, fill=255)
    return mask


def render(size, raw_path, caption):
    w, h = size
    canvas = gradient(w, h)
    draw = ImageDraw.Draw(canvas)
    short = min(w, h)
    portrait = h > w

    # caption
    fsize = int(short * (0.075 if portrait else 0.06))
    f = font(fsize)
    top_pad = int(h * 0.05)
    box = draw.multiline_textbbox((0, 0), caption, font=f, spacing=fsize // 4, align="center")
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.multiline_text(((w - tw) / 2, top_pad), caption, font=f, fill=TEXT,
                        spacing=fsize // 4, align="center")

    # screenshot
    shot = Image.open(raw_path).convert("RGB")
    area_top = top_pad + th + int(h * 0.045)
    margin = int(w * (0.09 if portrait else 0.07))
    max_w, max_h = w - 2 * margin, h - area_top - int(h * 0.04)
    scale = min(max_w / shot.width, max_h / shot.height)
    shot = shot.resize((round(shot.width * scale), round(shot.height * scale)), Image.LANCZOS)
    x, y = (w - shot.width) // 2, area_top
    radius = int(min(shot.size) * 0.06)

    shadow = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x, y + radius // 3, x + shot.width, y + shot.height + radius // 3), radius, fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius // 2))
    canvas.paste(Image.new("RGB", canvas.size, (0, 0, 0)), (0, 0), shadow)
    canvas.paste(shot, (x, y), rounded(shot, radius))
    return canvas


def main():
    for slot, (size, shots) in SETS.items():
        out_dir = OUT / slot
        out_dir.mkdir(parents=True, exist_ok=True)
        for name, raw, caption in shots:
            render(size, RAW / raw, caption).save(out_dir / f"{name}.png", optimize=True)
            print(f"{slot}/{name}.png")


if __name__ == "__main__":
    main()
