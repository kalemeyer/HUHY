# HUHY Reddit Guide

HUHY Reddit Guide is a moderator-configured community assistant. It replies when a community member explicitly types `!huhy`, and it also lets a moderator prepare and review a reply manually.

It does not scrape Reddit, call an LLM, send private messages, or contact an external service. It reads only submission events inside the installed subreddit, ignores content without the explicit command, and does not store post or comment text. Guidance, the latest manual draft, and short-lived anti-duplicate keys remain inside the installation-scoped Devvit Redis store. Standing guidance expires after 90 days and the latest manual draft after seven days.

## Status

Private Reddit playtest. The registered Devvit app `huhy-guide` is installed
only in a private development community. The community name and operator
account are intentionally not part of the public source. No public community
installation or App Directory launch is claimed.

## Moderator workflow

1. From the subreddit menu, choose **HUHY: set guidance**.
2. Set the exact public opening and closing, internal reviewer direction, public destination, and tone. Automatic replies start off and remain off until a moderator deliberately enables them.
3. A community member can invoke the guide by typing `!huhy`, optionally followed by `clarify`, `research`, `invite`, `refer`, or `not-now`.
4. The bot posts the corresponding response using the saved public guidance. It responds at most once per source and applies a one-minute per-author cooldown.
5. For a custom response, choose **HUHY: draft a reply** from a post or comment.
6. Select a disposition and add only public, non-sensitive facts.
7. Review and edit the generated reply. Marking it reviewed does not post it.
8. Use **HUHY: clear stored data** to delete the installation's saved guidance and latest draft.

The current prototype stores one standing guidance record for at most 90 days and the latest draft for at most seven days per subreddit installation. This deliberately small data surface makes deletion and review straightforward.

## Safety boundary

PUBLICLY RELEASED, UNCLASSIFIED INFORMATION ONLY.

Do not enter CAC data, `.mil`-only links or APIs, PII, PHI, CUI, readiness or operational data, credentials, internal screenshots, or sensitive uploads. The manual-draft pattern screen is a guardrail, not a classification or privacy determination. Automatic responses use fixed copy and never repeat the invoking post or comment.

HUHY is independent and unofficial. It does not represent or imply endorsement by the Department of the Air Force, Department of Defense, any unit, or any existing builder community.

## Local validation

Requires Node.js 24 or newer.

```bash
npm install
npm run check
npm run format:check
```

## Reddit connection and release gate

Connection is a separate external step:

Completed for the private playtest; specific operator and community identifiers are kept out of the public repository:

1. Registered the `huhy-guide` Devvit app.
2. Uploaded the private playtest after local validation.
3. Installed it in a private test community.
4. Verified the moderator-only guidance, review, and deletion menu controls.

Still gated:

1. Obtain moderator sponsorship before proposing installation in another community.
2. Review the app's effective permissions and dependency advisories before wider use.
3. Do not publish to the App Directory or install in a public community without explicit approval.

Reddit requires API approval and transparent, policy-compliant data use. An installing moderator controls the community installation. See Reddit's [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy), [Mod Tool quickstart](https://developers.reddit.com/docs/quickstart/quickstart-mod-tool), and [Devvit menu actions](https://developers.reddit.com/docs/capabilities/client/menu-actions).
