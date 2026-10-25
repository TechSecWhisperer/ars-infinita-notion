const topLevelFields = [
  'mechanics_version',
  'head',
  'generated',
  'source',
  'patches',
  'commands_count',
  'commands',
].sort();

const patchFields = [
  'version',
  'date',
  'type',
  'applies_to',
  'min_level',
  'title',
  'player_facing_summary',
].sort();

const semver = /^\d+\.\d+\.\d+$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const controlPlaneCopy = /\b(?:n8n|cron|bridge server|private source|player[- ]to[- ]admin(?: route| boundary)?|nightly sync|publish(?:ing)? command|admin(?:'s)? (?:workspace|repository|repo)|atomic installer|transactional rollback|proctor persona|ambient skill overlay|boot card|capability tiers?|agent runtimes?|5[- ]dimensional|evaluation matrix|zero running from memory|\bMCP\b|structural[- ]gate|catalog[- ]as[- ]code|vendor capabilities radar|multi[- ]client install sync|ASCII art|unrendered HTML|build(?:[- ]time)? check)\b/i;

function invalid(message) {
  throw new TypeError(`Invalid public feed: ${message}`);
}

function validDate(value) {
  if (typeof value !== 'string' || !isoDate.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validatePatch(patch, index) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) invalid(`patch ${index} must be an object`);
  if (Object.keys(patch).sort().join('\0') !== patchFields.join('\0')) invalid(`patch ${index} has an unsupported shape`);
  if (!semver.test(patch.version) || !validDate(patch.date)) invalid(`patch ${index} has invalid release identity`);
  if (!['Major', 'Minor', 'Patch'].includes(patch.type)) invalid(`patch ${index} has an invalid release type`);
  if (!['Available-from-now', 'Forward-only'].includes(patch.applies_to)) invalid(`patch ${index} has an invalid applicability`);
  if (!Number.isInteger(patch.min_level) || patch.min_level < 0) invalid(`patch ${index} has an invalid minimum level`);
  if (typeof patch.title !== 'string' || !patch.title.trim() || patch.title.length > 240) invalid(`patch ${index} has an invalid title`);
  if (typeof patch.player_facing_summary !== 'string' || !patch.player_facing_summary.trim()
      || patch.player_facing_summary.length > 2_000) invalid(`patch ${index} has an invalid player summary`);
  if (controlPlaneCopy.test(patch.title) || controlPlaneCopy.test(patch.player_facing_summary)) {
    invalid(`patch ${index} contains non-player release wording`);
  }
}

export function assertPlayerFeedContract(feed) {
  if (!feed || typeof feed !== 'object' || Array.isArray(feed)) invalid('root must be an object');
  if (Object.keys(feed).sort().join('\0') !== topLevelFields.join('\0')) invalid('unsupported root fields');
  if (!semver.test(feed.mechanics_version) || feed.head !== feed.mechanics_version) invalid('release versions do not match');
  if (!validDate(feed.generated)) invalid('generated date is invalid');
  if (feed.source !== 'The System — Nexus Patch Feed') invalid('source label is invalid');
  if (!Array.isArray(feed.patches) || feed.patches.length === 0) invalid('patches must be a non-empty array');
  feed.patches.forEach(validatePatch);
  if (!Array.isArray(feed.commands) || feed.commands.some((command) => typeof command !== 'string'
      || !/^\/[a-z][a-z0-9-]*$/.test(command))) invalid('commands must be player command names');
  if (new Set(feed.commands).size !== feed.commands.length) invalid('commands must be unique');
  if (!Number.isInteger(feed.commands_count) || feed.commands_count !== feed.commands.length) {
    invalid('commands_count does not match commands');
  }
  return feed;
}

export function rewritePlayerFeedCommands(feedText, commandNames) {
  let input;
  try { input = JSON.parse(feedText); } catch { invalid('source is not valid JSON'); }
  assertPlayerFeedContract(input);
  const count = `  "commands_count": ${commandNames.length},`;
  const block = `${count}\n  "commands": [\n${commandNames.map((name) => `    ${JSON.stringify(name)}`).join(',\n')}\n  ]`;
  const pattern = /  "commands_count": \d+,\n  "commands": \[\n(?:.*\n)*?  \]|  "commands": \[\n(?:.*\n)*?  \]/;
  if (!pattern.test(feedText)) throw new Error('feed.json: could not locate the commands array');
  const output = feedText.replace(pattern, block);
  let parsed;
  try { parsed = JSON.parse(output); } catch { throw new Error('feed.json: generated output is not valid JSON'); }
  assertPlayerFeedContract(parsed);
  return output;
}
