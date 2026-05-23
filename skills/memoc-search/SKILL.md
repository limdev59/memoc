---
name: memoc-search
description: >
  Search memory files and agent docs for a query. Finds relevant notes, decisions,
  worklogs, and wiki entries. Supports --snippets for line-level matches.
  Trigger: /memoc-search, "search memoc", "search memory", "find in notes",
  "search agent docs", "look up in memory".
---

Run `memoc search "<query>"` in the current working directory.

## Steps

1. **Get query** from user's message or args. Required — if not provided, ask.

2. **Choose mode**:
   - Default: file names with match counts sorted by relevance + recency
   - With `--snippets` flag: show matching lines with context

3. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd search "<query>" [flags]`
   - macOS/Linux: `.memoc/bin/memoc search "<query>" [flags]`
   - Fallback: `npx @kevin0181/memoc@latest search "<query>" [flags]`

4. **Display results** and offer to open the most relevant file.

## Flags

| Flag | Effect |
|------|--------|
| `--snippets` | Show matching lines instead of file list |
| `--limit N` | Limit results (default 12) |
| `--all` | Show all matches without limit |

## Scope

Searches `.memoc/` directory and agent entry files (CLAUDE.md, AGENTS.md, etc.).
For project source files, use `/memoc-grep` instead.
