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


stach = html("/nl/haarlem/stach")
if "instagram.com/p/BragFastHardTag" not in stach:
    raise SystemExit("STACH missing Instagram permalink")
if "#bragfast" not in stach:
    raise SystemExit("STACH missing #bragfast")
if "/api/storage" in stach:
    raise SystemExit("STACH must not use /api/storage")
for url in re.findall(r'https?://[^"\s]+convex\.cloud[^"\s]*', stach, re.I):
    if "storage" in url.lower():
        raise SystemExit(f"STACH has Convex storage URL {url}")

ld = re.search(
    r'<script type="application/ld\+json">(.*?)</script>',
    stach,
    re.S,
)
if not ld:
    raise SystemExit("STACH missing JSON-LD")
data = json.loads(ld.group(1))
if "image" in data:
    raise SystemExit("STACH JSON-LD must not have image")

city = html("/nl/haarlem")
if "Nog niet gebragd" not in city:
    raise SystemExit("city list missing seed heading")

parts = city.split("Nog niet gebragd", 1)
board = parts[0]
tail = parts[1]
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

if "STACH" not in board:
    raise SystemExit("STACH missing before the seed heading")
if "Jopenkerk" not in tail:
    raise SystemExit("Jopenkerk missing from the seed heading")
if re.search(r"<li>.*?Jopenkerk.*?</li>", board, re.S):
    raise SystemExit("Jopenkerk must not be a numbered board row")
if "De Koffiesalon Haarlem" not in tail:
    raise SystemExit("De Koffiesalon Haarlem missing from the tail")
if "Shell Haarlem" in city:
    raise SystemExit("Shell Haarlem leaked onto the city page")

peek = subprocess.run(
    ["npx", "convex", "run", "internal.seed.socialState"],
    cwd=repo,
    capture_output=True,
    text=True,
)
if peek.returncode != 0:
    raise SystemExit(
        f"convex socialState failed: {peek.stderr.strip() or peek.stdout.strip()}"
    )
try:
    state = json.loads(peek.stdout.strip())
except json.JSONDecodeError:
    raise SystemExit(f"convex socialState was not JSON: {peek.stdout}")

pending = state.get("pendingCaption")
if not isinstance(pending, str) or "Jopenkerk" not in pending:
    raise SystemExit(f"pendingCaption missing Jopenkerk: {pending!r}")
if state.get("queuedPetrol") is not True:
    raise SystemExit(f"queuedPetrol {state.get('queuedPetrol')!r}")
live = state.get("liveUserAdd")
if not isinstance(live, str) or "de-koffiesalon" not in live:
    raise SystemExit(f"liveUserAdd {live!r}")
if state.get("hardTagOn") != "stach":
    raise SystemExit(f"hardTagOn {state.get('hardTagOn')!r}")

print("SOCIAL_VERIFIED")
