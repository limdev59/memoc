---
name: memoc-goal
description: >
  Goal-driven execution for coding tasks. Use when work needs clear success
  criteria, tests, reproduction steps, or a verification loop. Trigger:
  /memoc-goal.
license: MIT
---

Source inspiration: `multica-ai/andrej-karpathy-skills`, MIT.

Turn the task into a verifiable goal:

- Define what success looks like before making broad edits.
- For a bug, create or describe the failing repro first, then fix it.
- For validation, test invalid and valid inputs.
- For refactors, verify behavior before and after.
- For multi-step work, pair each step with a check.
- Keep iterating until checks pass, or report the exact blocker.
