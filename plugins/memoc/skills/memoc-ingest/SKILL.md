---
name: memoc-ingest
description: >
  Create a raw/source record scaffold for wiki synthesis from a file path or URL.
  Stages external content for later synthesis into the knowledge wiki.
  Trigger: /memoc-ingest, "ingest into memoc", "add source to wiki", "ingest URL",
  "add reference to knowledge base", "import content into memoc".
---

Run `memoc ingest <path|url>` in the current working directory.

## Steps

1. **Get source** (file path or URL) from user's message or args. If not provided, ask.

2. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd ingest "<source>"`
   - macOS/Linux: `.memoc/bin/memoc ingest "<source>"`
   - Fallback: `npx @kevin0181/memoc@latest ingest "<source>"`

3. **Run ingest** and report the created scaffold file path.

4. **Optionally**: help populate the scaffold with a summary of the source content if it's accessible.

## What ingest creates

A structured Markdown scaffold in `.memoc/wiki/` (or equivalent) containing:
- Source metadata (URL, path, date ingested)
- Raw content placeholder or extracted text
- Tags and frontmatter for searchability
- Links section for cross-referencing

The scaffold is designed to be synthesized/summarized by an agent into the knowledge wiki.
