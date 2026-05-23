---
name: memoc-scope
description: >
  Surgical-change discipline. Use when editing an existing codebase and the
  important thing is to avoid drive-by refactors, unrelated formatting churn, or
  accidental behavior changes. Trigger: /memoc-scope.
license: MIT
---

Source inspiration: `multica-ai/andrej-karpathy-skills`, MIT.

Keep the diff tight:

- Touch only what the user request requires.
- Match existing style even when you would design it differently.
- Do not rewrite adjacent comments, formatting, or APIs for taste.
- Do not delete unrelated dead code; mention it separately.
- Remove imports, variables, and helpers only when your own change made them unused.
- Every changed line should trace back to the requested outcome.
