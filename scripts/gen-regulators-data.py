#!/usr/bin/env python3
"""scripts/gen-regulators-data.py — TEMPORARY bridge, not the publish adapter.

The real content pipeline is documented in this site's `/publish` skill
stub (registry/publish@... in the sibling kestrel checkout): a
`therapybulletin` adapter in the engine's publish core, not yet built,
that will read `records/`/`changelog/` and emit this site's generated
content under the core's guarantees (secret scan, field allowlists,
no-empty-wipe). Until that adapter exists, this script is a narrow,
deterministic, re-runnable stand-in for exactly one feature — the
jurisdiction map's "regulatory bodies per province" panel — reading
kestrel.yaml's `sources:` list (not `records/`, which is still empty)
because that's the only sourced, dated data that currently exists for
"which regulators exist per jurisdiction." It is NOT a general content
pipeline: don't extend it to emit anything beyond data/regulators.yaml,
and delete it the day the real adapter lands.

Usage: python3 scripts/gen-regulators-data.py
Reads:  ../therapybulletin-data/kestrel.yaml
Writes: data/regulators.yaml (this repo)
"""
import yaml
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
DATA_REPO = SITE_ROOT.parent / "therapybulletin-data"
MANIFEST = DATA_REPO / "kestrel.yaml"
OUT = SITE_ROOT / "data" / "regulators.yaml"

TIER_LABEL = {1: "Regulator", 2: "Quasi-regulatory / associations", 3: "Association"}


def main():
    manifest = yaml.safe_load(MANIFEST.read_text())
    sources = manifest["sources"]

    by_jurisdiction = {}
    for s in sources:
        j = s["jurisdiction"]
        entry = {
            "id": s["id"],
            "name": s["name"],
            "org_type": s.get("org_type"),
            "tier": s.get("tier"),
            "tier_label": TIER_LABEL.get(s.get("tier"), ""),
            "language": s.get("language"),
            "website": s.get("website") or s.get("endpoint") or s.get("feed_url"),
            "status": s.get("status"),
            "verified": s.get("verified", True),
        }
        by_jurisdiction.setdefault(j, []).append(entry)

    for j in by_jurisdiction:
        by_jurisdiction[j].sort(key=lambda e: (e["tier"] or 9, e["name"]))

    out = {
        "generated_by": "scripts/gen-regulators-data.py (temporary bridge — see file header)",
        "source_manifest": "therapybulletin-data/kestrel.yaml",
        "jurisdictions": by_jurisdiction,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(yaml.safe_dump(out, sort_keys=False, allow_unicode=True, width=100))
    total = sum(len(v) for v in by_jurisdiction.values())
    print(f"wrote {OUT} — {total} sources across {len(by_jurisdiction)} jurisdictions")


if __name__ == "__main__":
    main()
