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
for name in [
    "Anne&amp;Max Haarlem",
    "STACH Haarlem",
    "Jopenkerk",
    "Bakkerij Honing",
    "Koffielokaal Spaarne",
]:
    if name not in city:
        raise SystemExit(f"city list missing {name}")
if "Nog niet gebragd" not in city:
    raise SystemExit("city list missing seed heading")
if "De Oude Banketbakker" in city:
    raise SystemExit("gravestone leaked onto the city list")

spot = html("/nl/haarlem/anne-max")
if "Anne&amp;Max Haarlem" not in spot:
    raise SystemExit("spot page missing name")
match = re.search(r'<script type="application/ld\+json">(.*?)</script>', spot, re.S)
if not match:
    raise SystemExit("spot page missing JSON-LD")
data = json.loads(match.group(1))
if data.get("@type") != "CafeOrCoffeeShop":
    raise SystemExit(f"JSON-LD type {data.get('@type')}")
if data.get("name") != "Anne&Max Haarlem":
    raise SystemExit(f"JSON-LD name {data.get('name')}")
image = data.get("image")
if isinstance(image, str) and "instagram.com" in image.lower():
    raise SystemExit("JSON-LD must not carry an Instagram image")
if image is not None and (
    not isinstance(image, str) or "convex.cloud/api/storage" not in image
):
    raise SystemExit(f"JSON-LD image must be licensed in-app storage: {image!r}")

grave = html("/nl/haarlem/oude-banketbakker")
if "Gesloten" not in grave or "De Oude Banketbakker" not in grave:
    raise SystemExit("gravestone page incomplete")

if 'href="/nl/haarlem"' not in html("/?q=haarlem"):
    raise SystemExit("search missed Haarlem")
if 'href="/nl/haarlem/anne-max"' not in html("/?q=anne"):
    raise SystemExit("search missed Anne&Max")

sitemap = html("/sitemap.xml")
if "/nl/haarlem/anne-max" not in sitemap:
    raise SystemExit("sitemap missed listed spot")
if "/nl/haarlem/oude-banketbakker" not in sitemap:
    raise SystemExit("sitemap missed gravestone")

print("CATALOG_VERIFIED")
