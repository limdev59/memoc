---
name: memoc-lint
description: >
  Check wiki links, tags, backlinks, and Related sections for broken or missing references.
  Validates the memoc wiki knowledge graph integrity.
  Trigger: /memoc-lint, "lint memoc wiki", "check wiki links", "validate memoc",
  "broken links in memory", "memoc wiki health".
---

Run `memoc lint-wiki` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd lint-wiki`
   - macOS/Linux: `.memoc/bin/memoc lint-wiki`
   - Fallback: `npx @kevin0181/memoc@latest lint-wiki`

2. **Display output** verbatim.

3. **For each issue found**, describe the fix:
   - Broken wikilinks → update the link target or create the missing file
   - Missing backlinks → run compress to rebuild indexes
   - Orphaned files → add to index or link from related notes
   - Missing Required fields → edit the file's frontmatter

4. **If clean**: confirm wiki integrity is good.

## What lint checks

- Wikilinks `[[target]]` resolve to existing files
- Tags are consistent across files
- Related sections reference valid files
- Required frontmatter fields present
- Backlink indexes are current
