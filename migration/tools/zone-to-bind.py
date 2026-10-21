#!/usr/bin/env python3
"""Turn the OVH zone inventory into a BIND file for Cloudflare import, and check it with dig.

    python3 -I migration/tools/zone-to-bind.py            # write the BIND file
    python3 -I migration/tools/zone-to-bind.py --verify   # also dig each kept record at OVH

Record values go only to migration/lanes/tracking/private/ (gitignored). stdout carries
names, types and verdicts, never values, so it can be pasted into tracked files.
"""

import argparse
import csv
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "migration/00-inventory/dns/zone-zawlodzki.pl.csv"
OUT = ROOT / "migration/lanes/tracking/private/zawlodzki.pl.zone"
ORIGIN = "zawlodzki.pl."
OVH_NS = "ns11.ovh.net"
# OVH TTL 0 means "zone default"; dig at OVH serves those records with 3600.
DEFAULT_TTL = 3600
DROP_NOTE = re.compile(r"\bstale\b|safe to drop|candidate to drop")


@dataclass(frozen=True)
class Record:
    type: str
    fqdn: str
    ttl: int
    priority: str
    value: str
    note: str

    @property
    def kept(self) -> bool:
        return self.type != "NS" and not DROP_NOTE.search(self.note)

    @property
    def rdata(self) -> str:
        if self.type == "TXT":
            return " ".join(f'"{chunk}"' for chunk in txt_chunks(self.value))
        if self.type in ("MX", "SRV"):
            return f"{self.priority} {self.value}"
        return self.value

    def bind_line(self) -> str:
        return f"{self.fqdn}\t{self.ttl}\tIN\t{self.type}\t{self.rdata}"


def txt_chunks(value: str) -> list[str]:
    return [value[i : i + 255] for i in range(0, len(value), 255)] or [""]


def load(path: Path) -> list[Record]:
    with path.open(newline="") as f:
        rows = list(csv.DictReader(f))
    # An RRset has one TTL (RFC 2181 5.2). OVH lists per-record TTLs but serves the lowest.
    rrset_ttl: dict[tuple[str, str], int] = {}
    for row in rows:
        key = (row["fqdn"], row["type"])
        rrset_ttl[key] = min(rrset_ttl.get(key, DEFAULT_TTL), int(row["ttl"]) or DEFAULT_TTL)
    return [
        Record(
            type=row["type"],
            fqdn=row["fqdn"],
            ttl=rrset_ttl[(row["fqdn"], row["type"])],
            priority=row["priority"],
            value=row["target"],
            note=row["notes"],
        )
        for row in rows
    ]


def normalize(rdata: str, rtype: str) -> str:
    if rtype == "TXT":
        return "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', rdata))
    return " ".join(rdata.lower().split())


def dig(fqdn: str, rtype: str) -> dict[str, int]:
    """Map each served rdata (normalized) to its TTL, asked directly at OVH."""
    out = subprocess.run(
        ["dig", "+norec", "+noall", "+answer", f"@{OVH_NS}", fqdn, rtype],
        capture_output=True, text=True, check=True,
    ).stdout
    served = {}
    for line in out.splitlines():
        parts = line.split(None, 4)
        if len(parts) == 5 and parts[3] == rtype:
            served[normalize(parts[4], rtype)] = int(parts[1])
    return served


def verify(records: list[Record]) -> int:
    kept = [r for r in records if r.kept]
    cache: dict[tuple[str, str], dict[str, int]] = {}
    mismatches = 0
    for r in kept:
        key = (r.fqdn, r.type)
        if key not in cache:
            cache[key] = dig(*key)
        served = cache[key]
        want = normalize(r.rdata, r.type)
        if want not in served:
            verdict = "MISSING at OVH"
        elif served[want] != r.ttl:
            verdict = f"ttl differs (zone {r.ttl}, OVH {served[want]})"
        else:
            verdict = "ok"
        mismatches += verdict != "ok"
        print(f"{verdict:<32} {r.type:<5} {r.fqdn}")
    for (fqdn, rtype), served in cache.items():
        same_rrset = [r for r in records if (r.fqdn, r.type) == (fqdn, rtype)]
        planned = {normalize(r.rdata, r.type): r.kept for r in same_rrset}
        for extra in served.keys() - {v for v, kept_ in planned.items() if kept_}:
            if extra in planned:
                print(f"{'served at OVH, dropped by plan':<32} {rtype:<5} {fqdn}")
            else:
                mismatches += 1
                print(f"{'EXTRA at OVH, not in zone':<32} {rtype:<5} {fqdn}")
    print(f"{len(kept)} kept records, {mismatches} mismatches", file=sys.stderr)
    return mismatches


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--verify", action="store_true", help="dig every kept record at OVH")
    args = parser.parse_args()

    records = load(SRC)
    kept = [r for r in records if r.kept]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        f"$ORIGIN {ORIGIN}\n$TTL {DEFAULT_TTL}\n"
        + "".join(r.bind_line() + "\n" for r in kept)
    )
    for r in records:
        if not r.kept:
            print(f"{'dropped (NS)' if r.type == 'NS' else 'dropped (note)':<32} {r.type:<5} {r.fqdn}")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(kept)} records, {len(records) - len(kept)} dropped", file=sys.stderr)

    return 1 if args.verify and verify(records) else 0


if __name__ == "__main__":
    sys.exit(main())
