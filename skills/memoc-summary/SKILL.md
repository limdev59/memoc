---
name: memoc-summary
description: >
  Print a compact status/resume overview of the current project's memoc memory.
  Shows status bullets, open tasks, and resume/next-step hints from session-summary.md
  and current-project-state.md.
  Trigger: /memoc-summary, "memoc status", "what's the project status", "resume from memory",
  "where did we leave off", "show memory summary".
---

Run `memoc summary` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd summary`
   - macOS/Linux: `.memoc/bin/memoc summary`
   - Fallback: `npx @kevin0181/memoc@latest summary`

2. **Display output** verbatim to user.

3. **If output is empty** ("No summary bullets yet."): read `.memoc/session-summary.md` directly and present a brief overview of what's there.

## What the output contains

- **Status**: current project state bullets
- **Open Tasks**: in-progress or pending items
- **Resume**: next steps / handoff notes
- **Verified**: recently confirmed working items
