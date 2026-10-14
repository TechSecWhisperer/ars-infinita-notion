#!/usr/bin/env node
// Run the player's boot health verifier against JSON evidence.
// Reads one file argument or stdin. It never contacts Notion and never writes.

import fs from 'node:fs';
import { evaluatePlayerHomeCheck } from './lib/player-home-check.mjs';

const argument = process.argv[2] === 'home-check' ? process.argv[3] : process.argv[2];
// Evidence that cannot be read is UNKNOWN (exit 2), the same as evidence that is
// missing from the JSON. An uncaught read error would exit 1, which means FAIL.
let source;
try {
  source = argument ? fs.readFileSync(argument, 'utf8') : fs.readFileSync(0, 'utf8');
} catch (error) {
  console.error(`UNKNOWN evidence could not be read: ${error.message}`);
  process.exit(2);
}

let evidence;
try {
  evidence = JSON.parse(source);
} catch (error) {
  console.error(`UNKNOWN invalid evidence: ${error.message}`);
  process.exit(2);
}

const result = evaluatePlayerHomeCheck(evidence);
console.log(JSON.stringify(result, null, 2));
process.exit(result.exitCode);
