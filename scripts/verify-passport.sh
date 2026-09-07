#!/usr/bin/env python3
import sys
import urllib.error
import urllib.request

base = sys.argv[1] if len(sys.argv) > 1 else "http://77.42.31.66"


def fetch(path: str) -> tuple[int, str]:
    try:
        with urllib.request.urlopen(base + path, timeout=15) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


status, maker_a = fetch("/nl/u/maker-a")
if status != 200:
    raise SystemExit(f"/nl/u/maker-a status {status}")
if "Maker A" not in maker_a:
    raise SystemExit("maker-a missing Maker A")
if "Anne&amp;Max" not in maker_a and "Anne&Max" not in maker_a:
    raise SystemExit("maker-a missing Anne&Max")
if "1 unieke plek" not in maker_a:
    raise SystemExit("maker-a missing unique-spot wording for 1")
if "noindex" in maker_a:
    raise SystemExit("maker-a must not be noindex")

status, maker_b = fetch("/nl/u/maker-b")
if status != 200:
    raise SystemExit(f"/nl/u/maker-b status {status}")

status, missing = fetch("/nl/u/no-such-bragger")
if status != 404:
    raise SystemExit(f"/nl/u/no-such-bragger status {status}, expected 404")

status, week = fetch("/nl/u/maker-a?tab=week")
if status != 200:
    raise SystemExit(f"/nl/u/maker-a?tab=week status {status}")
if "Anne&amp;Max" not in week and "Anne&Max" not in week:
    raise SystemExit("week tab missing Anne&Max")

status, sitemap = fetch("/sitemap.xml")
if status != 200:
    raise SystemExit(f"/sitemap.xml status {status}")
if "/nl/u/maker-a" not in sitemap:
    raise SystemExit("sitemap missed /nl/u/maker-a")

print("PASSPORT_VERIFIED")
