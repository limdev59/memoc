const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, execSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'bin', 'cli.js');
const pkg = require('../package.json');

function withTempProject(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memoc-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'sample-app' }), 'utf8');
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function commandArg(arg) {
  if (process.platform === 'win32') return `"${String(arg).replace(/"/g, '""')}"`;
  return `'${String(arg).replace(/'/g, `'\\''`)}'`;
}

function runLocalMemoc(dir, args, env = process.env) {
  const localBin = path.join(dir, '.memoc', 'bin', process.platform === 'win32' ? 'memoc.cmd' : 'memoc');
  if (process.platform === 'win32') {
    return execSync([commandArg(localBin), ...args.map(commandArg)].join(' '), { cwd: dir, encoding: 'utf8', env });
  }
  return execFileSync(localBin, args, { cwd: dir, encoding: 'utf8', env });
}

test('init creates PATH helpers and teaches agents command fallbacks', () => {
  withTempProject(dir => {
    const userBin = path.join(dir, 'fake-user-bin');
    const activePathBin = path.join(dir, 'active-path-bin');
    fs.mkdirSync(activePathBin, { recursive: true });
    const output = execFileSync(process.execPath, [cliPath, 'init'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        MEMOC_SKIP_PATH_REGISTER: '1',
        MEMOC_USER_BIN_DIR: userBin,
        MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
        PATH: `${activePathBin}${path.delimiter}${process.env.PATH || ''}`,
      },
    });

    const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.match(output, /PATH registration/);
    assert.match(output, /Agent command fallback/);
    assert.match(output, /\.\\\.memoc\\bin\\memoc\.cmd summary/);
    assert.match(output, /\.memoc\/bin\/memoc summary/);
    assert.match(agents, /Search memory first/);
    assert.match(agents, /`memoc search "<query>" --limit 5`/);
    assert.match(agents, /`\.\\\.memoc\\bin\\memoc\.cmd <command>`/);
    assert.match(agents, /`\.memoc\/bin\/memoc <command>`/);

    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'env.ps1')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'env.sh')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'bin', 'memoc.cmd')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'bin', 'memoc.ps1')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'bin', 'memoc')));
    assert.ok(fs.existsSync(path.join(userBin, 'memoc.cmd')));
    assert.ok(fs.existsSync(path.join(userBin, 'memoc.ps1')));
    assert.ok(fs.existsSync(path.join(userBin, 'memoc')));
    assert.match(fs.readFileSync(path.join(userBin, 'memoc.cmd'), 'utf8'), /node .*cli\.js/);
    assert.match(fs.readFileSync(path.join(userBin, 'memoc.ps1'), 'utf8'), /node .*cli\.js/);
    assert.match(fs.readFileSync(path.join(userBin, 'memoc'), 'utf8'), /node .*cli\.js/);
    assert.ok(fs.existsSync(path.join(dir, 'fake-runtime', 'bin', 'cli.js')));
    assert.ok(fs.existsSync(path.join(activePathBin, 'memoc.cmd')));
    assert.ok(fs.existsSync(path.join(activePathBin, 'memoc.ps1')));
    assert.ok(fs.existsSync(path.join(activePathBin, 'memoc')));
  });
});

test('project-local memoc launcher runs commands agents are told to use', () => {
  withTempProject(dir => {
    const env = {
      ...process.env,
      MEMOC_SKIP_PATH_REGISTER: '1',
      MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
      MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
    };
    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });

    assert.equal(runLocalMemoc(dir, ['--version'], env).trim(), pkg.version);
    fs.appendFileSync(path.join(dir, '.memoc', 'session-summary.md'), '\n- auth token refresh pending\n', 'utf8');
    const output = runLocalMemoc(dir, ['search', 'auth', '--snippets', '--limit', '3'], env);
    assert.match(output, /\.memoc[\\/]session-summary\.md/);
    assert.match(output, /auth token refresh pending/);
  });
});

test('init writes memoc markers and does not duplicate managed blocks', () => {
  withTempProject(dir => {
    const env = {
      ...process.env,
      MEMOC_SKIP_PATH_REGISTER: '1',
      MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
      MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
    };

    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });
    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });

    const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.equal((agents.match(/<!-- memoc:managed:start -->/g) || []).length, 1);
    assert.equal((agents.match(/<!-- memoc:managed:end -->/g) || []).length, 1);
    assert.doesNotMatch(agents, /context-forge:managed/);
  });
});

test('init migrates legacy context-forge markers without duplicating blocks', () => {
  withTempProject(dir => {
    fs.writeFileSync(
      path.join(dir, 'AGENTS.md'),
      [
        '# Existing Agent Notes',
        '',
        '<!-- context-forge:managed:start -->',
        'legacy managed block',
        '<!-- context-forge:managed:end -->',
        '',
        'User-owned notes stay here.',
        '',
      ].join('\n'),
      'utf8'
    );

    execFileSync(process.execPath, [cliPath, 'init'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        MEMOC_SKIP_PATH_REGISTER: '1',
        MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
        MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
      },
    });

    const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.equal((agents.match(/<!-- memoc:managed:start -->/g) || []).length, 1);
    assert.equal((agents.match(/<!-- memoc:managed:end -->/g) || []).length, 1);
    assert.doesNotMatch(agents, /context-forge:managed/);
    assert.match(agents, /User-owned notes stay here/);
  });
});

test('init installs a cross-platform Claude hook and migrates old memoc hooks', () => {
  withTempProject(dir => {
    const claudeDir = path.join(dir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({
        hooks: {
          Stop: [
            {
              matcher: '',
              hooks: [
                { type: 'command', command: 'echo keep-me' },
                { type: 'command', command: "node -e \"fs.writeFileSync('.memoc/.pending','x'); git status --porcelain\" 2>/dev/null || true" },
              ],
            },
          ],
        },
      }, null, 2),
      'utf8'
    );

    execFileSync(process.execPath, [cliPath, 'init'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        MEMOC_SKIP_PATH_REGISTER: '1',
        MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
        MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
      },
    });

    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8'));
    const commands = settings.hooks.Stop.flatMap(entry => entry.hooks || []).map(h => h.command);
    const memocHooks = commands.filter(command => command.includes('.memoc/.pending'));
    assert.equal(memocHooks.length, 1);
    assert.match(memocHooks[0], /execFileSync\('git',\['status','--porcelain'\]/);
    assert.doesNotMatch(memocHooks[0], /2>\/dev\/null|\|\| true/);
    assert.ok(commands.includes('echo keep-me'));
  });
});

test('update mode refreshes Claude hook and pending gitignore entry', () => {
  withTempProject(dir => {
    const env = {
      ...process.env,
      MEMOC_SKIP_PATH_REGISTER: '1',
      MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
      MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
    };
    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });

    const settingsPath = path.join(dir, '.claude', 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        hooks: {
          Stop: [{ matcher: '', hooks: [{ type: 'command', command: "node -e \"fs.writeFileSync('.memoc/.pending','x'); git status --porcelain\" 2>/dev/null || true" }] }],
        },
      }, null, 2),
      'utf8'
    );
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n.memoc/.pending-old\n', 'utf8');

    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const commands = settings.hooks.Stop.flatMap(entry => entry.hooks || []).map(h => h.command);
    const memocHooks = commands.filter(command => command.includes('.memoc/.pending'));
    assert.equal(memocHooks.length, 1);
    assert.doesNotMatch(memocHooks[0], /2>\/dev\/null|\|\| true/);
    assert.match(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'), /^\.memoc\/\.pending$/m);
  });
});

test('upgrade refreshes runtime while preserving existing memory', () => {
  withTempProject(dir => {
    const runtimeDir = path.join(dir, 'fake-runtime');
    const env = {
      ...process.env,
      MEMOC_SKIP_PATH_REGISTER: '1',
      MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
      MEMOC_RUNTIME_DIR: runtimeDir,
    };
    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });

    const summaryPath = path.join(dir, '.memoc', 'session-summary.md');
    const decisionsPath = path.join(dir, '.memoc', '03-decisions.md');
    fs.writeFileSync(summaryPath, '# Session Summary\n\n## Status\n- keep this memory\n', 'utf8');
    fs.appendFileSync(decisionsPath, '\n## 2026-05-20\n- Preserve user decisions.\n', 'utf8');
    fs.writeFileSync(path.join(runtimeDir, 'package.json'), JSON.stringify({ version: '0.0.1' }), 'utf8');

    const output = execFileSync(process.execPath, [cliPath, 'upgrade'], { cwd: dir, encoding: 'utf8', env });

    assert.match(output, /memoc upgrade/);
    assert.match(fs.readFileSync(summaryPath, 'utf8'), /keep this memory/);
    assert.match(fs.readFileSync(decisionsPath, 'utf8'), /Preserve user decisions/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(runtimeDir, 'package.json'), 'utf8')).version, pkg.version);
    assert.match(fs.readFileSync(path.join(dir, '.memoc', 'log.md'), 'utf8'), /upgrade \| Re-scanned/);
  });
});

test('init tolerates malformed Claude hook settings', () => {
  withTempProject(dir => {
    const claudeDir = path.join(dir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({ hooks: 'bad shape' }), 'utf8');

    execFileSync(process.execPath, [cliPath, 'init'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        MEMOC_SKIP_PATH_REGISTER: '1',
        MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
        MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
      },
    });

    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8'));
    assert.ok(Array.isArray(settings.hooks.Stop));
    assert.equal(settings.hooks.Stop.flatMap(entry => entry.hooks || []).filter(h => h.command.includes('.memoc/.pending')).length, 1);
  });
});

test('init registers a user-local memoc launcher for unix shells', () => {
  withTempProject(dir => {
    const home = path.join(dir, 'fake home');
    const userBin = path.join(home, '.local', 'bin');
    fs.mkdirSync(home, { recursive: true });

    execFileSync(process.execPath, [cliPath, 'init'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: home,
        MEMOC_PLATFORM: 'linux',
        MEMOC_USER_BIN_DIR: userBin,
        MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
      },
    });

    assert.ok(fs.existsSync(path.join(userBin, 'memoc')));
    const profile = fs.readFileSync(path.join(home, '.profile'), 'utf8');
    assert.match(profile, /MEMOC_BIN=/);
    assert.match(profile, /fake home/);
  });
});

test('search stays memory-scoped while grep finds source code matches', () => {
  withTempProject(dir => {
    const srcDir = path.join(dir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, 'particles.cpp'),
      'void GetParticles() { /* renderer shader */ }\n',
      'utf8'
    );
    fs.mkdirSync(path.join(dir, '.memoc'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.memoc', 'session-summary.md'), '- GetParticles memory note\n', 'utf8');

    const memoryOutput = execFileSync(process.execPath, [cliPath, 'search', 'GetParticles', '--snippets', '--limit', '5'], {
      cwd: dir,
      encoding: 'utf8',
    });
    const projectOutput = execFileSync(process.execPath, [cliPath, 'grep', 'GetParticles', '--snippets', '--limit', '5'], {
      cwd: dir,
      encoding: 'utf8',
    });

    assert.match(memoryOutput, /\.memoc[\\/]session-summary\.md:1/);
    assert.doesNotMatch(memoryOutput, /src[\\/]particles\.cpp/);
    assert.match(projectOutput, /src[\\/]particles\.cpp:1/);
    assert.doesNotMatch(projectOutput, /\.memoc[\\/]session-summary\.md/);
    assert.match(projectOutput, /GetParticles/);
  });
});

test('init creates an Obsidian-friendly connected wiki scaffold', () => {
  withTempProject(dir => {
    execFileSync(process.execPath, [cliPath, 'init'], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        MEMOC_SKIP_PATH_REGISTER: '1',
        MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
        MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
      },
    });

    const wikiIndex = fs.readFileSync(path.join(dir, '.memoc', 'wiki', 'index.md'), 'utf8');
    const topics = fs.readFileSync(path.join(dir, '.memoc', 'wiki', 'topics', 'README.md'), 'utf8');
    const sources = fs.readFileSync(path.join(dir, '.memoc', 'wiki', 'sources.md'), 'utf8');
    const agentIndex = fs.readFileSync(path.join(dir, '.memoc', '00-agent-index.md'), 'utf8');
    const skill = fs.readFileSync(path.join(dir, 'skills', 'project-memory-maintainer', 'SKILL.md'), 'utf8');

    assert.match(wikiIndex, /\[Sources\]\(sources\.md\)/);
    assert.match(wikiIndex, /\[Topics\]\(topics\/README\.md\)/);
    assert.match(wikiIndex, /\[Agent Index\]\(\.\.\/00-agent-index\.md\)/);
    assert.match(topics, /\[Wiki Index\]\(\.\.\/index\.md\)/);
    assert.match(topics, /Avoid orphan pages/);
    assert.match(sources, /\[Open Questions\]\(questions\.md\)/);
    assert.match(agentIndex, /\[Wiki Lint\]\(wiki\/lint\.md\)/);
    assert.match(skill, /Keep the wiki graph connected/);
    assert.match(skill, /relative Markdown links/);
  });
});

test('upgrade refreshes default wiki scaffold links without overwriting user wiki pages', () => {
  withTempProject(dir => {
    const env = {
      ...process.env,
      MEMOC_SKIP_PATH_REGISTER: '1',
      MEMOC_USER_BIN_DIR: path.join(dir, 'fake-user-bin'),
      MEMOC_RUNTIME_DIR: path.join(dir, 'fake-runtime'),
    };
    execFileSync(process.execPath, [cliPath, 'init'], { cwd: dir, encoding: 'utf8', env });

    fs.writeFileSync(
      path.join(dir, '.memoc', 'wiki', 'index.md'),
      [
        '# Wiki Index',
        '',
        'Persistent LLM-maintained project wiki.',
        '',
        '## Pages',
        '',
        '_None yet._',
        '',
      ].join('\n'),
      'utf8'
    );
    fs.writeFileSync(
      path.join(dir, '.memoc', 'wiki', 'glossary.md'),
      [
        '# Glossary',
        '',
        '## Terms',
        '',
        '- User-owned term should stay.',
        '',
      ].join('\n'),
      'utf8'
    );

    execFileSync(process.execPath, [cliPath, 'upgrade'], { cwd: dir, encoding: 'utf8', env });

    const wikiIndex = fs.readFileSync(path.join(dir, '.memoc', 'wiki', 'index.md'), 'utf8');
    const glossary = fs.readFileSync(path.join(dir, '.memoc', 'wiki', 'glossary.md'), 'utf8');

    assert.match(wikiIndex, /## Graph Hubs/);
    assert.match(wikiIndex, /\[Wiki Lint\]\(lint\.md\)/);
    assert.match(glossary, /User-owned term should stay/);
    assert.doesNotMatch(glossary, /\[Wiki Index\]\(index\.md\)/);
  });
});
