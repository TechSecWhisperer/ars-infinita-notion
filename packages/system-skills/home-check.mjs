#!/usr/bin/env node
// Run the player's boot health verifier against JSON evidence.
// Reads one file argument or stdin. It never contacts Notion and never writes.

import fs from 'node:fs';
import { evaluatePlayerHomeCheck } from './lib/player-home-check.mjs';

const source = process.argv[2]
  ? fs.readFileSync(process.argv[2], 'utf8')
  : fs.readFileSync(0, 'utf8');

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
