---
name: memoc-actor
description: >
  Show or set the local memoc actor identity. Actor names scope worklogs and activity
  entries in shared repos so multiple contributors don't conflict.
  Trigger: /memoc-actor, "set memoc actor", "who is memoc actor", "change memoc identity",
  "memoc set actor name".
---

Run `memoc actor` or `memoc actor set <name>` in the current working directory.

## Steps

### Show current actor
1. Find binary (see below) and run `memoc actor`
2. Display the current actor name

### Set actor
1. Get `<name>` from user's message or args. If not provided, ask: "What name should the memoc actor be set to?"
2. Run `memoc actor set "<name>"`
3. Confirm the actor was updated

## Find binary (priority order)
- Windows: `.\.memoc\bin\memoc.cmd actor [set "<name>"]`
- macOS/Linux: `.memoc/bin/memoc actor [set "<name>"]`
- Fallback: `npx @kevin0181/memoc@latest actor [set "<name>"]`

## What actor does

Actor name is stored in `.memoc/actor` (or equivalent). It is used to:
- Namespace worklog files so multiple contributors don't overwrite each other
- Attribute activity entries in `memoc activity` output
- Support shared repos with parallel AI agent work
