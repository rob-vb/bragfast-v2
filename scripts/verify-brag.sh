#!/usr/bin/env python3
import json
import re
import sys
import urllib.request

base = sys.argv[1] if len(sys.argv) > 1 else "http://77.42.31.66"


def html(path: str) -> str:
    with urllib.request.urlopen(base + path, timeout=15) as response:
        if response.status != 200:
            raise SystemExit(f"{path} status {response.status}")
        return response.read().decode()


city = html("/nl/haarlem")
if "De Oude Banketbakker" in city:
    raise SystemExit("gravestone leaked onto the city list")
if "Nog niet gebragd" not in city:
    raise SystemExit("city list missing seed heading")

parts = city.split("Nog niet gebragd", 1)
board = parts[0]
tail = parts[1]
if "Anne&amp;Max Haarlem" not in board:
    raise SystemExit("Anne&Max missing from the numbered board")
if "Jopenkerk" not in tail:
    raise SystemExit("Jopenkerk missing from the seed heading")

item = re.search(r"<li>.*?Anne&amp;Max Haarlem.*?</li>", board, re.S)
if not item:
    raise SystemExit("Anne&Max board row missing")
if len(re.findall(r"Anne&amp;Max Haarlem", board)) != 1:
    raise SystemExit("Anne&Max must appear once on the board")
row = item.group(0)
if "01" not in row:
    raise SystemExit("Anne&Max rank 01 missing near the name")
if not re.search(r">\s*2\s*<", row):
    raise SystemExit("Anne&Max score 2 missing")

spot = html("/nl/haarlem/anne-max")
hosted = re.findall(
    r'<img[^>]+src="(https?://[^"]+)"',
    spot,
    re.I,
)
convex_imgs = [
    src
    for src in hosted
    if "convex" in src.lower() or "/api/storage" in src.lower()
]
if len(convex_imgs) < 2:
    raise SystemExit(
        f"spot feed needs two hosted images, found {len(convex_imgs)}"
    )

match = re.search(
    r'<script type="application/ld\+json">(.*?)</script>',
    spot,
    re.S,
)
if not match:
    raise SystemExit("spot page missing JSON-LD")
data = json.loads(match.group(1))
if data.get("@type") != "CafeOrCoffeeShop":
    raise SystemExit(f"JSON-LD type {data.get('@type')}")
if not data.get("image"):
    raise SystemExit("JSON-LD missing licensed image")

if 'href="/nl/haarlem/anne-max"' not in html("/?q=anne"):
    raise SystemExit("search missed Anne&Max")

print("BRAG_VERIFIED")
