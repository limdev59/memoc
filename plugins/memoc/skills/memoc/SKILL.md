---
name: memoc
description: >
  Quick-reference card for all memoc skills and commands. Shows available skills,
  their triggers, and what each does. One-shot display.
  Trigger: /memoc, "memoc help", "what memoc commands", "memoc skills list".
---

## memoc skills

| Skill | Command | What it does |
|-------|---------|-------------|
| `/memoc-init` | `memoc init` | Scaffold agent memory in current project |
| `/memoc-upgrade` | `memoc upgrade` | Upgrade memoc runtime, preserve memory |
| `/memoc-summary` | `memoc summary` | Print status/resume overview |
| `/memoc-compress` | `memoc compress` | Compact memory files, refresh indexes |
| `/memoc-tokens` | `memoc tokens` | Estimate token cost of memory files |
| `/memoc-trim` | `memoc trim-summary` | Archive and compact oversized session-summary |
| `/memoc-work` | `memoc work "<title>"` | Create actor worklog entry |
| `/memoc-note` | `memoc note "<title>"` | Save durable topic/query-result scaffold |
| `/memoc-activity` | `memoc activity` | List recent worklog entries |
| `/memoc-doctor` | `memoc doctor` | Check common memoc health issues |
| `/memoc-search` | `memoc search "<query>"` | Search memory/agent docs |
| `/memoc-ingest` | `memoc ingest <path\|url>` | Create raw/source record for wiki synthesis |
| `/memoc-lint` | `memoc lint-wiki` | Check wiki links, tags, backlinks |
| `/memoc-actor` | `memoc actor [set <name>]` | Show or set the local memoc actor |

## Binary resolution (all skills use this order)

1. Windows: `.\.memoc\bin\memoc.cmd`
2. macOS/Linux: `.memoc/bin/memoc`
3. Fallback: `npx @kevin0181/memoc@latest`

## Install

```bash
npx @kevin0181/memoc init
```
