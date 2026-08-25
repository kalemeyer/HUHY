# HUHY web application

This is the source for [huhyproject.org](https://huhyproject.org), the public front door for HUHY problem intake, the tool directory, project discovery, and steward review.

## Local development

Requirements:

- Node.js 22.13 or newer
- npm

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Local development uses a local Cloudflare D1 database and a local steward identity. Do not put credentials or sensitive information into local sample records.

## Validation

```bash
npm run lint
npm run build
```

Database schema changes are represented by checked-in SQL files under `drizzle/`. Generate a migration after changing `db/schema.ts`:

```bash
npm run db:generate
```

## Runtime configuration

The application runs on OpenAI Sites. The checked-in `.openai/hosting.json` is a non-production placeholder that allows local and continuous-integration builds; it is not the live Sites project binding. See `.env.example` for variable names. Secrets belong in the hosting provider's secret manager, never in source control.

The production site uses a GitHub App to create and synchronize approved public problem issues. Public submissions stay in a private safety-review queue until a steward or triager approves them.
