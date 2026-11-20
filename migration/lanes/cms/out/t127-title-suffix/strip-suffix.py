"""T127: strip the brand from stored SEO titles. The web build appends " | Grzegorz Zawłodzki".

Usage: python3 -I strip-suffix.py <projection.json> <out-dir>

The projection is the published result of
  *[(_type in ["page", "post"] && defined(seo.title)) || _type == "siteSettings"]
    {_id, _rev, _type, "slug": slug.current, "title": seo.title, "defaultTitle": defaultSeo.title}
Writes titles.tsv (every changed field, old -> new) and seo-mutations.json (ifRevisionID-guarded patches).
"""
import csv
import json
import sys
from pathlib import Path

BRAND = "Grzegorz Zawłodzki"
SUFFIXES = (f" | {BRAND}", " | Zawłodzki", f" - {BRAND}", f" — {BRAND}", f" – {BRAND}")
PREFIXES = (f"{BRAND} | ",)
LIMIT = 60


def strip(title: str) -> str:
    bare = title.strip()
    for suffix in SUFFIXES:
        if bare.endswith(suffix):
            return bare[: -len(suffix)].strip()
    for prefix in PREFIXES:
        if bare.startswith(prefix):
            return bare[len(prefix):].strip()
    return bare


def main(projection: str, out_dir: str) -> None:
    data = json.loads(Path(projection).read_text(encoding="utf-8"))
    docs = data["result"] if isinstance(data, dict) else data
    rows, mutations = [], []
    for doc in sorted(docs, key=lambda d: d["_id"]):
        if doc["_id"].startswith("drafts.") or doc["_id"].startswith("versions."):
            raise SystemExit(f"unexpected draft or version in the projection: {doc['_id']}")
        field, old = ("defaultSeo.title", doc.get("defaultTitle")) if doc["_type"] == "siteSettings" else ("seo.title", doc.get("title"))
        if not old:
            continue
        new = strip(old)
        if not new or len(new) > LIMIT:
            raise SystemExit(f"{doc['_id']}: bare title {new!r} is empty or over {LIMIT}")
        if new == old:
            continue
        rows.append({"id": doc["_id"], "slug": doc.get("slug") or "", "field": field, "old": old, "new": new, "new_len": len(new)})
        mutations.append({"patch": {"id": doc["_id"], "ifRevisionID": doc["_rev"], "set": {field: new}}})
    out = Path(out_dir)
    with (out / "titles.tsv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["id", "slug", "field", "old", "new", "new_len"], delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    (out / "seo-mutations.json").write_text(json.dumps({"mutations": mutations}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(docs)} documents, {len(mutations)} patches")


if __name__ == "__main__":
    main(*sys.argv[1:])
