// The System's routine messages, draft only. This turns a short briefing into a
// message in the tone a player chose and saves it in the player's own workspace.
// It never sends anything: there is no send function, and the player decides
// what leaves their machine. Players are referenced by a pseudonym only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { draftsDir } from './paths.mjs';

export const TONES = Object.freeze(['warm', 'direct', 'playful', 'formal']);
export const PLAYER_REF = /^p_[a-f0-9]{12}$/;
const MAX_BRIEFING_CHARS = 600;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /\+?\d[\d(). -]{8,}\d/;
const CREDENTIAL = /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|ntn_[0-9A-Za-z]{24,}|sk-(?:ant|or-v1)-[A-Za-z0-9_-]{20,})\b/;

const OPENERS = Object.freeze({
  warm: 'Thanks for being part of this. Here is your update.',
  direct: 'Here is your update.',
  playful: 'Quick update, and it is a good one.',
  formal: 'Please find your update below.',
});
const CLOSERS = Object.freeze({
  warm: 'Take your time. Your progress is yours to set.',
  direct: 'Reply to change how often you hear from us.',
  playful: 'See you on the next run.',
  formal: 'You may change these preferences at any time.',
});

export function draftRoutineMessage({ playerRef, tone, briefing }) {
  if (!PLAYER_REF.test(String(playerRef || ''))) return { state: 'REFUSED', code: 'PLAYER_REF_NOT_PSEUDONYMOUS' };
  if (!TONES.includes(tone)) return { state: 'REFUSED', code: 'TONE_NOT_RECOGNISED' };
  const text = String(briefing || '').trim();
  if (text.length === 0 || text.length > MAX_BRIEFING_CHARS) return { state: 'REFUSED', code: 'BRIEFING_LENGTH' };
  if (EMAIL.test(text) || PHONE.test(text)) return { state: 'REFUSED', code: 'BRIEFING_CONTAINS_PERSONAL_DATA' };
  if (CREDENTIAL.test(text)) return { state: 'REFUSED', code: 'BRIEFING_CONTAINS_CREDENTIAL' };
  const body = [OPENERS[tone], '', text, '', CLOSERS[tone]].join('\n');
  return {
    state: 'DRAFTED',
    draft: { playerRef, tone, text: body, status: 'DRAFT_NOT_SENT', createdAt: new Date().toISOString() },
  };
}

// Writes the draft into the player's own workspace with owner-only permissions.
// The draft is never sent from here.
export function writeDraft(draft, dir = draftsDir()) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, `${draft.playerRef}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}.json`);
  writeFileSync(file, `${JSON.stringify(draft, null, 2)}\n`, { mode: 0o600 });
  return file;
}
