---
name: memoc-tokens
description: >
  Estimate token cost of current memoc memory files. Shows startup (always loaded) vs
  on-demand files with per-file breakdown and warnings for large files.
  Trigger: /memoc-tokens, "memoc token count", "how big is memoc memory", "memory token usage",
  "check memory size".
---

Run `memoc tokens` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd tokens`
   - macOS/Linux: `.memoc/bin/memoc tokens`
   - Fallback: `npx @kevin0181/memoc@latest tokens`

2. **Display output** verbatim.

3. **If warnings present** (⚠ symbols):
   - For large startup files: suggest `/memoc-trim` or `/memoc-compress`
   - For large on-demand files: suggest `/memoc-compress`

## Output structure

```
Startup (always loaded):
  CLAUDE.md                     NNN tokens  (NNNbB)
  session-summary.md            NNN tokens  (NNNB)  ⚠ large
  ── startup total              NNN tokens

On-demand (read when needed):
  02-current-project-state.md  NNN tokens  (NNNB)
  ...
  ── on-demand total            NNN tokens

If all loaded: ~NNN tokens
```
