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
    raise SystemExit("Haarlem missing empty copy")
if "Anne&amp;Max" in city or "Anne&Max" in city:
    raise SystemExit("Haarlem still serving a catalog tent")
if "Met brags" in city:
    raise SystemExit("Haarlem still has the brags filter")

status, spot = fetch("/nl/haarlem/anne-max")
if status != 404:
    raise SystemExit(f"/nl/haarlem/anne-max status {status}, expected 404")

home = html("/")
if "90 dagen" in home or "90 days" in home:
    raise SystemExit("homepage still describes 90-day makers")

print("BRAG_VERIFIED")
