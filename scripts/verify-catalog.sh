#!/usr/bin/env python3
import sys
import urllib.error
import urllib.request

base = sys.argv[1] if len(sys.argv) > 1 else "http://77.42.31.66"


def html(path: str) -> str:
    with urllib.request.urlopen(base + path, timeout=15) as response:
        if response.status != 200:
            raise SystemExit(f"{path} status {response.status}")
        return response.read().decode()


def fetch(path: str) -> tuple[int, str]:
    try:
        with urllib.request.urlopen(base + path, timeout=15) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


city = html("/nl/haarlem")
if "Nog geen plekken in deze stad." not in city:
    raise SystemExit("city list missing empty copy")
if "Anne&amp;Max Haarlem" in city or "STACH Haarlem" in city:
    raise SystemExit("city list still serving catalog tents")
if "De Oude Banketbakker" in city:
    raise SystemExit("gravestone leaked onto the city list")

status, spot = fetch("/nl/haarlem/anne-max")
if status != 404:
    raise SystemExit(f"old spot URL status {status}, expected 404")

status, grave = fetch("/nl/haarlem/oude-banketbakker")
if status != 404:
    raise SystemExit(f"gravestone URL status {status}, expected 404")

search = html("/?q=anne")
if 'href="/nl/haarlem/anne-max"' in search:
    raise SystemExit("search still returns a catalog tent")
if "Anne&amp;Max" in search or "Anne&Max" in search:
    raise SystemExit("search still names Anne&Max")

if 'href="/nl/haarlem"' not in html("/?q=haarlem"):
    raise SystemExit("search missed Haarlem")

sitemap = html("/sitemap.xml")
if "/nl/haarlem" not in sitemap:
    raise SystemExit("sitemap missed woonplaats Haarlem")
if "/nl/haarlem/anne-max" in sitemap:
    raise SystemExit("sitemap still lists an old spot URL")

print("CATALOG_VERIFIED")
