---
name: memoc
description: >
  Follow the full memoc operating protocol for a project: read memory first,
  preserve durable context, use the project-local memoc runtime when available,
  and record important work before handoff. Trigger: /memoc, "use memoc",
  "follow memoc memory", "resume with memoc".
---

Use this skill as the default operating mode for a repository that has, or should have, memoc memory.

## Operating protocol

1. Start by checking whether memoc is installed in the current project.
   - Prefer `.memoc/` plus project-local launchers.
   - If absent and the user wants memory set up, run `/memoc-init` or `memoc init`.

2. Read memory before acting.
   - First run `memoc summary` when available.
   - Then open only the memory files that are relevant to the task, such as `.memoc/session-summary.md`, `.memoc/02-current-project-state.md`, `.memoc/04-handoff.md`, `.memoc/wiki/`, or worklog entries.

3. Keep memory durable and concise.
   - Record decisions, user preferences, active constraints, and handoff notes.
   - Do not store transient command output, obvious code facts, secrets, credentials, or noisy chat history.
   - Prefer wiki notes for reusable knowledge and worklog entries for session activity.

4. Use the right memoc command when useful.
   - `memoc search "<query>"` before broad filesystem search when looking for prior context.
   - `memoc work "<title>"` after meaningful work so future agents know what changed.
   - `memoc note "<title>"` for durable knowledge that should survive sessions.
   - `memoc doctor` when memory looks stale, malformed, too large, or inconsistent.
   - `memoc compress` when memory is noisy or oversized.
   - `memoc upgrade` after updating memoc itself or when runtime/wrapper files are stale.

5. Preserve user work.
   - Treat memory files as collaborative project state.
   - Do not overwrite user-authored notes unless the command is designed to preserve and merge them.
   - Before final handoff, mention any memory updates made and any remaining health issues.

## Binary resolution (all skills use this order)

1. Windows: `.\.memoc\bin\memoc.cmd`
2. macOS/Linux: `.memoc/bin/memoc`
3. Fallback: `npx @kevin0181/memoc@latest`

## Related focused skills

- `/memoc-init` initializes memoc in the current project.
- `/memoc-upgrade` refreshes runtime files while preserving memory.
- `/memoc-search` searches memory and agent docs.
- `/memoc-work` records session activity.
- `/memoc-note` saves durable knowledge.
- `/memoc-doctor` checks memory health.
- `/memoc-compress` compacts noisy memory.
