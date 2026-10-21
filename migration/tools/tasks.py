#!/usr/bin/env python3
"""Task board for agents working on the migration independently.

Usage:
  python3 -I migration/tools/tasks.py ready     # tasks whose dependencies are done and nobody claimed
  python3 -I migration/tools/tasks.py list      # every task with status and owner
  python3 -I migration/tools/tasks.py check     # validate the board; exits 1 on any problem

The board is migration/tasks/T*.md. Protocol: AGENTS.md, section "Working on a task".
"""
import pathlib
import re
import sys

TASKS = pathlib.Path(__file__).resolve().parents[1] / "tasks"
STATUSES = ("todo", "claimed", "review", "done", "blocked")
ACTIVE = ("claimed", "review")


def parse(path):
    text = path.read_text()
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError(f"{path.name}: missing front matter")
    meta = {}
    for line in m.group(1).splitlines():
        key, _, value = line.partition(":")
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            value = [v.strip() for v in value[1:-1].split(",") if v.strip()]
        meta[key.strip()] = value
    meta["_file"] = path.name
    return meta


def load():
    return {t["id"]: t for t in map(parse, sorted(TASKS.glob("T*.md")))}


def literal_prefix(glob):
    return re.split(r"[*?]", glob, maxsplit=1)[0]


def overlaps(a, b):
    pa, pb = literal_prefix(a), literal_prefix(b)
    return pa.startswith(pb) or pb.startswith(pa)


def ready(tasks):
    return [t for t in tasks.values()
            if t["status"] == "todo" and all(tasks[d]["status"] == "done" for d in t["depends_on"])]


def check(tasks):
    problems = []
    for t in tasks.values():
        if t["_file"] != f"{t['id']}.md":
            problems.append(f"{t['_file']}: file name must be {t['id']}.md")
        if t["status"] not in STATUSES:
            problems.append(f"{t['id']}: unknown status {t['status']}")
        for d in t["depends_on"]:
            if d not in tasks:
                problems.append(f"{t['id']}: depends on unknown {d}")
        if t["status"] in ACTIVE and not t.get("claimed_by"):
            problems.append(f"{t['id']}: {t['status']} without claimed_by")
        if t["status"] in ACTIVE + ("done",):
            for d in t["depends_on"]:
                if d in tasks and tasks[d]["status"] != "done":
                    problems.append(f"{t['id']}: {t['status']} while dependency {d} is {tasks[d]['status']}")
    seen, stack = set(), set()

    def visit(i):
        if i in stack:
            problems.append(f"dependency cycle through {i}")
            return
        if i in seen or i not in tasks:
            return
        stack.add(i)
        for d in tasks[i]["depends_on"]:
            visit(d)
        stack.discard(i)
        seen.add(i)

    for i in tasks:
        visit(i)
    active = [t for t in tasks.values() if t["status"] in ACTIVE]
    for x in range(len(active)):
        for y in range(x + 1, len(active)):
            a, b = active[x], active[y]
            for ga in a["owns"]:
                for gb in b["owns"]:
                    if overlaps(ga, gb):
                        problems.append(f"{a['id']} and {b['id']} both own {ga} / {gb}")
    return problems


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "ready"
    tasks = load()
    if cmd == "list":
        for t in tasks.values():
            owner = f"  [{t['claimed_by']}]" if t.get("claimed_by") else ""
            print(f"{t['id']}  {t['status']:<8} P{t['phase']}  {t['title']}{owner}")
    elif cmd == "ready":
        for t in ready(tasks):
            gates = " (needs inventory)" if t.get("needs_inventory") == "true" else ""
            gates += " (human gate)" if t.get("human_gate") == "true" else ""
            print(f"{t['id']}  P{t['phase']}  {t['title']}{gates}")
    elif cmd == "check":
        problems = check(tasks)
        for p in problems:
            print(p)
        print(f"board {'FAIL' if problems else 'OK'}: {len(tasks)} tasks, {len(problems)} problems")
        sys.exit(1 if problems else 0)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
