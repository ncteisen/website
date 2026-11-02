"""Extract model textures from owner-supplied HEICs; never changes the originals.

Usage: python extract-textures.py PHOTO_FOLDER [PHOTO_FOLDER ...]
Requires Pillow, pillow-heif and numpy. All output is metadata-free WebP.
Coordinates refer to the oriented review images (1400px, or 1600px for follow-ups).
"""
import sys
from pathlib import Path

import numpy as np
import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()
OUTPUT = Path(__file__).resolve().parents[2] / "public/images/apartment"
# Source, review width, quadrilateral clockwise from top-left, output size.
PATCHES = {
    "fireplace-art": ("0139", 1050, [(460, 477), (716, 481), (712, 598), (461, 595)], (768, 352)),
    "fireplace": ("0139", 1050, [(352, 701), (814, 710), (795, 1048), (348, 1045)], (1024, 768)),
    "bookcase": ("0139", 1050, [(128, 695), (340, 704), (337, 959), (130, 953)], (512, 640)),
    "piano-art": ("0265", 1600, [(166, 369), (268, 371), (276, 488), (176, 491)], (512, 640)),
    "wood": ("0265", 1600, [(1150, 922), (1455, 998), (1351, 1091), (1026, 996)], (768, 512)),
    "rug": ("0265", 1600, [(549, 854), (930, 972), (843, 995), (499, 888)], (768, 384)),
    "linen": ("0139", 1050, [(758, 1162), (907, 1213), (849, 1282), (701, 1224)], (512, 512)),
    "buffet": ("0155", 1050, [(199, 869), (704, 752), (679, 1056), (214, 1274)], (768, 640)),
    "shower-curtain": ("0268", 1600, [(433, 40), (520, 41), (610, 638), (466, 675)], (256, 1024)),
    "quilt": ("0244", 1050, [(748, 798), (927, 775), (892, 1006), (695, 1005)], (512, 768)),
    "bedroom-rug": ("0244", 1050, [(191, 1060), (330, 1131), (294, 1262), (154, 1182)], (512, 512)),
    "courtyard": ("0252", 1050, [(4, 7), (333, 7), (343, 541), (3, 541)], (512, 768)),
    "bay-view": ("0142", 1050, [(704, 452), (915, 455), (904, 575), (697, 570)], (512, 384)),
    "office-curtain": ("0232", 1050, [(250, 136), (374, 137), (377, 590), (255, 587)], (256, 768)),
}
REFERENCES = {"dining": "0166", "entry": "0172", "kitchen": "0196", "bath": "0268"}


def rectify(source: Image.Image, points: list, size: tuple) -> Image.Image:
    width, height = size
    matrix, values = [], []
    for (x, y), (u, v) in zip([(0, 0), (width, 0), (width, height), (0, height)], points):
        matrix.extend([[x, y, 1, 0, 0, 0, -u*x, -u*y], [0, 0, 0, x, y, 1, -v*x, -v*y]])
        values.extend([u, v])
    coefficients = np.linalg.solve(np.array(matrix), np.array(values))
    return source.transform(size, Image.Transform.PERSPECTIVE, coefficients, Image.Resampling.BICUBIC)


def main() -> None:
    files = {p.stem: p for folder in sys.argv[1:] for p in Path(folder).glob("*.HEIC")}
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (number, review_width, corners, size) in PATCHES.items():
        with Image.open(files[f"IMG_{number}"]) as raw:
            source = ImageOps.exif_transpose(raw).convert("RGB")
            scale = source.width / review_width
            patch = rectify(source, [(x*scale, y*scale) for x, y in corners], size)
            # These surfaces were photographed in shadow. Lift their baked-in
            # exposure before applying the model's own physical lighting.
            if name in ("quilt", "buffet"):
                gamma = 0.55 if name == "quilt" else 0.65
                patch = Image.fromarray(np.uint8((np.asarray(patch) / 255.0) ** gamma * 255))
            patch.info.clear()
            patch.save(OUTPUT / f"{name}.webp", quality=87, method=6)
    for name, number in REFERENCES.items():
        with Image.open(files[f"IMG_{number}"]) as raw:
            photo = ImageOps.exif_transpose(raw).convert("RGB")
            photo.thumbnail((1440, 1440))
            photo.info.clear()
            photo.save(OUTPUT / f"reference-{name}.webp", quality=83, method=6)
    print(f"Wrote {len(PATCHES)} textures and {len(REFERENCES)} references to {OUTPUT}")


if __name__ == "__main__":
    main()
