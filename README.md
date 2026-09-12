# Seeger Weiss MCO Docket Dashboard (prototype)

Internal Managing Clerk's Office dashboard — a Court Alert-style tool for tracking
cases, dockets, files, deadlines, and calendar events across the firm's tracked
matters. Three role views: **Admin (Dev)**, **Managing Clerk**, **Lit Paralegal**,
switchable from the top bar.

**Status: first-draft prototype.** All case/docket/file/user data is synthetic —
no real firm data. DocketBird and CourtListener are not called live yet (see
below). The AI draft-assist feature calls Amazon Bedrock for real.

## Stack

- Vite + React 18 + TypeScript + Tailwind CSS v4, React Router
- Express (TypeScript, via `tsx`) as a small API server over the mock dataset
- `@aws-sdk/client-bedrock-runtime` for the "Draft with AI" reminder-email feature

```
shared/          Types, mock data (20 cases/dockets/files/users/events), and the
                 jurisdiction deadline-rules engine — imported by both client and server
server/          Express API (mock CRUD over the dataset + POST /api/draft -> Bedrock)
src/             React app (pages, components, context)
scripts/         One-off generator for the placeholder PDFs used by the file preview
```

## Setup

```bash
npm install
```

This project reads its config from environment variables. Writing `.env` files is
blocked by this machine's Claude Code permission settings, so create one yourself —
copy this into a new `.env` file in the project root:

```
PORT=5180
API_PORT=4000
DOCKETBIRD_API_KEY=
DOCKETBIRD_BASE_URL=https://api.docketbird.com/v1
COURTLISTENER_API_KEY=
COURTLISTENER_BASE_URL=https://www.courtlistener.com/api/rest/v4
AWS_PROFILE=AdministratorAccess-<your-account-id>
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
```

`AWS_PROFILE` must be an active IAM Identity Center SSO session (`aws sso login`) —
there is no static-key fallback, by design. `BEDROCK_MODEL_ID` defaults to a
cross-region inference profile; confirm the current one for your account with
`aws bedrock list-inference-profiles --region us-east-1` and update it if it drifts.

```bash
npm run dev       # runs Vite (5180) and the API (4000) together
npm run build     # type-check + production build
```

## What's real vs. mocked

- **Real:** the UI, the jurisdiction deadline-rules engine (computes real dates
  from real cited rules), and the Bedrock-backed "Draft with AI" reminder text.
- **Mocked:** DocketBird and CourtListener are not called — `server/index.ts`
  serves the synthetic dataset from `shared/mockData.ts` (in-memory; resets on
  restart). The API keys given for testing are stored by you locally in `.env`
  (never committed) and wired into `.env`'s shape for when live calls are added.
- **PDF previews** open real, generated placeholder PDFs (`public/sample-docs/`,
  one per file-tag category) — not the actual underlying court documents.

## Jurisdiction rules

`shared/rules/jurisdictions.ts` holds deadline and filing-format rules researched
against primary rule text (FRCP, JPML Rules of Procedure, and state civil rules)
for the jurisdictions used by the 20 seed cases: federal (12 rules across FRCP,
removal, appeal, and 8 district local-rule format entries), JPML (2 — CTO
opposition/vacate timing, current Feb 2026 renumbering), and state (9 — NJ, PA,
CA, DE, NY). Citations and sources are on each rule; entries with `days: 0` are
filing-format references (page/word/font limits) rather than countdown
deadlines. This is not a nationwide 50-state rule set — extend
`JURISDICTION_RULES` with the same shape for additional courts.

## Test data

20 cases spanning federal MDLs, standalone federal actions, matters pending
transfer before the JPML, and state coordinated-litigation programs (NJ MCL, PA
Complex Litigation Center, CA JCCP, DE, NY) — see `shared/mockData.ts`. Users:
Mark Garner (Managing Clerk) and Scott Siegal (Lit Paralegal) as named, plus
Firas Shaher (Admin) and four more supporting roles, all on `@seegerweiss.example`
addresses.

## Not done yet

- Live DocketBird / CourtListener calls (server has the env-var seams; no request
  code yet — see `server/index.ts`)
- Nationwide jurisdiction-rule coverage beyond the seed set above
- Persistence beyond the server process's memory (no database)
- Auth (the role switcher is a UI convenience, not access control)
