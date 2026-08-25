# HUHY

HUHY (Help Us Help You) is the public community repository for an independent,
unofficial Airman builder community. It turns publicly released, non-sensitive
problems into visible, reviewable work.

Start at [huhyproject.org](https://huhyproject.org). The website performs the
initial safety screen. Only a safety-reviewed, steward-approved public brief is
created here as a project issue.

## Information boundary

**PUBLICLY RELEASED, UNCLASSIFIED INFORMATION ONLY.**

Do not include CAC data, `.mil`-only APIs, PII, PHI, CUI, operational or
readiness data, credentials, internal screenshots, sensitive uploads, or
information whose release status is uncertain. “Unclassified” alone is not
enough.

If sensitive information appears, stop work, do not quote or copy it, and use
the private reporting path in [SECURITY.md](SECURITY.md).

## Workflow

1. A problem enters the HUHY website&apos;s private safety queue.
2. A steward screens it for the public-information boundary.
3. Approved work is published here with its HUHY record ID and source status.
4. GitHub labels track the visible project state.
5. Pull requests, reviews, releases, and maintainer ownership stay in GitHub.
6. The HUHY website reads current GitHub state for the approachable board.

The private intake record remains on the HUHY website. GitHub receives only the
approved public problem brief.

The website authenticates as a narrowly scoped GitHub App installed on this
repository. The app requests repository metadata read access and Issues
read/write access. It uses short-lived installation tokens; no personal GitHub
token is stored by HUHY.

## Repository map

- [`apps/web`](apps/web) — public source for the HUHY website
- [`apps/reddit-guide`](apps/reddit-guide) — moderator-controlled Reddit guide playtest
- [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) — reviewed project and public defect workflows
- [`GOVERNANCE.md`](GOVERNANCE.md) — disposition and decision authority
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution provenance and validation
- [`docs/GITHUB-STARTER.md`](docs/GITHUB-STARTER.md) — first-time and no-code contributor guide
- [`SECURITY.md`](SECURITY.md) — sensitive-information and vulnerability reporting

## Reddit guide prototype

[`apps/reddit-guide`](apps/reddit-guide) contains a moderator-configured Reddit
assistant in a private playtest. It responds to an explicit `!huhy` command
with fixed, moderator-controlled copy, and it retains the supervised manual
draft workflow for custom responses. It does not store Reddit content, scrape,
send private messages, call external HTTP services, or use an LLM.

The `huhy-guide` app is registered and installed only in a private development
community. The community and operator identifiers are intentionally not part
of the public source. It has not been published to the App Directory or
installed in a public community. Moderator sponsorship and explicit release
approval remain separate gates.

## Status labels

The website recognizes labels beginning with `huhy:`:

- `huhy:submitted`
- `huhy:clarifying`
- `huhy:researching`
- `huhy:ready-for-decision`
- `huhy:approved-for-incubation`
- `huhy:building`
- `huhy:released`
- `huhy:not-now`
- `huhy:referred`
- `huhy:declined`

See [GOVERNANCE.md](GOVERNANCE.md), [CONTRIBUTING.md](CONTRIBUTING.md), and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before changing status or contributing.

## Disclaimer

HUHY is not part of, sponsored by, endorsed by, or operated on behalf of the
Department of Defense, Department of the Air Force, U.S. Air Force, U.S. Space
Force, or any other government agency. No official seal, symbol, unit insignia,
or endorsement is claimed.

## License

HUHY source and documentation in this repository are available under the
[MIT License](LICENSE). That license applies only to material HUHY has the right
to license. Linked external tools remain under their owners&apos; terms.
