#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const VERSION = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version; }
  catch { return 'unknown'; }
})();

// ═══════════════════════════════════════════════════════════════════
// SCANNER — detects project type from filesystem
// ═══════════════════════════════════════════════════════════════════

function scanProject(dir, depth = 0) {
  const info = {
    name:        path.basename(dir),
    root:        dir,
    stack:       [],
    scripts:     {},
    configFiles: [],
    srcDirs:     [],
    isEmpty:     true,
  };

  let entries = [];
  try { entries = fs.readdirSync(dir); } catch { return info; }

  const IGNORE = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', 'out',
    'Saved', 'Intermediate', 'DerivedDataCache', 'Binaries',
    '.memoc', 'skills', '.DS_Store', '.obsidian',
    'CLAUDE.md', 'AGENTS.md', 'llms.txt',
  ]);

  info.srcDirs = entries.filter(e => {
    try { return !IGNORE.has(e) && fs.statSync(path.join(dir, e)).isDirectory(); }
    catch { return false; }
  });

  const KNOWN_CONFIGS = [
    'package.json', 'tsconfig.json', 'jsconfig.json',
    'next.config.js', 'next.config.ts', 'next.config.mjs',
    'vite.config.js', 'vite.config.ts',
    'tailwind.config.js', 'tailwind.config.ts',
    'webpack.config.js', 'astro.config.mjs',
    'svelte.config.js', 'nuxt.config.ts',
    '.env', '.env.example', '.env.local',
    'Makefile', 'CMakeLists.txt',
    'Dockerfile', 'docker-compose.yml', 'compose.yml',
    'pyproject.toml', 'requirements.txt', 'setup.py', 'setup.cfg',
    'Cargo.toml', 'go.mod',
    'pom.xml', 'build.gradle', 'build.gradle.kts',
    'pubspec.yaml',
  ];
  info.configFiles = entries.filter(e => KNOWN_CONFIGS.includes(e));

  // ── Node.js
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    info.isEmpty = false;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) info.name = pkg.name;
      info.stack.push('Node.js');
      if (pkg.scripts) info.scripts = pkg.scripts;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next'])                        info.stack.push('Next.js');
      else if (deps['react'])                  info.stack.push('React');
      if (deps['vue'])                         info.stack.push('Vue');
      if (deps['svelte'])                      info.stack.push('Svelte');
      if (deps['@angular/core'])               info.stack.push('Angular');
      if (deps['nuxt'])                        info.stack.push('Nuxt');
      if (deps['astro'])                       info.stack.push('Astro');
      if (deps['express'])                     info.stack.push('Express');
      if (deps['fastify'])                     info.stack.push('Fastify');
      if (deps['hono'])                        info.stack.push('Hono');
      if (deps['electron'])                    info.stack.push('Electron');
      if (deps['typescript'] || deps['ts-node']) info.stack.push('TypeScript');
      if (deps['prisma'] || deps['@prisma/client']) info.stack.push('Prisma');
      if (deps['drizzle-orm'])                 info.stack.push('Drizzle');
      if (deps['@supabase/supabase-js'])       info.stack.push('Supabase');
      if (deps['@tauri-apps/api'])             info.stack.push('Tauri');
    } catch {}
  }

  // ── Unreal Engine
  const uproject = entries.find(e => e.endsWith('.uproject'));
  if (uproject) {
    info.isEmpty = false;
    info.name = uproject.replace('.uproject', '');
    info.stack.push('Unreal Engine');
  }

  // ── Python
  if (['requirements.txt', 'pyproject.toml', 'setup.py'].some(f => fs.existsSync(path.join(dir, f)))) {
    info.isEmpty = false;
    info.stack.push('Python');
    try {
      const req = fs.existsSync(path.join(dir, 'requirements.txt'))
        ? fs.readFileSync(path.join(dir, 'requirements.txt'), 'utf8') : '';
      if (/fastapi/i.test(req))         info.stack.push('FastAPI');
      else if (/django/i.test(req))     info.stack.push('Django');
      else if (/flask/i.test(req))      info.stack.push('Flask');
      if (/torch|pytorch/i.test(req))   info.stack.push('PyTorch');
    } catch {}
  }

  // ── Rust
  if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
    info.isEmpty = false;
    info.stack.push('Rust');
  }

  // ── Go
  if (fs.existsSync(path.join(dir, 'go.mod'))) {
    info.isEmpty = false;
    info.stack.push('Go');
  }

  // ── C++ / CMake
  if (fs.existsSync(path.join(dir, 'CMakeLists.txt'))) {
    info.isEmpty = false;
    info.stack.push('C++ / CMake');
  }

  // ── .NET
  if (entries.some(e => e.endsWith('.csproj') || e.endsWith('.sln'))) {
    info.isEmpty = false;
    info.stack.push('.NET');
  }

  // ── Java
  if (fs.existsSync(path.join(dir, 'pom.xml')) || fs.existsSync(path.join(dir, 'build.gradle'))) {
    info.isEmpty = false;
    info.stack.push('Java');
  }

  // ── Flutter / Dart
  if (fs.existsSync(path.join(dir, 'pubspec.yaml'))) {
    info.isEmpty = false;
    info.stack.push('Flutter');
  }

  // ── Monorepo: scan 1 level deep inside common workspace roots
  if (depth === 0) {
    for (const monoRoot of ['packages', 'apps', 'services', 'libs']) {
      const monoPath = path.join(dir, monoRoot);
      if (!fs.existsSync(monoPath)) continue;
      try {
        for (const sub of fs.readdirSync(monoPath)) {
          try {
            const subPath = path.join(monoPath, sub);
            if (!fs.statSync(subPath).isDirectory()) continue;
            const subInfo = scanProject(subPath, 1);
            if (!subInfo.isEmpty) info.isEmpty = false;
            for (const s of subInfo.stack) {
              if (!info.stack.includes(s)) info.stack.push(s);
            }
          } catch {}
        }
      } catch {}
    }
  }

  return info;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

function nowISO() { return new Date().toISOString().slice(0, 19); }

function stackStr(stack) { return stack.length ? stack.join(', ') : 'Not detected'; }

function listMd(arr, empty = '_None detected._') {
  return arr.length ? arr.map(x => `- \`${x}\``).join('\n') : empty;
}

function scriptsMd(scripts) {
  const pairs = Object.entries(scripts);
  return pairs.length
    ? pairs.map(([k, v]) => `- \`${k}\`: \`${v}\``).join('\n')
    : '_None detected._';
}

function hideOnWindows(dirPath) {
  if (process.platform === 'win32') {
    try { require('child_process').execSync(`attrib +h "${dirPath}"`, { stdio: 'ignore' }); } catch {}
  }
}

function chmodExecutable(filePath) {
  try { fs.chmodSync(filePath, 0o755); } catch {}
}

