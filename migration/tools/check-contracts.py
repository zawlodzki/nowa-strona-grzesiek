#!/usr/bin/env python3
"""Gate G1: contracts cover the inventory.

Usage: python3 -I migration/tools/check-contracts.py
Exits 1 and lists every uncovered item when a check fails.
"""
import csv
import json
import pathlib
import sys
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
INV = ROOT / "00-inventory"
C = ROOT / "contracts"


def rule_hits(section, rules):
    comp = section.get("component")
    first_class = (section.get("classes") or [None])[0]
    return [r for r in rules if (comp and r.get("component") == comp) or (not comp and r.get("classes") == first_class)]


def main():
    failures = []
    url_map = list(csv.DictReader((C / "url-map.csv").open()))
    mapped = {r["old_path"] for r in url_map}

    by_path = {r["old_path"]: r for r in url_map}
    for r in csv.DictReader((INV / "live-site" / "urls.csv").open()):
        path = urlsplit(r["final_url"] or r["url"]).path or "/"
        if path not in mapped:
            failures.append(f"url-map: live URL {path} missing")
        elif "noindex" not in r["meta_robots"] and by_path[path]["action"] == "keep" and by_path[path]["indexable"] != "yes":
            failures.append(f"url-map: {path} is indexable today but not in the new site")
    for r in csv.DictReader((INV / "webflow-settings" / "redirects.csv").open()):
        if r["old_path"] not in mapped:
            failures.append(f"url-map: Webflow redirect {r['old_path']} missing")
    keep = {r["old_path"] for r in url_map if r["action"] == "keep"}
    for r in url_map:
        if r["action"] == "redirect-301" and r["target"] not in keep:
            failures.append(f"url-map: {r['old_path']} redirects to {r['target']}, which is not a kept page")

    blocks = json.load((C / "blocks.json").open())
    rules = [dict(m, _block=b["type"]) for b in blocks["blocks"] for m in b["match"]]
    rules += [dict(m, _block="layout") for m in blocks["layout"]["match"]]
    sections = json.load((INV / "webflow" / "components.json").open())["pageSections"]
    for page in sections.values():
        if page.get("draft"):
            continue
        for s in page["sections"]:
            hits = {h["_block"] for h in rule_hits(s, rules)}
            if len(hits) != 1:
                label = s.get("component") or s.get("classes")
                failures.append(f"blocks: {page['path']} section {label} matches {sorted(hits) or 'nothing'}")

    entities = json.load((C / "entities.json").open())
    for key, node_id in [("person", "/o-mnie#person"), ("organization", "/#organization"), ("website", "/#website")]:
        if not entities[key]["@id"].endswith(node_id):
            failures.append(f"entities: {key} @id changed")
    if "potentialAction" in entities["website"]:
        failures.append("entities: SearchAction must be dropped (decision 6)")

    for f in failures:
        print(f)
    print(f"G1 {'FAIL' if failures else 'PASS'}: {len(url_map)} url-map rows, {len(blocks['blocks'])} blocks, {len(failures)} failures")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
