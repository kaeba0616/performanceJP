#!/usr/bin/env python3
"""Generate placeholder PWA icons for THE PULSE.

Outputs:
  public/icons/icon-192.png            (192x192, any purpose)
  public/icons/icon-512.png            (512x512, any purpose)
  public/icons/icon-maskable-512.png   (512x512, maskable — content within 80% safe zone)
  public/favicon-32.png                (browser tab)
  public/apple-touch-icon.png          (180x180, harmless extra)

Run:
  python3 scripts/generate-icons.py
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ICON_DIR = ROOT / "public" / "icons"
PUBLIC = ROOT / "public"
ICON_DIR.mkdir(parents=True, exist_ok=True)

PRIMARY = (0, 65, 145, 255)        # #004191
FG = (255, 255, 255, 255)
ACCENT = (173, 198, 255, 255)      # primary-fixed-dim

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def draw_icon(size: int, *, maskable: bool = False, rounded: bool = True) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # For maskable, the system crops to ~80% safe zone, so we shrink content
    # but the background still fills the full square.
    if rounded and not maskable:
        radius = int(size * 0.22)
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=PRIMARY)
    else:
        draw.rectangle((0, 0, size, size), fill=PRIMARY)

    # Inner safe area
    inner = size * (0.6 if maskable else 0.75)
    inner_offset = (size - inner) / 2

    # Letter "P"
    letter = "P"
    font_size = int(inner * 0.95)
    font = ImageFont.truetype(FONT_PATH, font_size)

    bbox = draw.textbbox((0, 0), letter, font=font, anchor="lt")
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # bbox includes top-side bearing; subtract bbox[0:2] to align tightly
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.015  # nudge up slightly
    draw.text((x, y), letter, font=font, fill=FG)

    # Small "pulse" underline accent
    bar_w = inner * 0.45
    bar_h = max(2, int(size * 0.025))
    bx = (size - bar_w) / 2
    by = inner_offset + inner * 0.85
    draw.rounded_rectangle(
        (bx, by, bx + bar_w, by + bar_h),
        radius=bar_h // 2,
        fill=ACCENT,
    )

    return img


def main() -> None:
    targets = [
        (ICON_DIR / "icon-192.png", 192, False),
        (ICON_DIR / "icon-512.png", 512, False),
        (ICON_DIR / "icon-maskable-512.png", 512, True),
        (PUBLIC / "favicon-32.png", 32, False),
        (PUBLIC / "apple-touch-icon.png", 180, False),
    ]
    for path, size, maskable in targets:
        img = draw_icon(size, maskable=maskable)
        img.save(path, "PNG", optimize=True)
        print(f"  wrote {path.relative_to(ROOT)} ({size}x{size}{' maskable' if maskable else ''})")


if __name__ == "__main__":
    main()
