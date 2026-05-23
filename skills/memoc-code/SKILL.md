---
name: memoc-code
description: >
  Coding guardrails adapted from multica-ai/andrej-karpathy-skills. Use when
  writing, fixing, reviewing, or refactoring code: think before coding, keep the
  solution simple, edit surgically, and verify against concrete success criteria.
  Trigger: /memoc-code, "use memoc coding guardrails", "code carefully".
license: MIT
---

Use this skill to reduce common AI coding mistakes: guessing, overbuilding,
unrelated edits, and stopping before the result is verified.

Source inspiration: `multica-ai/andrej-karpathy-skills`, MIT.

## Protocol

1. Think before coding.
   - State assumptions when the request is ambiguous.
   - Ask when uncertainty would change the implementation.
   - Surface tradeoffs instead of silently choosing.

2. Keep it simple.
   - Build only what was requested.
   - Avoid speculative configuration, future-proofing, and one-use abstractions.
   - If the solution feels large for the problem, reduce it.

3. Edit surgically.
   - Touch only files and lines needed for the task.
   - Match the local style.
   - Do not clean up unrelated code; mention it separately.
   - Remove only dead code created by your own changes.

4. Make success verifiable.
   - Turn the request into observable checks.
   - For bugs, prefer a reproducing test or concrete repro before the fix.
   - For refactors, verify behavior before and after.
   - Keep looping until the check passes or the blocker is clear.

## Shortcuts

- `/memoc-think` for ambiguity, assumptions, and tradeoffs.
- `/memoc-simple` for reducing overbuilt designs.
- `/memoc-scope` for tight, minimal diffs.
- `/memoc-goal` for tests, repros, and verification loops.
