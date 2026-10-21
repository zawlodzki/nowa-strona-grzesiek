# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude Code specifics

- Skills `good-css`, `impeccable`, `break-ui`, `animate` and `animation-performance` are installed in `.claude/skills/`. Invoke them through the Skill tool rather than reading the files.
- Work one task per session. Start it in a worktree on the task's branch. In this setup subagents could not write report `.md` files, so a subagent returns findings as text and the session writes them into the task's Handoff.
