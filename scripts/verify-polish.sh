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


status, home = fetch("/")
if status != 200:
    raise SystemExit(f"/ status {status}")
if "Dichtbij" not in home:
    raise SystemExit("homepage missing Dichtbij")
for city in ("Haarlem", "Amsterdam", "Rotterdam", "Utrecht"):
    if city not in home:
        raise SystemExit(f"featured missing {city}")

status, brags = fetch("/nl/haarlem?brags=1")
if status != 200:
    raise SystemExit(f"/nl/haarlem?brags=1 status {status}")
if "Anne&amp;Max" not in brags and "Anne&Max" not in brags:
    raise SystemExit("brags filter missing Anne&Max")
if "Nog niet gebragd" in brags:
    raise SystemExit("brags filter leaked seed heading")
if "Jopenkerk" in brags:
    raise SystemExit("brags filter leaked Jopenkerk")

status, open_now = fetch("/nl/haarlem?open=1")
if status != 200:
    raise SystemExit(f"/nl/haarlem?open=1 status {status}")

status, admin = fetch("/admin")
if status != 404:
    raise SystemExit(f"/admin status {status}, expected 404")

status, closed = fetch("/nl/haarlem/oude-banketbakker")
if status != 200:
    raise SystemExit(f"/nl/haarlem/oude-banketbakker status {status}")
if "Gesloten" not in closed:
    raise SystemExit("closed spot missing Gesloten")

print("POLISH_VERIFIED")