function ensure(filePath, content) {
  if (fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function tplMemocCmdWrapper() {
  return `@echo off\r\nnpx @kevin0181/memoc %*\r\n`;
}

function tplMemocPs1Wrapper() {
  return `npx @kevin0181/memoc @args\nexit $LASTEXITCODE\n`;
}

function tplMemocShWrapper() {
  return `#!/bin/sh\nexec npx @kevin0181/memoc "$@"\n`;
}

function defaultUserBinDir() {
  if (process.env.MEMOC_USER_BIN_DIR) return process.env.MEMOC_USER_BIN_DIR;
  if (currentPlatform() === 'win32') {
    return path.join(process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || process.cwd(), 'AppData', 'Local'), 'memoc', 'bin');
  }
  return path.join(process.env.HOME || process.cwd(), '.local', 'bin');
}

function tplEnvPs1() {
  return `$memocBin = Join-Path $PSScriptRoot 'bin'\n$parts = $env:PATH -split [IO.Path]::PathSeparator\nif ($parts -notcontains $memocBin) {\n  $env:PATH = \"$memocBin$([IO.Path]::PathSeparator)$env:PATH\"\n}\n`;
}

function tplEnvSh() {
  return `# Source this from the project root to put the local memoc wrapper first in PATH.\nMEMOC_DIR="$(pwd)/.memoc"\ncase ":$PATH:" in\n  *":$MEMOC_DIR/bin:"*) ;;\n  *) PATH="$MEMOC_DIR/bin:$PATH"; export PATH ;;\nesac\n`;
}

function ensurePathHelpers(dir, mark) {
  const files = [
    [path.join(dir, '.memoc', 'bin', 'memoc.cmd'), tplMemocCmdWrapper, false],
    [path.join(dir, '.memoc', 'bin', 'memoc.ps1'), tplMemocPs1Wrapper, false],
    [path.join(dir, '.memoc', 'bin', 'memoc'), tplMemocShWrapper, true],
    [path.join(dir, '.memoc', 'env.ps1'), tplEnvPs1, false],
    [path.join(dir, '.memoc', 'env.sh'), tplEnvSh, true],
  ];

  for (const [fp, tpl, executable] of files) {
    const rel = path.relative(dir, fp);
    const added = ensure(fp, tpl());
    if (executable) chmodExecutable(fp);
    mark(added ? 'add' : 'skip', rel);
  }
}

function ensureUserLauncher(mark) {
  const userBin = defaultUserBinDir();
  writeLaunchers(userBin, mark, 'user bin');
  return userBin;
}

function writeLaunchers(binDir, mark, label) {
  const files = [
    [path.join(binDir, 'memoc.cmd'), tplMemocCmdWrapper, false],
    [path.join(binDir, 'memoc.ps1'), tplMemocPs1Wrapper, false],
    [path.join(binDir, 'memoc'), tplMemocShWrapper, true],
  ];

  for (const [fp, tpl, executable] of files) {
    const added = ensure(fp, tpl());
    if (executable) chmodExecutable(fp);
    mark(added ? 'add' : 'skip', `${label} ${path.basename(fp)}`);
  }
}

function ensurePathRegistration(dir, mark) {
  ensureCurrentPathLauncher(mark);
  const binDir = ensureUserLauncher(mark);
  const pathSep = path.delimiter;

  if ((process.env.PATH || '').split(pathSep).some(p => samePath(p, binDir))) {
    mark('skip', 'PATH (user memoc bin already active)');
    return;
  }

  process.env.PATH = `${binDir}${pathSep}${process.env.PATH || ''}`;

  if (process.env.MEMOC_SKIP_PATH_REGISTER === '1') {
    mark('skip', 'PATH registration (test mode)');
    return;
  }

  if (currentPlatform() !== 'win32') {
    const updated = ensureUnixPathRegistration(binDir);
    mark(updated ? 'update' : 'skip', `${currentPlatform()} PATH (${userPathShellHint(binDir)})`);
    return;
  }

  try {
    const current = require('child_process')
      .execFileSync('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command',
        "[Environment]::GetEnvironmentVariable('Path','User')",
      ], { encoding: 'utf8' })
      .trim();
    const parts = current.split(pathSep).filter(Boolean);
    if (parts.some(p => samePath(p, binDir))) {
      mark('skip', 'User PATH (memoc bin already registered)');
      return;
    }
    const nextPath = [binDir, ...parts].join(pathSep);
    require('child_process').execFileSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `[Environment]::SetEnvironmentVariable('Path', ${JSON.stringify(nextPath)}, 'User')`,
    ], { stdio: 'ignore' });
    mark('update', 'User PATH (memoc bin added; open a new terminal if needed)');
  } catch {
    mark('skip', 'User PATH registration failed (use . .\\.memoc\\env.ps1)');
  }
}

function ensureCurrentPathLauncher(mark) {
  const target = findWritablePathDir();
  if (!target) {
    mark('skip', 'active PATH launcher (no writable PATH directory found)');
    return false;
  }
  writeLaunchers(target, mark, 'active PATH');
  return true;
}

function findWritablePathDir() {
  const dirs = [...new Set((process.env.PATH || '').split(path.delimiter).filter(Boolean))];
  const npmBin = npmGlobalBinDir();
  const ranked = dirs
    .filter(d => !isVolatilePathDir(d))
    .filter(d => {
      try { return fs.existsSync(d) && fs.statSync(d).isDirectory() && canWriteDir(d); }
      catch { return false; }
    })
    .sort((a, b) => pathRank(a, npmBin) - pathRank(b, npmBin));
  return ranked[0] || null;
}

function pathRank(dir, npmBin) {
  if (npmBin && samePath(dir, npmBin)) return 0;
  const lower = dir.toLowerCase();
  for (const root of userWritableRoots()) {
    if (root && lower.startsWith(root.toLowerCase())) return 1;
  }
  return 5;
}

function userWritableRoots() {
  return [
    process.env.APPDATA,
    process.env.LOCALAPPDATA,
    process.env.HOME,
    process.env.USERPROFILE,
  ].filter(Boolean).map(p => path.resolve(p));
}

