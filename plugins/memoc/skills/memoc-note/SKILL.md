---
name: memoc-note
description: >
  Save a durable topic/query-result scaffold for knowledge that should persist across sessions.
  Creates a structured note in the memoc wiki for later reference by agents.
  Trigger: /memoc-note, "save a note", "create memoc note", "remember this topic",
  "add to knowledge base", "save research result".
---

Run `memoc note "<title>"` in the current working directory.

## Steps

1. **Get title** from user's message or args. If not provided, ask: "Topic or title for this note?"

2. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd note "<title>"`
   - macOS/Linux: `.memoc/bin/memoc note "<title>"`
   - Fallback: `npx @kevin0181/memoc@latest note "<title>"`

3. **Run command** and report the created file path.

4. **Help populate** the note with content from the current conversation if relevant:
   - Key findings or decisions
   - Code patterns or solutions
   - External references
   - Related topics

## Use cases

- Saving research findings for future sessions
- Documenting architectural decisions not obvious from code
- Recording API quirks, gotchas, or workarounds
- Building a queryable knowledge base with `memoc search`
