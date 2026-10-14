// Transactional directory swap shared by the Codex and agy installers.
//
// Staging and parking happen under `stagingRoot`, which callers place OUTSIDE the
// directory the target CLI scans. A crash mid-swap therefore leaves a hidden
// folder behind, never a second copy of a skill that the CLI would load.
// `stagingRoot` must be on the same filesystem as `dest` so that rename is atomic.
import nodeFs from 'node:fs';
import path from 'node:path';

/**
 * Replace `dest` with a copy of `source`, restoring the previous `dest` if
 * anything fails after it has been moved aside. Scope is one directory: this is
 * not a transaction across several destinations.
 *
 * @returns {{ replaced: boolean }} whether a previous `dest` was swapped out
 */
export function swapDirectory({ source, dest, stagingRoot, fs = nodeFs }) {
  const stamp = `${Date.now()}-${process.pid}`;
  const name = path.basename(dest);
  const staged = path.join(stagingRoot, `${stamp}-new-${name}`);
  const parked = path.join(stagingRoot, `${stamp}-old-${name}`);

  fs.mkdirSync(stagingRoot, { recursive: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  try {
    fs.cpSync(source, staged, { recursive: true });
  } catch (err) {
    fs.rmSync(staged, { recursive: true, force: true });
    throw err;
  }

  const replaced = fs.existsSync(dest);
  try {
    if (replaced) fs.renameSync(dest, parked);
    fs.renameSync(staged, dest);
  } catch (err) {
    fs.rmSync(staged, { recursive: true, force: true });
    if (replaced && !fs.existsSync(dest) && fs.existsSync(parked)) {
      fs.renameSync(parked, dest);
    }
    throw err;
  }

  if (replaced) fs.rmSync(parked, { recursive: true, force: true });
  return { replaced };
}
