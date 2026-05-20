# memoc

> AI agents forget everything when a session ends. memoc gives them a structured memory system so they can pick up exactly where they left off — without you repeating yourself.

Scaffolds a Markdown-based project memory into any codebase. Works with Claude Code, Codex, Cursor, Windsurf, GitHub Copilot, and Gemini CLI.

## Quick Start

```bash
npx @kevin0181/memoc init

# Upgrade memoc in this project without deleting existing memory
npx @kevin0181/memoc@latest upgrade
```

Run inside your project directory. Detects your stack automatically and generates everything agents need.

`init` also creates project-local PATH helpers so agents can keep using memoc even when the global/npm bin is not on PATH.

```bash
# PowerShell
. .\.memoc\env.ps1

# sh/bash
. ./.memoc/env.sh
```

Agents are instructed to use the project-local wrapper if PATH fails:

```bash
# Windows
.\.memoc\bin\memoc.cmd summary

# macOS / Linux
.memoc/bin/memoc summary
```

---

## Ask An Agent To Install

If you are giving this repo or npm package to an AI coding agent, use a prompt like:

```text
Install memoc in this project and run init.
Use the npm package only. Run `npx @kevin0181/memoc@latest init`
from this project's root. Do not clone the GitHub repository into this project.
If npm/npx is missing, stop and ask the user to install Node.js LTS with npm first.
After init, verify with the project-local wrapper:
Windows: .\.memoc\bin\memoc.cmd summary
macOS/Linux: .memoc/bin/memoc summary
```

Agent install checklist:

1. Run `node --version` and `npm --version`. If either fails, ask the user to install Node.js LTS with npm first.
2. Run `npx @kevin0181/memoc@latest init` from the target project root.
3. Do not clone this GitHub repository into the target project. Do not download the repo ZIP as an installer.
4. `.claude/settings.json` is intentionally generated for the Claude Code Stop hook; keep or commit it only if the project wants that hook.
5. After init, do not depend on global PATH. Use the project-local wrapper when needed:
   - Windows: `.\.memoc\bin\memoc.cmd <command>`
   - macOS/Linux: `.memoc/bin/memoc <command>`

If `node --version` or `npm --version` fails, memoc cannot be installed yet. Install Node.js LTS with npm first, then repeat the steps above.

---

## The Problem

Every new AI session starts cold. You re-explain the project, the decisions already made, what's done and what isn't. The agent rediscovers what the last one figured out.

memoc installs a memory structure that agents read at session start, update as they work, and hand off to the next session — automatically.

---

## Commands

```bash
# First-time setup — scaffold memory, detect stack, install Claude Code hook
npx @kevin0181/memoc init

# Re-scan project and refresh managed sections
npx @kevin0181/memoc update

# Print current status in ~10 lines
npx @kevin0181/memoc summary

# Search memory/agent docs first (token-efficient)
npx @kevin0181/memoc search "auth"
npx @kevin0181/memoc search "auth" --snippets --limit 5

# Search project source/text files only when memory is not enough
npx @kevin0181/memoc grep "GetParticles"
npx @kevin0181/memoc grep "GetParticles" --snippets --limit 5

# Estimate token cost of current memory files
npx @kevin0181/memoc tokens

# Archive old log entries to keep log.md small
npx @kevin0181/memoc compress

# Add the same protocol to another agent's entry file
npx @kevin0181/memoc add cursor
npx @kevin0181/memoc add windsurf
npx @kevin0181/memoc add copilot
npx @kevin0181/memoc add gemini
```

---

## Upgrade Existing Projects

memoc never auto-updates itself. Upgrade only when you choose to run:

```bash
npx @kevin0181/memoc@latest upgrade
```

Run it from the project root. It preserves existing project memory, including:

- `.memoc/session-summary.md`
- `.memoc/02-current-project-state.md` human-written sections
- `.memoc/03-decisions.md`
- `.memoc/04-handoff.md`
- `.memoc/06-project-rules.md`
- `.memoc/log.md`
- `.memoc/systems/`
- `.memoc/wiki/`

It refreshes the managed blocks, project-local wrappers, runtime copy, PATH helpers, and missing template files. If `memoc` is not on PATH after upgrading, keep using:

