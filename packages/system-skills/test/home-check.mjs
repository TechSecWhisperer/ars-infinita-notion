#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluatePlayerHomeCheck } from '../lib/player-home-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', name), 'utf8'));

const pass = evaluatePlayerHomeCheck(fixture('player-home-check-pass.json'));
assert.equal(pass.outcome, 'PASS');
assert.equal(pass.exitCode, 0);

const fail = evaluatePlayerHomeCheck(fixture('player-home-check-fail.json'));
assert.equal(fail.outcome, 'FAIL');
assert.equal(fail.exitCode, 1);
assert.ok(fail.checks.some((check) => check.name === 'rule-surfaces' && check.outcome === 'FAIL'));

const unknown = evaluatePlayerHomeCheck(fixture('player-home-check-unknown.json'));
assert.equal(unknown.outcome, 'UNKNOWN');
assert.equal(unknown.exitCode, 2);

const missing = evaluatePlayerHomeCheck({});
assert.equal(missing.outcome, 'UNKNOWN');
assert.equal(missing.exitCode, 2);
assert.notEqual(missing.exitCode, 0, 'missing evidence must not be healthy');

console.log('PASS player-home-check fixtures (PASS, FAIL, UNKNOWN)');
