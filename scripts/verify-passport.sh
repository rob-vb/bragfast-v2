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


status, missing = fetch("/nl/u/no-such-bragger")
if status != 404:
    raise SystemExit(f"/nl/u/no-such-bragger status {status}, expected 404")

status, maker_a = fetch("/nl/u/maker-a")
if status == 200:
    if "Anne&amp;Max" in maker_a or "Anne&Max" in maker_a:
        raise SystemExit("maker-a still lists a catalog tent")

print("PASSPORT_VERIFIED")
