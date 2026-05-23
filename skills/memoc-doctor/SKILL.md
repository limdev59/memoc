---
name: memoc-doctor
description: >
  Check common memoc health issues: broken links, missing files, malformed frontmatter,
  oversized summaries, stale content. Diagnose and suggest fixes.
  Trigger: /memoc-doctor, "memoc health check", "check memoc", "diagnose memoc",
  "is memoc healthy", "memoc issues".
---

Run `memoc doctor` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd doctor`
   - macOS/Linux: `.memoc/bin/memoc doctor`
   - Fallback: `npx @kevin0181/memoc@latest doctor`

2. **Display output** verbatim.

3. **For each issue found**, offer to fix it:
   - Oversized summary → `/memoc-trim`
   - Broken wiki links → `/memoc-lint`
   - Large files → `/memoc-compress`
   - Missing wrapper → run `memoc upgrade`

4. **If no issues**: confirm memoc is healthy.

## What doctor checks

- `.memoc/` directory exists and is valid
- session-summary.md size is within budget
- Agent entry files (CLAUDE.md etc.) are present
- Project-local wrapper scripts are functional
- Frontmatter validity on memory files
