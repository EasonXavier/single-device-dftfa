# Repository rename audit

## Operation

- Operation ID: `repo-rename-2026-07-29-single-device-dftfa`
- Status: `prepared`
- Repository ID: `1227244603`
- Default branch: `main`
- Visibility: `public`
- Prepared at: `2026-07-29T07:21:52+08:00` (`2026-07-28T23:21:52Z`)
- Baseline commit: `2bfc9b330495392771651f4c618dc6690da30ded`
- Old repository: `EasonXavier/singledeviceDFTFA`
- New repository: `EasonXavier/single-device-dftfa`
- Old repository URL: `https://github.com/EasonXavier/singledeviceDFTFA`
- New repository URL: `https://github.com/EasonXavier/single-device-dftfa`
- Old Pages URL: `https://easonx.me/singledeviceDFTFA/`
- New Pages URL: `https://easonx.me/single-device-dftfa/`

## Preflight findings

- Application HTML, scripts, styles, and fonts use relative paths and do not require runtime changes.
- `window.location` usage derives the active host and path dynamically.
- The README contains repository directory, command, setup, and Pages URL examples that must use the new technical name.
- The `singledeviceDFTFA` product title and console prefixes are brand text and remain unchanged by decision.
- No GitHub Actions consumer, submodule, package coordinate, raw-content URL, or API endpoint references this repository by its old name in the owner's other repositories.
- The owner chose a direct Pages cutover. The old project Pages URL is not retained by a compatibility redirect.

## Planned changes

1. Commit this audit and the README technical-reference updates on `main`.
2. Rename the GitHub repository to `single-device-dftfa`.
3. Update `origin` to the new repository URL.
4. Append the actual rename time, commits, and verification evidence to this file.
5. Push the completion record to trigger a Pages deployment and verify the new URL.

## Rollback

1. Rename the GitHub repository back to `singledeviceDFTFA`.
2. Set `origin` to `https://github.com/EasonXavier/singledeviceDFTFA.git`.
3. Restore README repository-directory, command, setup, and Pages URL examples.
4. Append a rollback event to this audit file; do not delete the audit history.
5. Commit and push the rollback record to `main`.
6. Verify `https://easonx.me/singledeviceDFTFA/` returns HTTP 200 and serves the application.

Do not create a new repository using the old name because doing so would break GitHub's repository redirect.
