"""Generate the Open Graph preview image for the website."""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_PATH = REPO_ROOT / "public" / "images" / "og-image.png"
PHOTO_PATH = REPO_ROOT / "public" / "images" / "profile.jpg"

W, H = 1200, 630
BG_COLOR = (10, 10, 10)
TEXT_COLOR = (226, 223, 216)
SUB_COLOR = (85, 85, 85)


def generate():
    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    try:
        name_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Black.ttf", 115)
    except OSError:
        name_font = ImageFont.load_default()

    try:
        sub_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except OSError:
        sub_font = ImageFont.load_default()

    # Name
    draw.text((180, 150), "NOAH", fill=TEXT_COLOR, font=name_font)
    draw.text((180, 270), "EISEN", fill=TEXT_COLOR, font=name_font)

    # Subtitle
    draw.text((184, 435), "Software Engineer  ·  San Francisco, CA", fill=SUB_COLOR, font=sub_font)

    # Circular profile photo
    photo = Image.open(PHOTO_PATH)
    size = min(photo.size)
    left = (photo.width - size) // 2
    top = (photo.height - size) // 2
    photo = photo.crop((left, top, left + size, top + size))

    circle_size = 280
    photo = photo.resize((circle_size, circle_size), Image.LANCZOS)

    mask = Image.new("L", (circle_size, circle_size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, circle_size, circle_size), fill=255)

    img.paste(photo, (740, (H - circle_size) // 2), mask)

    img.save(OUTPUT_PATH, "PNG")
    print(f"Saved OG image to {OUTPUT_PATH}")


if __name__ == "__main__":
    generate()
