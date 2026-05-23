---
name: memoc-trim
description: >
  Archive and compact oversized session-summary.md. Moves stale history to worklog,
  keeps only recent/relevant bullets in the summary.
  Trigger: /memoc-trim, "trim memoc summary", "session summary too big", "archive old memory",
  "compact session summary".
---

Run `memoc trim-summary` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd trim-summary`
   - macOS/Linux: `.memoc/bin/memoc trim-summary`
   - Fallback: `npx @kevin0181/memoc@latest trim-summary`

2. **Run trim-summary** and capture output.

3. **Report**:
   - Size before and after (if shown)
   - What was archived (moved to worklog)
   - What was preserved

## When to use

- `memoc tokens` warns: "session-summary.md is NNNb — recommended <800B"
- Summary feels stale with old completed work
- Starting a new major phase of work
