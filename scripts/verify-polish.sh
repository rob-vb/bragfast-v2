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
if "90 dagen" in home or "90 days" in home:
    raise SystemExit("homepage still describes 90-day makers")

status, empty = fetch("/nl/haarlem")
if status != 200:
    raise SystemExit(f"/nl/haarlem status {status}")
if "Nog geen plekken in deze stad." not in empty:
    raise SystemExit("Haarlem missing empty copy")

status, open_now = fetch("/nl/haarlem?open=1")
if status != 200:
    raise SystemExit(f"/nl/haarlem?open=1 status {status}")
if "Nog geen plekken in deze stad." not in open_now:
    raise SystemExit("open filter empty Haarlem missing empty copy")

status, admin = fetch("/admin")
if status != 404:
    raise SystemExit(f"/admin status {status}, expected 404")

status, closed = fetch("/nl/haarlem/oude-banketbakker")
if status != 404:
    raise SystemExit(f"/nl/haarlem/oude-banketbakker status {status}, expected 404")

print("POLISH_VERIFIED")
