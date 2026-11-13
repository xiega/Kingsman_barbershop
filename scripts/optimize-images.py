#!/usr/bin/env python3
"""Generuje lekkie warianty WebP do public/img z oryginałów w source-images/.

Uruchom:  python3 scripts/optimize-images.py
Wymaga:   pip install pillow

Zdjęcia zespołu: wrzuć oryginały do source-images/team/<imie>.jpg
(np. julita.jpg) - skrypt zrobi z nich public/img/team/<imie>-<szerokość>.webp.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-images"
OUT = ROOT / "public" / "img"

# nazwa pliku wyjściowego -> (plik źródłowy, szerokości, jakość, opcjonalny crop (l,t,r,b) w ułamkach)
JOBS = {
    "about": ("kreska.jpg", [480, 800, 1200], 72, None),
    "cut-1": ("wlosy2.jpg", [480, 640], 74, None),
    "cut-2": ("wlosy.jpg", [480, 640], 74, None),
    "cut-3": ("wlosy3.jpeg", [480, 640], 74, None),
    "cut-4": ("wlosy4.jpeg", [480, 800], 74, None),
    "logo-full": ("logo_szerokie.png", [480, 966], 90, None),
}


def save_variants(img: Image.Image, name: str, widths, quality, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    for w in widths:
        if img.width < w:
            w = img.width
        h = round(img.height * w / img.width)
        resized = img.resize((w, h), Image.LANCZOS)
        path = out_dir / f"{name}-{w}.webp"
        resized.save(path, "WEBP", quality=quality, method=6)
        print(f"{path.relative_to(ROOT)}  {w}x{h}  {path.stat().st_size // 1024} KB")


def make_og():
    """Obraz 1200x630 do podglądu linku (Facebook, Messenger, WhatsApp)."""
    logo_path = SRC / "logo_szerokie.png"
    if not logo_path.exists():
        return
    logo = Image.open(logo_path).convert("RGBA")
    w = 880
    logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    canvas = Image.new("RGB", (1200, 630), (10, 10, 10))
    canvas.paste(logo, ((1200 - w) // 2, (630 - logo.height) // 2), logo)
    path = ROOT / "public" / "og.jpg"
    canvas.save(path, "JPEG", quality=88, optimize=True)
    print(f"{path.relative_to(ROOT)}  1200x630  {path.stat().st_size // 1024} KB")


def main():
    for name, (src, widths, quality, crop) in JOBS.items():
        p = SRC / src
        if not p.exists():
            print(f"pomijam {name}: brak {p}")
            continue
        img = ImageOps.exif_transpose(Image.open(p))
        img = img.convert("RGBA" if name.startswith("logo") else "RGB")
        if crop:
            l, t, r, b = crop
            img = img.crop((round(l * img.width), round(t * img.height), round(r * img.width), round(b * img.height)))
        save_variants(img, name, widths, quality, OUT)

    make_og()

    team_src = SRC / "team"
    if team_src.exists():
        for p in sorted(team_src.iterdir()):
            if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                img = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
                save_variants(img, p.stem, [400, 800], 78, OUT / "team")


if __name__ == "__main__":
    main()
