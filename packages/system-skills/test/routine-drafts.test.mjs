import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { draftRoutineMessage, writeDraft, TONES } from '../lib/routine-drafts.mjs';
import { draftsDir, systemHome } from '../lib/paths.mjs';

const REF = 'p_0123456789ab';

test('a pseudonymous player and a known tone produce a draft that is marked not sent', () => {
  const r = draftRoutineMessage({ playerRef: REF, tone: 'warm', briefing: 'Your streak is safe for today.' });
  assert.equal(r.state, 'DRAFTED');
  assert.equal(r.draft.status, 'DRAFT_NOT_SENT');
  assert.ok(r.draft.text.includes('Your streak is safe for today.'));
});

test('every tone has an opener and a closer', () => {
  assert.deepEqual([...TONES], ['warm', 'direct', 'playful', 'formal']);
  for (const tone of TONES) {
    const r = draftRoutineMessage({ playerRef: REF, tone, briefing: 'Update.' });
    assert.equal(r.state, 'DRAFTED', tone);
  }
});

test('a name or an email in place of a pseudonym is refused', () => {
  assert.equal(draftRoutineMessage({ playerRef: 'Ada Lovelace', tone: 'warm', briefing: 'x' }).code, 'PLAYER_REF_NOT_PSEUDONYMOUS');
  assert.equal(draftRoutineMessage({ playerRef: 'ada@example.com', tone: 'warm', briefing: 'x' }).code, 'PLAYER_REF_NOT_PSEUDONYMOUS');
});

test('an unknown tone is refused', () => {
  assert.equal(draftRoutineMessage({ playerRef: REF, tone: 'sarcastic', briefing: 'x' }).code, 'TONE_NOT_RECOGNISED');
});

test('a briefing with personal data or a credential is refused, and an empty or long one too', () => {
  assert.equal(draftRoutineMessage({ playerRef: REF, tone: 'warm', briefing: 'mail me at ada@example.com' }).code, 'BRIEFING_CONTAINS_PERSONAL_DATA');
  assert.equal(draftRoutineMessage({ playerRef: REF, tone: 'warm', briefing: 'call +61 400 123 456' }).code, 'BRIEFING_CONTAINS_PERSONAL_DATA');
  assert.equal(draftRoutineMessage({ playerRef: REF, tone: 'warm', briefing: `key gh${'p'}_${'a'.repeat(30)}` }).code, 'BRIEFING_CONTAINS_CREDENTIAL');
  assert.equal(draftRoutineMessage({ playerRef: REF, tone: 'warm', briefing: '   ' }).code, 'BRIEFING_LENGTH');
  assert.equal(draftRoutineMessage({ playerRef: REF, tone: 'warm', briefing: 'x'.repeat(601) }).code, 'BRIEFING_LENGTH');
});

test('the module has no send path: it exports only drafting and local writing', async () => {
  const mod = await import('../lib/routine-drafts.mjs');
  assert.deepEqual(Object.keys(mod).sort(), ['PLAYER_REF', 'TONES', 'draftRoutineMessage', 'writeDraft']);
});

test('a draft is written to the given folder with owner-only permissions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'routine-drafts-test-'));
  try {
    const r = draftRoutineMessage({ playerRef: REF, tone: 'direct', briefing: 'Update.' });
    const file = writeDraft(r.draft, dir);
    assert.ok(file.startsWith(dir));
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).status, 'DRAFT_NOT_SENT');
    assert.equal(statSync(file).mode & 0o777, 0o600);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("the default drafts folder is in the player's own System home, and both can be overridden", () => {
  const saved = { home: process.env.SYSTEM_HOME, drafts: process.env.SYSTEM_DRAFTS_DIR };
  try {
    delete process.env.SYSTEM_HOME;
    delete process.env.SYSTEM_DRAFTS_DIR;
    assert.equal(systemHome(), join(homedir(), '.the-system'));
    assert.equal(draftsDir(), join(homedir(), '.the-system', 'routine-drafts'));
    process.env.SYSTEM_HOME = '/tmp/player-home';
    assert.equal(draftsDir(), join('/tmp/player-home', 'routine-drafts'));
    process.env.SYSTEM_DRAFTS_DIR = '/tmp/player-drafts';
    assert.equal(draftsDir(), '/tmp/player-drafts');
  } finally {
    for (const [key, value] of [['SYSTEM_HOME', saved.home], ['SYSTEM_DRAFTS_DIR', saved.drafts]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
