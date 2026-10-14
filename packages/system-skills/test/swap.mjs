#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { swapDirectory } from '../lib/swap.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'swap-'));
const write = (dir, name, body) => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), body);
};
const read = (dir, name) => fs.readFileSync(path.join(dir, name), 'utf8');

try {
  const source = path.join(tmp, 'source');
  const skills = path.join(tmp, 'skills');
  const staging = path.join(tmp, '.staging');
  const dest = path.join(skills, 'status');
  write(source, 'SKILL.md', 'new');

  // Fresh install
  assert.deepEqual(swapDirectory({ source, dest, stagingRoot: staging }), { replaced: false });
  assert.equal(read(dest, 'SKILL.md'), 'new');

  // Replace: old content gone, nothing left in the scanned directory but the skill itself
  write(source, 'SKILL.md', 'newer');
  assert.deepEqual(swapDirectory({ source, dest, stagingRoot: staging }), { replaced: true });
  assert.equal(read(dest, 'SKILL.md'), 'newer');
  assert.deepEqual(fs.readdirSync(skills), ['status'], 'scanned directory must hold only the skill');
  assert.deepEqual(fs.readdirSync(staging), [], 'a successful swap leaves no staging residue');

  // Missing source: destination untouched
  assert.throws(() => swapDirectory({ source: path.join(tmp, 'nope'), dest, stagingRoot: staging }));
  assert.equal(read(dest, 'SKILL.md'), 'newer');
  assert.deepEqual(fs.readdirSync(skills), ['status']);

  // Failure after the old copy is parked: the old copy comes back
  write(source, 'SKILL.md', 'broken');
  const failing = {
    ...fs,
    renameSync(from, to) {
      if (path.basename(from).includes('-new-')) throw new Error('simulated rename failure');
      return fs.renameSync(from, to);
    },
  };
  assert.throws(() => swapDirectory({ source, dest, stagingRoot: staging, fs: failing }), /simulated/);
  assert.equal(read(dest, 'SKILL.md'), 'newer', 'rollback must restore the previous install');
  assert.deepEqual(fs.readdirSync(skills), ['status'], 'rollback must not leave duplicates in the scanned directory');
  assert.deepEqual(fs.readdirSync(staging), [], 'rollback must clean its staged copy');

  console.log('PASS directory swap (fresh, replace, bad source, rollback)');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
