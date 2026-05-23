---
name: memoc-activity
description: >
  List recent memoc worklog entries across all actors. Shows who did what and when
  in shared repos. Good for morning standup context or picking up after a break.
  Trigger: /memoc-activity, "show recent activity", "what was done recently",
  "memoc history", "show worklogs", "recent memoc entries".
---

Run `memoc activity` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd activity`
   - macOS/Linux: `.memoc/bin/memoc activity`
   - Fallback: `npx @kevin0181/memoc@latest activity`

2. **Display output** verbatim.

3. **If entries found**: offer to open a specific entry for details.

4. **If no entries**: tell user to run `/memoc-work` to log their first session.

## Typical output

A reverse-chronological list of worklog entries with:
- Timestamp
- Actor name
- Entry title
- File path
