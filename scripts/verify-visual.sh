#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEEDLES = ("#4D200D", "#C4671E", "#FFF8F0", "--font-syne")
hits = []
for folder in (ROOT / "app", ROOT / "components"):
    for path in folder.rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".css"}:
            continue
        text = path.read_text()
        for needle in NEEDLES:
            if needle in text:
                hits.append(f"{path.relative_to(ROOT)}: {needle}")

if hits:
    raise SystemExit("old cream world leaked:\n" + "\n".join(hits))
print("VISUAL_WORLD_VERIFIED")
