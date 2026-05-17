const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'bin', 'cli.js');

function withTempProject(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memoc-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'sample-app' }), 'utf8');
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
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
        PATH: `${activePathBin}${path.delimiter}${process.env.PATH || ''}`,
      },
    });

    const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    assert.match(output, /PATH registration/);
    assert.match(agents, /Run memoc commands in this order/);
    assert.match(agents, /`memoc search "<query>"`/);
    assert.match(agents, /`\.\\\.memoc\\bin\\memoc\.cmd search "<query>"`/);
    assert.match(agents, /`\.memoc\/bin\/memoc search "<query>"`/);
    assert.match(agents, /`npx @kevin0181\/memoc search "<query>"`/);

    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'env.ps1')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'env.sh')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'bin', 'memoc.cmd')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'bin', 'memoc.ps1')));
    assert.ok(fs.existsSync(path.join(dir, '.memoc', 'bin', 'memoc')));
    assert.ok(fs.existsSync(path.join(userBin, 'memoc.cmd')));
    assert.ok(fs.existsSync(path.join(userBin, 'memoc.ps1')));
    assert.ok(fs.existsSync(path.join(userBin, 'memoc')));
    assert.ok(fs.existsSync(path.join(activePathBin, 'memoc.cmd')));
    assert.ok(fs.existsSync(path.join(activePathBin, 'memoc.ps1')));
    assert.ok(fs.existsSync(path.join(activePathBin, 'memoc')));
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
      },
    });

    assert.ok(fs.existsSync(path.join(userBin, 'memoc')));
    const profile = fs.readFileSync(path.join(home, '.profile'), 'utf8');
    assert.match(profile, /MEMOC_BIN=/);
    assert.match(profile, /fake home/);
  });
});
