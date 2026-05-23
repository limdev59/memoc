---
name: memoc-simple
description: >
  Simplicity-first coding. Use when implementing a feature or fix that risks
  overengineering, speculative abstraction, or unnecessary configurability.
  Trigger: /memoc-simple.
license: MIT
---

Source inspiration: `multica-ai/andrej-karpathy-skills`, MIT.

Prefer the smallest solution that genuinely solves the request:

- Do not add features the user did not ask for.
- Do not add abstractions for single-use code.
- Do not add flexibility or configuration just in case.
- Do not add error handling for impossible or irrelevant cases.
- If the implementation feels too large, simplify before continuing.
- Use existing local patterns before introducing new ones.