```bash
# Windows
.\.memoc\bin\memoc.cmd summary

# macOS / Linux
.memoc/bin/memoc summary
```

---

## What Gets Created

```
CLAUDE.md                                    ← Claude Code entry point (auto-loaded)
AGENTS.md                                    ← Codex entry point (auto-loaded)
llms.txt                                     ← LLM-facing project map
.claude/settings.json                        ← Claude Code Stop hook

.memoc/
  bin/memoc                                  ← project-local wrapper for PATH fallback
  env.ps1 · env.sh                           ← shell helpers that prepend .memoc/bin to PATH
  session-summary.md                         ← Only required startup read (~150 tokens)
  02-current-project-state.md               ← Status, open tasks, commands
  03-decisions.md                            ← Durable decision log
  04-handoff.md                              ← Resume context, verified/unverified
  06-project-rules.md                        ← User preferences
  log.md                                     ← Append-only activity log
  systems/                                   ← Subsystem docs
  wiki/                                      ← Synthesized knowledge base

skills/project-memory-maintainer/SKILL.md   ← Wiki & systems operations guide
```

---

## How Agents Use It

Every entry file (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, etc.) gets the same protocol injected as a managed block:

```
## Session Start
- [ ] Read `.memoc/session-summary.md`
- [ ] `.pending` exists? → review changed files → update memory if needed → delete it

## Before Opening More Files
- [ ] Run `memoc search "<query>"` first
- [ ] Open on demand: `02` status · `04` resume · `06` rules · `llms.txt` map
- [ ] Keep output small: `summary`, `search --limit`, `search --snippets`

## Before Finishing _(update only applicable files; skip Q&A / throwaway exploration)_
- [ ] Code/config/deps changed → `02` (version, commands list, Last synced) + `session-summary.md` (status, changed, open tasks)
- [ ] Decision made → `03-decisions.md` (what & why) + `02`
- [ ] Work incomplete or risky → `04-handoff.md` (verified commands, unverified items, next steps)
- [ ] Rule/preference set → `06-project-rules.md`
- [ ] Wiki/systems work → read `skills/project-memory-maintainer/SKILL.md`
```

The checklist tells agents exactly when to update, which file to update, and what to record — so nothing gets missed.

---

## Token Efficiency

Startup cost is kept minimal by design.

| What loads | Tokens |
|---|---|
| `CLAUDE.md` (managed block only) | ~280 |
| `session-summary.md` (only required read) | ~150 |
| **Total startup** | **~430** |

Everything else is on-demand. Use `memoc tokens` to see the live breakdown for your project.

---

## Claude Code Auto-Detection

`init` installs a lightweight `Stop` hook in `.claude/settings.json`. After each Claude Code response it checks:

```bash
git status --porcelain
```

If uncommitted changes exist, it writes `.memoc/.pending` with a timestamp and the changed filenames. At the next session start, Claude reads `.pending` and decides whether to update memory — then deletes the file.

No extra setup. Add `.memoc/.pending` to `.gitignore` to keep it untracked.

---

## Multi-Agent Support

`init` creates `CLAUDE.md` (Claude Code) and `AGENTS.md` (Codex) by default. All agents follow the same 3-phase checklist protocol.

Add more agents on demand:

| Command | Creates |
|---|---|
| `add cursor` | `.cursorrules` |
| `add windsurf` | `.windsurfrules` |
| `add copilot` | `.github/copilot-instructions.md` |
| `add gemini` | `GEMINI.md` |

Running `update` refreshes managed blocks in all existing agent files.

---

## Supported Stacks

Auto-detected from your project files:

Node.js · Next.js · React · Vue · Svelte · Angular · Nuxt · Astro · Express · Fastify · Hono · Electron · Tauri · TypeScript · Prisma · Drizzle · Supabase · Python · FastAPI · Django · Flask · PyTorch · Rust · Go · C++ / CMake · .NET · Java · Flutter · Unreal Engine

---

## How It Works

- **New project** — scaffolds all memory files with sensible defaults.
- **Existing project** — detects your stack and fills in real project info (name, scripts, config files).
- **Already initialized** — `init` injects the managed block without touching your existing content. `update` re-scans and refreshes project-specific sections.
- **Long-running projects** — run `compress` to archive old `log.md` entries when the file grows large.

---

## License

MIT
