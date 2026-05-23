---
name: memoc-init
description: >
  Initialize memoc in the current project. Scaffolds agent memory files, detects stack,
  generates CLAUDE.md/AGENTS.md and .memoc/ directory.
  Trigger: /memoc-init, "initialize memoc", "setup memoc memory", "scaffold memoc",
  "install memoc in this project".
---

Run `memoc init` in the current working directory.

## Steps

1. **Find binary** (priority order):
   - Windows: `.\.memoc\bin\memoc.cmd init`
   - macOS/Linux: `.memoc/bin/memoc init`
   - Fallback: `npx @kevin0181/memoc@latest init`

2. **Run init** and capture output.

3. **Report** what was created:
   - Which agent entry files were generated (CLAUDE.md, AGENTS.md, GEMINI.md, etc.)
   - Whether `.memoc/` directory was created or updated
   - Any stack detection results

4. **If already initialized**: init auto-updates managed sections. Report what changed.

5. **If Node.js missing**: stop and tell user to install Node.js LTS with npm first.

## After init

Remind user to source the PATH helper so the project-local wrapper is available:
- PowerShell: `. .\.memoc\env.ps1`
- bash/zsh: `. .memoc/env.sh`
