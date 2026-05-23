---
name: memoc-compress
description: >
  Compact memoc memory files and refresh generated indexes. Removes redundancy,
  trims verbose entries, rebuilds activity and wiki indexes.
  Trigger: /memoc-compress, "compress memoc", "compact memory", "clean up memoc files",
  "memoc files too big".
---

Run `memoc compress` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd compress`
   - macOS/Linux: `.memoc/bin/memoc compress`
   - Fallback: `npx @kevin0181/memoc@latest compress`

2. **Run compress** and capture output.

3. **Report**:
   - Which files were compacted
   - Token/size reduction achieved (if reported)
   - Any indexes rebuilt

## When to use

- `memoc tokens` shows large files (⚠ warnings)
- After extended sessions with many entries
- Before important commits to keep memory lean
- session-summary.md exceeds ~800B
