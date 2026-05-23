---
name: memoc-work
description: >
  Create a conflict-light actor worklog entry for the current work session.
  Records what was done, by whom, and when — for shared repos with multiple actors.
  Trigger: /memoc-work, "log work", "create worklog", "record what I did",
  "add work entry", "memoc log session".
---

Run `memoc work "<title>"` in the current working directory.

## Steps

1. **Get title** from user's message or args. If not provided, ask: "Brief title for this work entry?"

2. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd work "<title>"`
   - macOS/Linux: `.memoc/bin/memoc work "<title>"`
   - Fallback: `npx @kevin0181/memoc@latest work "<title>"`

3. **Run command** and report the created file path.

4. **Open the file** and help user fill in the work details:
   - What was done
   - Files changed
   - Decisions made
   - Next steps

## Entry format

Worklog entries are Markdown scaffolds stored per-actor to avoid merge conflicts in shared repos. Each entry is timestamped and attributed to the current actor (`memoc actor` to check/set).
