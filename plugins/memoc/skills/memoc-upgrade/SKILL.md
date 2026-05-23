---
name: memoc-upgrade
description: >
  Upgrade memoc runtime and wrappers in the current project without deleting existing memory.
  Refreshes managed sections based on current project state.
  Trigger: /memoc-upgrade, "upgrade memoc", "update memoc", "refresh memoc runtime".
---

Run `memoc upgrade` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd upgrade`
   - macOS/Linux: `.memoc/bin/memoc upgrade`
   - Fallback: `npx @kevin0181/memoc@latest upgrade`

2. **Run upgrade** and capture output.

3. **Report**:
   - Which files were refreshed vs preserved
   - New memoc version vs previous version (if shown)
   - Any managed sections that were updated

## Key behavior

Upgrade preserves all manually-written memory content. Only memoc-managed sections (marked with `<!-- memoc:managed -->` or equivalent) are updated. User-written content is never overwritten.