function npmGlobalBinDir() {
  try {
    const prefix = require('child_process').execFileSync('npm', ['config', 'get', 'prefix'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!prefix) return null;
    return currentPlatform() === 'win32' ? prefix : path.join(prefix, 'bin');
  } catch {
    return null;
  }
}

function isVolatilePathDir(dir) {
  const lower = dir.toLowerCase();
  return lower.includes(`${path.sep}_npx${path.sep}`) ||
    lower.includes(`${path.sep}node_modules${path.sep}.bin`) ||
    lower.includes(`${path.sep}npm-cache${path.sep}_npx${path.sep}`);
}

function canWriteDir(dir) {
  const probe = path.join(dir, `.memoc-write-test-${process.pid}-${Date.now()}`);
  try {
    fs.writeFileSync(probe, '');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function ensureUnixPathRegistration(binDir) {
  if (process.env.MEMOC_SKIP_PATH_REGISTER === '1') return false;

  const home = process.env.HOME;
  if (!home) return false;

  const block = [
    '# memoc PATH',
    `MEMOC_BIN=${shellSingleQuote(binDir)}`,
    'case ":$PATH:" in *":$MEMOC_BIN:"*) ;; *) PATH="$MEMOC_BIN:$PATH"; export PATH ;; esac',
    '# end memoc PATH',
  ].join('\n');

  const candidates = [
    path.join(home, '.profile'),
    path.join(home, '.zshrc'),
    path.join(home, '.bashrc'),
  ];

  let changed = false;
  for (const fp of candidates) {
    try {
      const src = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
      if (src.includes(binDir) || src.includes('# memoc PATH')) continue;
      fs.appendFileSync(fp, `${src.endsWith('\n') || !src ? '' : '\n'}\n${block}\n`, 'utf8');
      changed = true;
    } catch {}
  }
  return changed;
}

function userPathShellHint(binDir) {
  return `user bin ${binDir} ${process.env.MEMOC_SKIP_PATH_REGISTER === '1' ? 'test mode' : 'registered; open a new terminal if needed'}`;
}

function currentPlatform() {
  return process.env.MEMOC_PLATFORM || process.platform;
}

function shellSingleQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function samePath(a, b) {
  if (!a || !b) return false;
  const norm = p => path.resolve(p).toLowerCase().replace(/[\\/]+$/, '');
  try { return norm(a) === norm(b); } catch { return false; }
}

function updateSection(filePath, startMark, endMark, inner) {
  if (!fs.existsSync(filePath)) return false;
  const src = fs.readFileSync(filePath, 'utf8');
  const s = src.indexOf(startMark);
  const e = src.indexOf(endMark);
  if (s === -1 || e === -1) return false;
  write(filePath,
    src.slice(0, s) + startMark + '\n' + inner + '\n' + endMark + src.slice(e + endMark.length)
  );
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION MARKERS
// ═══════════════════════════════════════════════════════════════════

const mk = n => [`<!-- context-forge:${n}:start -->`, `<!-- context-forge:${n}:end -->`];
const [MGMT_S,  MGMT_E]  = mk('managed');
const [ID_S,    ID_E]    = mk('identity');
const [SNAP_S,  SNAP_E]  = mk('snapshot');
const [CORE_S,  CORE_E]  = mk('core');
const [HDR_S,   HDR_E]   = mk('header');
const [SYS_S,   SYS_E]   = mk('systems');
const [WIKI_S,  WIKI_E]  = mk('wiki');

// ═══════════════════════════════════════════════════════════════════
// AGENT REGISTRY — third-party agent entry files (added via `add`)
// ═══════════════════════════════════════════════════════════════════

const AGENT_REGISTRY = {
  cursor:   { file: '.cursorrules',                    label: 'Cursor'         },
  windsurf: { file: '.windsurfrules',                  label: 'Windsurf'       },
  copilot:  { file: '.github/copilot-instructions.md', label: 'GitHub Copilot' },
  gemini:   { file: 'GEMINI.md',                       label: 'Gemini CLI'     },
};

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC CONTENT (re-generated on update)
// ═══════════════════════════════════════════════════════════════════

function managedBlock() {
  return `${MGMT_S}
## Session Start
- [ ] Read \`.memoc/session-summary.md\`
- [ ] \`.pending\` exists? → review changed files → update memory if needed → delete it
- [ ] If \`memoc\` is not found in an existing shell, open a new terminal or load the local helper: PowerShell \`. .\\.memoc\\env.ps1\`; sh \`. ./.memoc/env.sh\`

## Before Opening More Files
- [ ] Run memoc commands in this order: \`memoc search "<query>"\` → \`.\\.memoc\\bin\\memoc.cmd search "<query>"\` (Windows) or \`.memoc/bin/memoc search "<query>"\` (sh) → \`npx @kevin0181/memoc search "<query>"\`
- [ ] Open on demand: \`02\` status · \`04\` resume · \`06\` rules · \`llms.txt\` map
- [ ] Keep output small: \`summary\`, \`search --limit\`, \`search --snippets\`

## Before Finishing _(update only applicable files; skip Q&A / throwaway exploration)_
- [ ] Code/config/deps changed → \`02\` (version, commands list, Last synced) + \`session-summary.md\` (status, changed, open tasks)
- [ ] Decision made → \`03-decisions.md\` (what & why) + \`02\`
- [ ] Work incomplete or risky → \`04-handoff.md\` (verified commands, unverified items, next steps)
- [ ] Rule/preference set → \`06-project-rules.md\`
- [ ] Wiki/systems work → read \`skills/project-memory-maintainer/SKILL.md\`
${MGMT_E}`;
}

function identityInner(p) {
  return [
    `- Project name: \`${p.name}\``,
    `- Detected stack: ${stackStr(p.stack)}`,
  ].join('\n');
}

function snapshotInner(p) {
  const lines = [
    `- Last synced: ${nowISO()}`,
    `- Detected stack: ${stackStr(p.stack)}`,
  ];
  if (p.configFiles.length)
    lines.push(`\n### Config Files\n\n${listMd(p.configFiles)}`);
  if (p.srcDirs.length)
    lines.push(`\n### Source Directories\n\n${listMd(p.srcDirs)}`);
  const sc = scriptsMd(p.scripts);
  if (sc !== '_None detected._')
    lines.push(`\n### Package Scripts\n\n${sc}`);
  return lines.join('\n');
}

function coreLlmsInner() {
  return `- [Session Summary](.memoc/session-summary.md): only required startup read.
- [Current State](.memoc/02-current-project-state.md): status, tasks, commands.
- [Handoff](.memoc/04-handoff.md): resume context, blockers, verification.
- [Rules](.memoc/06-project-rules.md): durable preferences.
- [Agent Index](.memoc/00-agent-index.md): compact file map.
- [Project Brief](.memoc/00-project-brief.md): short identity and direction.
- [Workflow](.memoc/01-agent-workflow.md): update trigger matrix.
- [Decisions](.memoc/03-decisions.md): durable decisions.
- [Log](.memoc/log.md): append-only history.
- [Systems](.memoc/systems/README.md): subsystem docs.
- [Wiki](.memoc/wiki/index.md): synthesized knowledge.`;
}

function headerInner(p) {
  return `# ${p.name}\n\n> LLM-facing project map for this project.`;
}

function systemsLlmsInner(dir) {
  const systemsDir = path.join(dir, '.memoc', 'systems');
  if (!fs.existsSync(systemsDir)) return '_None yet._';
  const files = fs.readdirSync(systemsDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();
  if (!files.length) return '_None yet._';
  return files.map(f => `- [${f.replace('.md', '')}](.memoc/systems/${f}): subsystem context.`).join('\n');
}

function wikiLlmsInner(dir) {
  const wikiDir = path.join(dir, '.memoc', 'wiki');
  if (!fs.existsSync(wikiDir)) return '_None yet._';
  const lines = [];
  const SKIP = new Set(['index.md']);
  try {
    for (const f of fs.readdirSync(wikiDir).sort()) {
      if (!f.endsWith('.md') || SKIP.has(f)) continue;
      try { if (fs.statSync(path.join(wikiDir, f)).isDirectory()) continue; } catch { continue; }
      lines.push(`- [${f.replace('.md', '')}](.memoc/wiki/${f}): wiki page.`);
    }
    for (const sub of ['sources', 'topics', 'global']) {
      const subDir = path.join(wikiDir, sub);
      if (!fs.existsSync(subDir)) continue;
      for (const f of fs.readdirSync(subDir).sort()) {
        if (!f.endsWith('.md')) continue;
        lines.push(`- [${f.replace('.md', '')}](.memoc/wiki/${sub}/${f}): wiki page.`);
      }
    }
  } catch {}
  return lines.length ? lines.join('\n') : '_None yet._';
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATES — entry files
// ═══════════════════════════════════════════════════════════════════

function tplClaude() {
  return `# CLAUDE.md

This is the Claude Code entry file for the project.

${managedBlock()}
`;
}

function tplAgents() {
  return `# AGENTS.md

This is the Codex entry file for the project.

${managedBlock()}
`;
}

function tplAgentEntry(label) {
  return `# ${label}

This is the ${label} entry file for this project.

${managedBlock()}
`;
}

function tplLlmsTxt(p) {
  return `${HDR_S}
# ${p.name}

> LLM-facing project map for this project.
${HDR_E}

This file is a map, not a startup read. Start from the entry-file protocol and open only what the task needs.

## Core

${CORE_S}
${coreLlmsInner()}
${CORE_E}

## Systems

${SYS_S}
_None yet._
${SYS_E}

## Wiki

${WIKI_S}
_None yet._
${WIKI_E}

## Optional

- [AGENTS.md](AGENTS.md): Codex entry file.
- [CLAUDE.md](CLAUDE.md): Claude Code entry file.
- [Project Memory Maintainer](skills/project-memory-maintainer/SKILL.md): local maintenance skill.
`;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATES — dynamic .memoc files
// ═══════════════════════════════════════════════════════════════════

function tplProjectBrief(p) {
  return `# Project Brief

This is the shortest project summary for a fresh agent. Keep it factual and easy to scan.

## Identity

${ID_S}
${identityInner(p)}
${ID_E}

## Current Direction

_Not set yet._

## How To Approach

- Start from \`session-summary.md\`; search before opening more files.
- Open status, handoff, rules, map, systems, or wiki docs only when the task needs them.
- After durable work, update the smallest relevant memory set.
- Do not treat generated output folders as source unless the user explicitly asks.

## Next Useful Work

_None yet._

## Important Notes

_None yet._
`;
}

function tplAgentIndex(p) {
  return `# Agent Index

This is the fast entry map for agents. Start here, then open only the docs relevant to the task.

## Read Order

1. Entry file managed block.
2. \`.memoc/session-summary.md\`.
3. Search first, then open only task-relevant files.

## Project Snapshot

${SNAP_S}
${snapshotInner(p)}
${SNAP_E}

## Core Docs

- [Boot](boot.md)
- [Project Brief](00-project-brief.md)
- [memoc Usage](memoc-usage.md)
- [Agent Workflow](01-agent-workflow.md)
- [Current Project State](02-current-project-state.md)
- [Decisions](03-decisions.md)
- [Handoff](04-handoff.md)
- [Done Checklist](05-done-checklist.md)
- [Project Rules](06-project-rules.md)
- [Session Summary](session-summary.md)
- [Project Log](log.md)
- [Wiki Index](wiki/index.md)
- [Systems Index](systems/README.md)

## System Docs

_None yet. Add entries when subsystems are documented._

## Wiki

_None yet. Add entries when wiki pages are created._
`;
}

function tplCurrentState(p) {
  return `# Current Project State

Last synced: ${nowISO()}

## Current Status

_See Project Snapshot below. Keep only current human-written status notes here._

## Project Snapshot

${SNAP_S}
${snapshotInner(p)}
${SNAP_E}

## Open Tasks

_None yet._

## Completed Tasks

See \`.memoc/log.md\` for full history.

## Commands

_None recorded yet._

## Notes

_None yet._

## Change Log

See \`.memoc/log.md\`.
`;
}

function tplSessionSummary() {
  return `# Session Summary
Last: ${nowISO()}
Keep each section ≤ 3 bullets. Agent-owned — updated by you, not by \`memoc update\`.

## Status
_What is the current state of the project?_

## Changed
_What changed in the last session? (code, config, decisions)_

## Open Tasks
_What still needs to be done?_

## Resume
_Where should the next agent pick up?_
`;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATES — static .memoc files (same for every project)
// ═══════════════════════════════════════════════════════════════════

function tplBoot() {
  return `# Agent Boot

On-demand reference only. The entry-file managed block is authoritative.

## Open Only When Needed

| File | When to open |
| --- | --- |
| \`.memoc/session-summary.md\` | Every session start (only required read) |
| \`.memoc/02-current-project-state.md\` | Before changing behavior or checking tasks |
| \`.memoc/04-handoff.md\` | When resuming incomplete work |
| \`.memoc/06-project-rules.md\` | When unsure about preferences or conventions |
| \`.memoc/01-agent-workflow.md\` | When update routing is unclear |
| \`.memoc/05-done-checklist.md\` | Before finishing substantial work |
| \`.memoc/03-decisions.md\` | When a durable decision was made |
| \`.memoc/log.md\` | For append-only history |
| \`.memoc/memoc-usage.md\` | For command details |
| \`.memoc/systems/*.md\` | Before touching a specific subsystem |
| \`.memoc/wiki/*.md\` | For synthesized project knowledge |
| \`llms.txt\` | For full project file map |

## Search First

\`memoc search "<query>"\` — returns file:line matches across all memory files.
If \`memoc\` is not on PATH, try \`.\\.memoc\\bin\\memoc.cmd search "<query>"\` on Windows or \`.memoc/bin/memoc search "<query>"\` in sh, then \`npx @kevin0181/memoc search "<query>"\`.
Use it before opening any file to avoid reading more than needed.
`;
}

function tplWorkflow() {
  return `# Agent Workflow

Shared protocol for any coding agent.

## Entry Routine

1. Read the entry-file managed block.
2. Read \`.memoc/session-summary.md\` only.
3. Search before opening broad docs.
4. Work from the smallest relevant file set.
5. Update memory only when durable context changed.

## Memory Update Triggers

| Trigger | Update |
| --- | --- |
| User creates or changes a requirement | \`02-current-project-state.md\`, \`06-project-rules.md\`, \`log.md\` |
| Code, config, data, or assets changed | \`02-current-project-state.md\`, relevant \`systems/*.md\`, \`log.md\` |
| Architecture or system behavior changed | relevant \`systems/*.md\`, \`03-decisions.md\` |
| A decision should affect future agents | \`03-decisions.md\`, \`02-current-project-state.md\` |
| Work is substantial enough to resume later | \`04-handoff.md\`, \`02-current-project-state.md\`, \`log.md\` |
| Durable knowledge was learned | \`wiki/*.md\`, \`wiki/index.md\` |

## Usually No Update Needed

- Pure Q&A with no durable outcome.
- Tiny typo-only edits.
- Temporary exploration that finds nothing actionable.

## Documentation Shape

- Entry files: protocol only.
- \`session-summary.md\`: latest snapshot, max 3 bullets per section.
- \`02-current-project-state.md\`: current status, tasks, commands, recent notes.
- \`04-handoff.md\`: resume context, blockers, verified/unverified checks.
- \`03-decisions.md\`: append durable decisions only.
- \`log.md\`: full history; keep bulky completed work here.
- \`systems/*.md\` and \`wiki/*.md\`: on-demand durable knowledge.
`;
}

function tplDecisions() {
  return `# Decisions

Durable project decisions live here. Keep entries short, dated, and useful to future agents.

## Decision Log

_None yet._
`;
}

function tplHandoff() {
  return `# Agent Handoff

Last synced: ${nowISO()}

## What Changed

_None yet._

## Next Steps

_None yet._

## Blockers

_None yet._

## Do Not Touch Without Asking

_None yet._

## Verified

_None yet._

## Not Verified

_None yet._

## Resume Notes

_None yet._

## Suggested Reads

Search first, then open only files named above.
`;
}

function tplDoneChecklist() {
  return `# Done Checklist

Run through this before saying substantial work is complete.

## Code

- [ ] Changes compile or run without errors.
- [ ] Relevant tests pass (or new tests were added).
- [ ] No obvious security issues introduced.
- [ ] No hardcoded secrets or credentials.

## Memory

- [ ] \`.memoc/02-current-project-state.md\` reflects the new status.
- [ ] \`.memoc/03-decisions.md\` updated if a durable decision was made.
- [ ] \`.memoc/04-handoff.md\` updated if work is incomplete or risky.
- [ ] \`.memoc/log.md\` has a new entry for meaningful work.
- [ ] Relevant \`.memoc/systems/*.md\` or wiki pages updated.

## Communication

- [ ] Final answer states what was verified and what was not.
- [ ] Unverified risks are noted in handoff.
`;
}

function tplProjectRules() {
  return `# Project Rules

Durable user and project preferences live here. Update when the user gives a rule that should persist across sessions.

## Operating Rules

- Keep \`AGENTS.md\` and \`CLAUDE.md\` as short entry files; durable context belongs under \`.memoc/\`.
- Do not track generated output folders such as \`out/\`, \`.next/\`, \`dist/\`, \`build/\` unless the user explicitly asks.
- Update \`.memoc/04-handoff.md\` after substantial work so the next agent can resume quickly.
- Use \`.memoc/05-done-checklist.md\` before saying substantial work is complete.

## Agent Behavior Preferences

- Be factual and operational in memory docs.
- Keep logs concise; do not paste temporary command output unless it changes future work.
- Preserve user changes and avoid reverting unrelated work.
- State unverified parts honestly in the final answer and handoff.

## Project-Specific Rules

_None yet._
`;
}

function tplLog() {
  return `# Project Log

Append-only chronological log for project memory updates.

## [${nowISO()}] init | Initialized memoc memory structure.
`;
}

function tplContextForgeUsage() {
  return `# memoc Usage

This project uses \`memoc\` to maintain agent-readable project memory.

## Commands

\`\`\`bash
# Optional: put the project-local wrapper first in PATH for this shell
# PowerShell: . .\\.memoc\\env.ps1
# sh/bash:    . ./.memoc/env.sh

# First-time setup (or re-run to update managed sections)
memoc init

# Explicitly update managed sections based on current project state
memoc update

# Tiny status overview
memoc summary

# Find files first; add --snippets only when needed
memoc search "<query>" --limit 12
memoc search "<query>" --snippets --limit 5
\`\`\`

If \`memoc\` is not on PATH, use \`.\\.memoc\\bin\\memoc.cmd <command>\` on Windows or \`.memoc/bin/memoc <command>\` in sh. If that is unavailable, use \`npx @kevin0181/memoc <command>\`.

## Agent Read Order

1. Entry-file managed block.
2. \`.memoc/session-summary.md\` only.
3. Search in this order: \`memoc search "<query>"\`, \`.\\.memoc\\bin\\memoc.cmd search "<query>"\` or \`.memoc/bin/memoc search "<query>"\`, \`npx @kevin0181/memoc search "<query>"\`.
4. Use \`--snippets\` only when file names are not enough.
5. Open only task-relevant memory files.

## When To Run Memory Updates

Use \`memoc update\` or \`skills/project-memory-maintainer/SKILL.md\` when:

- Requirements, acceptance criteria, user preferences, or project rules changed.
- Source code, config, data, content, or package scripts changed.
- Architecture, data flow, routing, auth, or deployment behavior changed.
- A decision was made that future agents should not revisit blindly.
- Work is partial, multi-step, blocked, or likely to be resumed by another agent.
- New durable knowledge belongs in \`.memoc/wiki/\` or a subsystem doc.

Usually skip for pure Q&A, throwaway exploration, or tiny edits with no future impact.

## Updating The Wiki

Create a new Markdown file under \`.memoc/wiki/\` when synthesized knowledge should compound across sessions.

- \`.memoc/wiki/sources/\`: provenance records.
- \`.memoc/wiki/topics/\`: synthesized topic pages.
- \`.memoc/wiki/global/\`: project-wide principles.

After creating or editing wiki pages:
1. Update \`.memoc/wiki/index.md\`.
2. Append \`.memoc/log.md\`.

## Updating System Docs

Create or update \`.memoc/systems/*.md\` when a subsystem needs durable detail.

Examples: \`frontend.md\`, \`deployment.md\`, \`data-sources.md\`, \`auth.md\`
`;
}

function tplSystemsReadme() {
  return `# Systems

Subsystem documentation for agents.

## How To Use

Create a new \`.md\` file here when a subsystem becomes important enough that future agents should not rediscover it from scratch.

## Examples

- \`frontend.md\` — component library, routing, state management
- \`deployment.md\` — CI/CD, environment setup, release process
- \`data-sources.md\` — databases, APIs, file sources
- \`auth.md\` — authentication and authorization
- \`design-system.md\` — colors, typography, spacing
`;
}

function tplWikiIndex() {
  return `# Wiki Index

Persistent LLM-maintained project wiki.

## Pages

_None yet._

## Subdirectories

- \`sources/\` — provenance records
- \`topics/\` — synthesized topic pages
- \`global/\` — project-wide principles
`;
}

function tplWikiSources()       { return `# Sources\n\n_No sources recorded yet._\n`; }
function tplWikiGlossary()      { return `# Glossary\n\n_No terms defined yet._\n`; }
function tplWikiQuestions()     { return `# Open Questions\n\n_No open questions yet._\n`; }
function tplWikiSourcesReadme() { return `# Sources\n\nProvenance records for conversations, URLs, docs, and issues.\n`; }
function tplWikiTopicsReadme()  { return `# Topics\n\nSynthesized topic pages that compound knowledge across sessions.\n`; }
function tplWikiGlobalReadme()  { return `# Global\n\nProject-wide principles, positioning, and long-lived direction.\n`; }
function tplWikiLint()          {
  return `# Wiki Lint\n\nLast checked: ${nowISO()}\n\n## Issues\n\n_No issues found._\n\n## Warnings\n\n_None._\n`;
}

function tplSkillMaintainer() {
  return `---
name: project-memory-maintainer
description: Maintain this project's LLM-wiki memory files after durable context changes.
---

# Project Memory Maintainer

Use this local skill after meaningful project work so future agents can continue without rediscovering context.

## Required Reads

1. \`.memoc/session-summary.md\`
2. \`memoc summary\` or \`memoc search "<query>"\`; if unavailable, use \`.\\.memoc\\bin\\memoc.cmd <command>\` or \`.memoc/bin/memoc <command>\`, then \`npx @kevin0181/memoc <command>\`
3. Open only files you will use or update.

## Maintenance Checklist

- Keep \`llms.txt\` and \`.memoc/00-agent-index.md\` as concise maps.
- Keep \`.memoc/00-project-brief.md\` as the shortest project summary.
- Update \`.memoc/02-current-project-state.md\` with new status, tasks, commands, and change log entries.
- Update \`.memoc/03-decisions.md\` when a durable decision is made.
- Update \`.memoc/04-handoff.md\` before ending substantial work.
- Check \`.memoc/05-done-checklist.md\` before saying substantial work is complete.
- Update \`.memoc/06-project-rules.md\` when the user gives durable preferences.
- Append \`.memoc/log.md\` for meaningful changes, decisions, and handoffs.
- Create or update \`.memoc/systems/*.md\` when a subsystem needs durable explanation.
- Create or update \`.memoc/wiki/*.md\` when synthesized knowledge should compound over time.
- Keep completed history in \`.memoc/log.md\`; keep current-state files short.
- Keep tool output small; prefer \`summary\`, file-only search, \`--limit\`, and targeted reads.

## Concrete Triggers

Use this skill before finishing when any of these are true:

- The user gives a durable preference, project rule, changed requirement, or acceptance criterion.
- The agent edits code, config, package scripts, env, data, assets, routes, or deployment files.
- A subsystem's behavior, architecture, data flow, or API contract changes.
- A future agent would need to know why an approach was chosen or rejected.
- The work is partial, blocked, risky, multi-step, or likely to be resumed later.

Usually skip for pure Q&A, tiny edits with no future impact, or throwaway exploration.
`;
}

// ═══════════════════════════════════════════════════════════════════
// CLAUDE CODE HOOK SETTINGS
// ═══════════════════════════════════════════════════════════════════

function claudeStopHookCmd() {
  return `node -e "const fs=require('fs'),{execSync}=require('child_process');try{const o=execSync('git status --porcelain',{stdio:'pipe'}).toString();if(o.trim()){const files=o.trim().split('\\n').map(l=>l.slice(3).trim()).filter(Boolean).slice(0,8).join(', ');fs.writeFileSync('.memoc/.pending',new Date().toISOString()+'\\n'+files)}}catch{}" 2>/dev/null || true`;
}

function tplClaudeSettings() {
  return JSON.stringify({
    hooks: {
      Stop: [{ matcher: '', hooks: [{ type: 'command', command: claudeStopHookCmd() }] }],
    },
  }, null, 2) + '\n';
}

function ensureClaudeStopHook(settingsPath) {
  const cmd = claudeStopHookCmd();
  let settings;
  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
  catch { settings = {}; }

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.Stop) settings.hooks.Stop = [];

  const alreadyPresent = settings.hooks.Stop.some(entry =>
    Array.isArray(entry.hooks) && entry.hooks.some(h => h.command === cmd)
  );
  if (alreadyPresent) return false; // no change needed

  settings.hooks.Stop.push({ matcher: '', hooks: [{ type: 'command', command: cmd }] });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  return true; // merged
}

// ═══════════════════════════════════════════════════════════════════
// MANAGED BLOCK UPDATE (CLAUDE.md / AGENTS.md)
// ═══════════════════════════════════════════════════════════════════

function applyManagedBlock(filePath, tplFn) {
  if (!fs.existsSync(filePath)) {
    write(filePath, tplFn());
    return 'add';
  }
  const src = fs.readFileSync(filePath, 'utf8');
  const s = src.indexOf(MGMT_S);
  const e = src.indexOf(MGMT_E);
  if (s === -1 || e === -1) {
    // No managed block — inject at end, preserving all user content
    write(filePath, src.trimEnd() + '\n\n' + managedBlock() + '\n');
    return 'inject';
  }
  write(filePath, src.slice(0, s) + managedBlock() + src.slice(e + MGMT_E.length));
  return 'update';
}

// ═══════════════════════════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════

function run(dir, forceUpdate) {
  const p       = scanProject(dir);
  const memDir  = path.join(dir, '.memoc');
  const isNew   = !fs.existsSync(path.join(memDir, 'boot.md'));
  const mode    = (isNew && !forceUpdate) ? 'init' : 'update';

  const log = [];
  const mark = (label, name) => log.push(`  ${label.padEnd(8)} ${name}`);

  if (mode === 'init') {
    console.log(`\n  memoc init — ${path.basename(dir)}`);
    console.log(p.isEmpty
      ? '  Empty project → using default values.'
      : `  Detected: ${stackStr(p.stack)}`
    );
    console.log();

    // Entry files — inject/update managed block, preserve existing user content
    mark(applyManagedBlock(path.join(dir, 'CLAUDE.md'), tplClaude), 'CLAUDE.md');
    mark(applyManagedBlock(path.join(dir, 'AGENTS.md'), tplAgents), 'AGENTS.md');
    if (ensure(path.join(dir, 'llms.txt'), tplLlmsTxt(p))) mark('add',  'llms.txt');
    else                                                    mark('skip', 'llms.txt');

    // Dynamic memory files
    const dynamicFiles = [
      [path.join(memDir, '00-project-brief.md'),       () => tplProjectBrief(p)],
      [path.join(memDir, '00-agent-index.md'),         () => tplAgentIndex(p)],
      [path.join(memDir, '02-current-project-state.md'), () => tplCurrentState(p)],
      [path.join(memDir, 'session-summary.md'),        tplSessionSummary],
    ];
    for (const [fp, tpl] of dynamicFiles) {
      const rel = path.relative(dir, fp);
      if (ensure(fp, tpl())) mark('add', rel); else mark('skip', rel);
    }

    // Static memory files
    const staticFiles = [
      [path.join(memDir, 'boot.md'),                   tplBoot],
      [path.join(memDir, '01-agent-workflow.md'),      tplWorkflow],
      [path.join(memDir, '03-decisions.md'),           tplDecisions],
      [path.join(memDir, '04-handoff.md'),             tplHandoff],
      [path.join(memDir, '05-done-checklist.md'),      tplDoneChecklist],
      [path.join(memDir, '06-project-rules.md'),       tplProjectRules],
      [path.join(memDir, 'log.md'),                    tplLog],
      [path.join(memDir, 'memoc-usage.md'),    tplContextForgeUsage],
      [path.join(memDir, 'systems/README.md'),         tplSystemsReadme],
      [path.join(memDir, 'wiki/index.md'),             tplWikiIndex],
      [path.join(memDir, 'wiki/sources.md'),           tplWikiSources],
      [path.join(memDir, 'wiki/glossary.md'),          tplWikiGlossary],
      [path.join(memDir, 'wiki/questions.md'),         tplWikiQuestions],
      [path.join(memDir, 'wiki/lint.md'),              tplWikiLint],
      [path.join(memDir, 'wiki/sources/README.md'),    tplWikiSourcesReadme],
      [path.join(memDir, 'wiki/topics/README.md'),     tplWikiTopicsReadme],
      [path.join(memDir, 'wiki/global/README.md'),     tplWikiGlobalReadme],
      [path.join(dir,    'skills/project-memory-maintainer/SKILL.md'), tplSkillMaintainer],
    ];
    for (const [fp, tpl] of staticFiles) {
      const rel = path.relative(dir, fp);
      if (ensure(fp, tpl())) mark('add', rel); else mark('skip', rel);
    }

    // Claude Code Stop hook — writes .memoc/.pending when git detects changes
    const claudeDir      = path.join(dir, '.claude');
    const claudeSettings = path.join(claudeDir, 'settings.json');
    fs.mkdirSync(claudeDir, { recursive: true });
    if (!fs.existsSync(claudeSettings)) {
      write(claudeSettings, tplClaudeSettings());
      mark('add', '.claude/settings.json');
    } else {
      const merged = ensureClaudeStopHook(claudeSettings);
      mark(merged ? 'update' : 'skip', `.claude/settings.json (Stop hook ${merged ? 'merged' : 'already present'})`);
    }

    // .gitignore — add .memoc/.pending if not already present
    const gitignorePath = path.join(dir, '.gitignore');
    const PENDING_ENTRY = '.memoc/.pending';
    const gitignoreContent = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, 'utf8') : '';
    if (!gitignoreContent.includes(PENDING_ENTRY)) {
      fs.appendFileSync(gitignorePath, (gitignoreContent.endsWith('\n') ? '' : '\n') + PENDING_ENTRY + '\n', 'utf8');
      mark('update', '.gitignore (.memoc/.pending added)');
    } else {
      mark('skip', '.gitignore (.memoc/.pending already present)');
    }

    // PATH helpers — let agents run memoc even when the npm bin is not on PATH
    ensurePathHelpers(dir, mark);
    ensurePathRegistration(dir, mark);

  } else {
    // ── UPDATE MODE
    console.log(`\n  memoc update — ${path.basename(dir)}`);
    console.log(`  Re-scanning project: ${p.isEmpty ? 'nothing detected' : stackStr(p.stack)}`);
    console.log();

    // Entry files — update managed blocks, preserve user content
    mark(applyManagedBlock(path.join(dir, 'CLAUDE.md'),  tplClaude), 'CLAUDE.md');
    mark(applyManagedBlock(path.join(dir, 'AGENTS.md'),  tplAgents), 'AGENTS.md');

    // Third-party agent files — update only if already added
    for (const [, agent] of Object.entries(AGENT_REGISTRY)) {
      const fp = path.join(dir, agent.file);
      if (fs.existsSync(fp)) {
        mark(applyManagedBlock(fp, () => tplAgentEntry(agent.label)), agent.file);
      }
    }

    // llms.txt — update all managed sections
    const llmsPath = path.join(dir, 'llms.txt');
    if (fs.existsSync(llmsPath)) {
      updateSection(llmsPath, HDR_S,  HDR_E,  headerInner(p));
      updateSection(llmsPath, CORE_S, CORE_E, coreLlmsInner());
      updateSection(llmsPath, SYS_S,  SYS_E,  systemsLlmsInner(dir));
      updateSection(llmsPath, WIKI_S, WIKI_E, wikiLlmsInner(dir));
      mark('update', 'llms.txt');
    } else {
      write(llmsPath, tplLlmsTxt(p));
      mark('add', 'llms.txt');
    }

    // Dynamic memory files — update managed sections only
    const dynUpdates = [
      [path.join(memDir, '00-project-brief.md'),       () => tplProjectBrief(p),   ID_S,   ID_E,   identityInner(p)],
      [path.join(memDir, '00-agent-index.md'),         () => tplAgentIndex(p),     SNAP_S, SNAP_E, snapshotInner(p)],
      [path.join(memDir, '02-current-project-state.md'), () => tplCurrentState(p), SNAP_S, SNAP_E, snapshotInner(p)],
    ];
    for (const [fp, tpl, s, e, inner] of dynUpdates) {
      const rel = path.relative(dir, fp);
      if (!fs.existsSync(fp)) {
        write(fp, tpl());
        mark('add', rel);
      } else if (updateSection(fp, s, e, inner)) {
        mark('update', `${rel} (managed section)`);
      } else {
        mark('skip',   rel);
      }
    }

    // session-summary is agent-owned — never overwrite, only add if missing
    const summaryPath = path.join(memDir, 'session-summary.md');
    if (fs.existsSync(summaryPath)) {
      const summarySize = Buffer.byteLength(fs.readFileSync(summaryPath, 'utf8'), 'utf8');
      if (summarySize > 1000) {
        console.log(`  ⚠  session-summary.md is ${summarySize}B (recommended: <800B).`);
      }
      mark('skip', '.memoc/session-summary.md (agent-owned, not modified)');
    } else {
      write(summaryPath, tplSessionSummary());
      mark('add', '.memoc/session-summary.md');
    }

    // Static + user-owned files — only add if missing
    const addIfMissing = [
      [path.join(memDir, 'boot.md'),                   tplBoot],
      [path.join(memDir, '01-agent-workflow.md'),      tplWorkflow],
      [path.join(memDir, '03-decisions.md'),           tplDecisions],
      [path.join(memDir, '04-handoff.md'),             tplHandoff],
      [path.join(memDir, '05-done-checklist.md'),      tplDoneChecklist],
      [path.join(memDir, '06-project-rules.md'),       tplProjectRules],
      [path.join(memDir, 'log.md'),                    tplLog],
      [path.join(memDir, 'memoc-usage.md'),    tplContextForgeUsage],
      [path.join(memDir, 'systems/README.md'),         tplSystemsReadme],
      [path.join(memDir, 'wiki/index.md'),             tplWikiIndex],
      [path.join(memDir, 'wiki/sources.md'),           tplWikiSources],
      [path.join(memDir, 'wiki/glossary.md'),          tplWikiGlossary],
      [path.join(memDir, 'wiki/questions.md'),         tplWikiQuestions],
      [path.join(memDir, 'wiki/lint.md'),              tplWikiLint],
      [path.join(memDir, 'wiki/sources/README.md'),    tplWikiSourcesReadme],
      [path.join(memDir, 'wiki/topics/README.md'),     tplWikiTopicsReadme],
      [path.join(memDir, 'wiki/global/README.md'),     tplWikiGlobalReadme],
      [path.join(dir,    'skills/project-memory-maintainer/SKILL.md'), tplSkillMaintainer],
    ];
    for (const [fp, tpl] of addIfMissing) {
      const rel = path.relative(dir, fp);
      if (ensure(fp, tpl())) mark('add', rel);
      // silently skip existing — user/agent owns them
    }

    // PATH helpers — let agents run memoc even when the npm bin is not on PATH
    ensurePathHelpers(dir, mark);
    ensurePathRegistration(dir, mark);

    // Append update record to log.md
    const logPath = path.join(memDir, 'log.md');
    if (fs.existsSync(logPath)) {
      fs.appendFileSync(logPath,
        `\n## [${nowISO()}] update | Re-scanned: ${p.isEmpty ? 'nothing detected' : stackStr(p.stack)}\n`,
        'utf8'
      );
      mark('append', '.memoc/log.md');
    }
  }

  hideOnWindows(memDir);
  console.log(log.join('\n'));
  console.log('\n  Done.');
}

// ═══════════════════════════════════════════════════════════════════
// ADD — add entry file for a specific agent
// ═══════════════════════════════════════════════════════════════════

function runAdd(dir) {
  const agentKey = (process.argv[3] || '').toLowerCase();

  if (!agentKey) {
    console.log('\n  Available agents:\n');
    for (const [key, agent] of Object.entries(AGENT_REGISTRY)) {
      const exists = fs.existsSync(path.join(dir, agent.file)) ? ' (already added)' : '';
      console.log(`  ${key.padEnd(10)} → ${agent.file}${exists}`);
    }
    console.log('\n  Usage: memoc add <agent>');
    return;
  }

  const agent = AGENT_REGISTRY[agentKey];
  if (!agent) {
    console.error(`\n  Unknown agent: "${agentKey}"`);
    console.error(`  Available: ${Object.keys(AGENT_REGISTRY).join(', ')}`);
    process.exit(1);
  }

  const filePath = path.join(dir, agent.file);
  const result = applyManagedBlock(filePath, () => tplAgentEntry(agent.label));
  console.log(`\n  ${result.padEnd(8)} ${agent.file}  (${agent.label})`);
  console.log('\n  Done.');
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════

function runSearch(dir) {
  const rawArgs = process.argv.slice(3);
  const opts = { mode: 'files', limit: 12, all: false };
  const queryParts = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '--snippets') { opts.mode = 'snippets'; continue; }
    if (arg === '--files')    { opts.mode = 'files';    continue; }
    if (arg === '--all')      { opts.all = true;        continue; }
    if (arg === '--limit') {
      const n = Number(rawArgs[++i]);
      if (Number.isFinite(n) && n > 0) opts.limit = Math.floor(n);
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const n = Number(arg.slice('--limit='.length));
      if (Number.isFinite(n) && n > 0) opts.limit = Math.floor(n);
      continue;
    }
    queryParts.push(arg);
  }

  const query = queryParts.join(' ').toLowerCase();

  const searchRoots = [
    path.join(dir, '.memoc'),
    path.join(dir, 'skills'),
    path.join(dir, 'llms.txt'),
    path.join(dir, 'AGENTS.md'),
    path.join(dir, 'CLAUDE.md'),
    ...Object.values(AGENT_REGISTRY).map(agent => path.join(dir, agent.file)),
  ];

  if (!query) {
    // No query — list all memory files sorted by recency
    const allFiles = [];
    function collectFile(fp) {
      if (!fs.existsSync(fp)) return;
      const rel = path.relative(dir, fp);
      let mtime = 0;
      try { mtime = fs.statSync(fp).mtimeMs; } catch {}
      allFiles.push({ file: rel, mtime });
    }
    function collectDir(d) {
      if (!fs.existsSync(d)) return;
      for (const entry of fs.readdirSync(d)) {
        const fp = path.join(d, entry);
        try {
          if (fs.statSync(fp).isDirectory()) collectDir(fp);
          else if (entry.endsWith('.md') || entry === 'llms.txt' || entry.endsWith('rules')) collectFile(fp);
        } catch {}
      }
    }
    for (const root of searchRoots) {
      try {
        if (fs.statSync(root).isDirectory()) collectDir(root);
        else collectFile(root);
      } catch {}
    }
    allFiles.sort((a, b) => b.mtime - a.mtime || a.file.localeCompare(b.file));
    const limited = opts.all ? allFiles : allFiles.slice(0, opts.limit);
    console.log(limited.map(r => r.file).join('\n'));
    if (!opts.all && allFiles.length > limited.length) {
      console.log(`... ${allFiles.length - limited.length} more files. Use --all to show all.`);
    }
    return;
  }

  const matchesByFile = new Map(); // rel -> { matches: [], mtime: number }

  function searchFile(fp) {
    if (!fs.existsSync(fp)) return;
    const rel = path.relative(dir, fp);
    let mtime = 0;
    try { mtime = fs.statSync(fp).mtimeMs; } catch {}
    const lines = fs.readFileSync(fp, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(query)) {
        if (!matchesByFile.has(rel)) matchesByFile.set(rel, { matches: [], mtime });
        matchesByFile.get(rel).matches.push({ line: i + 1, text: line.trim() });
      }
    });
  }

  function walkDir(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d)) {
      const fp = path.join(d, entry);
      try {
        if (fs.statSync(fp).isDirectory()) walkDir(fp);
        else if (entry.endsWith('.md') || entry === 'llms.txt' || entry.endsWith('rules')) searchFile(fp);
      } catch {}
    }
  }

  for (const root of searchRoots) {
    try {
      if (fs.statSync(root).isDirectory()) walkDir(root);
      else searchFile(root);
    } catch {}
  }

  if (!matchesByFile.size) {
    console.log('No matches found.');
  } else if (opts.mode === 'files') {
    const rows = [...matchesByFile.entries()]
      .map(([file, { matches, mtime }]) => ({ file, count: matches.length, mtime }))
      .sort((a, b) => b.count - a.count || b.mtime - a.mtime || a.file.localeCompare(b.file));
    const limited = opts.all ? rows : rows.slice(0, opts.limit);
    console.log(limited.map(r => `${r.file}  ${r.count} match${r.count === 1 ? '' : 'es'}`).join('\n'));
    if (!opts.all && rows.length > limited.length) {
      console.log(`... ${rows.length - limited.length} more files. Use --all to show all, or --snippets for line matches.`);
    }
  } else {
    const snippets = [];
    for (const [file, { matches }] of matchesByFile.entries()) {
      for (const m of matches) snippets.push(`${file}:${m.line}  ${m.text}`);
    }
    const limited = opts.all ? snippets : snippets.slice(0, opts.limit);
    console.log(limited.join('\n'));
    if (!opts.all && snippets.length > limited.length) {
      console.log(`... ${snippets.length - limited.length} more matches. Use --all to show all, or --limit N.`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOKENS — estimate token cost of current memory state
// ═══════════════════════════════════════════════════════════════════

function runTokens(dir) {
  const est  = text => Math.ceil(Buffer.byteLength(text, 'utf8') / 4);
  const read = fp   => { try { return fs.readFileSync(fp, 'utf8'); } catch { return ''; } };
  const memDir = path.join(dir, '.memoc');

  const startup = [
    ['CLAUDE.md',          path.join(dir, 'CLAUDE.md')],
    ['session-summary.md', path.join(memDir, 'session-summary.md')],
  ];
  const onDemand = [
    ['llms.txt',                      path.join(dir, 'llms.txt')],
    ['02-current-project-state.md',   path.join(memDir, '02-current-project-state.md')],
    ['03-decisions.md',               path.join(memDir, '03-decisions.md')],
    ['04-handoff.md',                 path.join(memDir, '04-handoff.md')],
    ['06-project-rules.md',           path.join(memDir, '06-project-rules.md')],
    ['log.md',                        path.join(memDir, 'log.md')],
  ];

  console.log('\n  memoc tokens\n');
  let startupTotal = 0;
  console.log('  Startup (always loaded):');
  for (const [name, fp] of startup) {
    const content = read(fp);
    const t = est(content);
    const b = Buffer.byteLength(content, 'utf8');
    startupTotal += t;
    const warn = b > 1000 ? '  ⚠ large' : '';
    console.log(`    ${name.padEnd(32)} ${String(t).padStart(5)} tokens  (${b}B)${warn}`);
  }
  console.log(`    ${'── startup total'.padEnd(32)} ${String(startupTotal).padStart(5)} tokens`);

  console.log('\n  On-demand (read when needed):');
  let onDemandTotal = 0;
  for (const [name, fp] of onDemand) {
    const content = read(fp);
    if (!content) continue;
    const t = est(content);
    const b = Buffer.byteLength(content, 'utf8');
    onDemandTotal += t;
    const warn = t > 500 ? '  ⚠ consider compress' : '';
    console.log(`    ${name.padEnd(32)} ${String(t).padStart(5)} tokens  (${b}B)${warn}`);
  }
  console.log(`    ${'── on-demand total'.padEnd(32)} ${String(onDemandTotal).padStart(5)} tokens`);
  console.log(`\n  If all loaded: ~${startupTotal + onDemandTotal} tokens`);

  const summaryContent = read(path.join(memDir, 'session-summary.md'));
  const summaryBytes   = Buffer.byteLength(summaryContent, 'utf8');
  if (summaryBytes > 800) {
    console.log(`\n  ⚠ session-summary.md is ${summaryBytes}B — recommended <800B. Trim it manually.`);
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════
// COMPRESS — archive old log.md entries to keep file small
// ═══════════════════════════════════════════════════════════════════

function runCompress(dir) {
  const KEEP = 20;
  const logPath     = path.join(dir, '.memoc', 'log.md');
  const archivePath = path.join(dir, '.memoc', 'log-archive.md');

  if (!fs.existsSync(logPath)) {
    console.log('\n  No .memoc/log.md found.\n');
    return;
  }

  const src = fs.readFileSync(logPath, 'utf8');
  // Split on entry headers, keep header as part of each chunk
  const parts  = src.split(/(?=\n## \[)/);
  const header = parts[0]; // everything before first entry
  const entries = parts.slice(1).filter(e => e.trim());

  if (entries.length <= KEEP) {
    console.log(`\n  log.md has ${entries.length} entries — nothing to compress (threshold: ${KEEP}).\n`);
    return;
  }

  const toArchive = entries.slice(0, entries.length - KEEP);
  const toKeep    = entries.slice(entries.length - KEEP);

  // Append to archive
  const archiveExists = fs.existsSync(archivePath);
  const archiveHeader = archiveExists ? '' : '# Log Archive\n\nOlder entries moved from log.md by `memoc compress`.\n';
  fs.appendFileSync(archivePath, archiveHeader + toArchive.join('') + '\n', 'utf8');

  // Rewrite log.md with only recent entries
  write(logPath, header.trimEnd() + '\n' + toKeep.join('') + '\n');

  console.log(`\n  memoc compress\n`);
  console.log(`    Archived  ${toArchive.length} entries → .memoc/log-archive.md`);
  console.log(`    Kept      ${toKeep.length} recent entries in log.md`);
  const saved = Buffer.byteLength(toArchive.join(''), 'utf8');
  console.log(`    Freed     ~${saved}B from log.md`);
  console.log('\n  Done.\n');
}

// ═══════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════

function runSummary(dir) {
  const files = [
    path.join(dir, '.memoc/session-summary.md'),
    path.join(dir, '.memoc/02-current-project-state.md'),
    path.join(dir, '.memoc/04-handoff.md'),
  ];

  function read(fp) {
    try { return fs.readFileSync(fp, 'utf8'); } catch { return ''; }
  }

  function section(src, heading) {
    const re = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, 'm');
    const m = src.match(re);
    return m ? m[1].trim() : '';
  }

  function bullets(text, max = 3) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- ') && !line.includes('_None yet._'))
      .slice(0, max);
  }

  const summary = read(files[0]);
  const state = read(files[1]);
  const handoff = read(files[2]);
  try {
    const pkg = JSON.parse(read(path.join(dir, 'package.json')));
    if (pkg.name || pkg.version) {
      console.log(`Project: ${pkg.name || path.basename(dir)}${pkg.version ? `@${pkg.version}` : ''}`);
    }
  } catch {}
  const rows = [
    ['Status', bullets(section(summary, 'Status')).concat(bullets(section(state, 'Current Status'))).slice(0, 3)],
    ['Open Tasks', bullets(section(summary, 'Open Tasks')).concat(bullets(section(state, 'Open Tasks'))).slice(0, 3)],
    ['Resume', bullets(section(summary, 'Resume')).concat(bullets(section(handoff, 'Next Steps'))).slice(0, 3)],
    ['Verified', bullets(section(handoff, 'Verified'), 2)],
  ];

  let printed = false;
  for (const [label, items] of rows) {
    if (!items.length) continue;
    printed = true;
    console.log(`${label}:`);
    for (const item of items) console.log(item);
  }
  if (!printed) console.log('No summary bullets yet. Read .memoc/session-summary.md.');
}

// ═══════════════════════════════════════════════════════════════════
// CLI ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

const cmd = process.argv[2];
const cwd = process.cwd();

if (cmd === '--version' || cmd === '-v') {
  console.log(VERSION);
  process.exit(0);
}

if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
  console.log('Usage: memoc <command>\n');
  console.log('Commands:');
  console.log('  init               Scaffold agent memory (auto-detects project, updates if already exists)');
  console.log('  update             Force-update managed sections based on current project state');
  console.log('  summary            Print a tiny status/resume overview');
  console.log('  tokens             Estimate token cost of current memory files');
  console.log('  compress           Archive old log.md entries to keep file small');
  console.log('  add <agent>        Add entry file for a specific agent (run without args to list)');
  console.log('  search "<query>"   Find matching files (use --snippets for line matches)');
  console.log('\nSearch flags:');
  console.log('  --files            Show file names and match counts, sorted by relevance + recency (default)');
  console.log('  --snippets         Show matching lines');
  console.log('  --limit N          Limit output (default 12)');
  console.log('  --all              Show all matches');
  console.log('\nFlags:');
  console.log('  --version, -v      Print version');
  process.exit(0);
}

if (cmd === 'init')     { run(cwd, false);    process.exit(0); }
if (cmd === 'update')   { run(cwd, true);     process.exit(0); }
if (cmd === 'summary')  { runSummary(cwd);    process.exit(0); }
if (cmd === 'tokens')   { runTokens(cwd);     process.exit(0); }
if (cmd === 'compress') { runCompress(cwd);   process.exit(0); }
if (cmd === 'add')      { runAdd(cwd);        process.exit(0); }
if (cmd === 'search')   { runSearch(cwd);     process.exit(0); }

console.error(`Unknown command: ${cmd}`);
console.error('Run "memoc --help" for usage.');
process.exit(1);
