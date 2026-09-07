#!/usr/bin/env python3
import json
import re
import subprocess
import sys
import urllib.request

base = sys.argv[1] if len(sys.argv) > 1 else "http://77.42.31.66"
repo = "/home/henk/bragfast-v2"


def html(path: str) -> str:
    with urllib.request.urlopen(base + path, timeout=15) as response:
        if response.status != 200:
            raise SystemExit(f"{path} status {response.status}")
        return response.read().decode()


city = html("/nl/haarlem")
if "Nog niet gebragd" not in city:
    raise SystemExit("city list missing seed heading")

parts = city.split("Nog niet gebragd", 1)
board = parts[0]
tail = parts[1]
if "Bregje" not in tail:
    raise SystemExit("Bregje missing from the catalog tail")

if "Anne&amp;Max Haarlem" not in board:
    raise SystemExit("Anne&Max missing from the numbered board")
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

if "Jopenkerk" not in tail:
    raise SystemExit("Jopenkerk missing from the catalog tail")
if re.search(r"<li>.*?Jopenkerk.*?</li>", board, re.S):
    raise SystemExit("Jopenkerk must not be a numbered board row")

if "Shell" in city:
    raise SystemExit("Shell leaked onto the city page")
if "Ghost" in city:
    raise SystemExit("Ghost bakery leaked onto the city page")
if "De Oude Banketbakker" in city:
    raise SystemExit("De Oude Banketbakker must not be on the city list")

honing = html("/nl/haarlem/bakkerij-honing")
if "06:30" not in honing:
    raise SystemExit("Bakkerij Honing missing 06:30")

amsterdam = html("/nl/amsterdam")
if "De Bakkerswinkel Amsterdam" not in amsterdam:
    raise SystemExit("Amsterdam missing De Bakkerswinkel Amsterdam")

grave = html("/nl/haarlem/oude-banketbakker")
if "Gesloten" not in grave:
    raise SystemExit("De Oude Banketbakker missing Gesloten")

peek = subprocess.run(
    ["npx", "convex", "run", "internal.seed.hygieneState"],
    cwd=repo,
    capture_output=True,
    text=True,
)
if peek.returncode != 0:
    raise SystemExit(
        f"convex hygieneState failed: {peek.stderr.strip() or peek.stdout.strip()}"
    )
try:
    state = json.loads(peek.stdout.strip())
except json.JSONDecodeError:
    raise SystemExit(f"convex hygieneState was not JSON: {peek.stdout}")

bregje = state.get("bregje")
if not isinstance(bregje, str) or "bregje" not in bregje:
    raise SystemExit(f"bregje {bregje!r}")
if state.get("honingOpen") != "06:30":
    raise SystemExit(f"honingOpen {state.get('honingOpen')!r}")
amsterdam_bakery = state.get("amsterdamBakery")
if not isinstance(amsterdam_bakery, str) or len(amsterdam_bakery) == 0:
    raise SystemExit(f"amsterdamBakery {amsterdam_bakery!r}")
if state.get("petrolSpot") is not False:
    raise SystemExit(f"petrolSpot {state.get('petrolSpot')!r}")
if state.get("petrolQueued") is not False:
    raise SystemExit(f"petrolQueued {state.get('petrolQueued')!r}")
if state.get("ghostSpot") is not False:
    raise SystemExit(f"ghostSpot {state.get('ghostSpot')!r}")
if state.get("oudeBanket") != "gravestone":
    raise SystemExit(f"oudeBanket {state.get('oudeBanket')!r}")

print("HYGIENE_VERIFIED")
