# Shiplead

Open-source, self-hosted, agentic CRM + lead + SDR system for running multiple products, offers, and brands from one cockpit.

## Monorepo

```text
apps/
  api/       HTTP API, orchestration, demo data, search, inbox, sequences
  desktop/   Electron operator cockpit
  web/       Next.js web surface
packages/
  agents/      bounded AI SDR helpers
  channels/    email, X, LinkedIn copilot adapters
  db/          SQLite schema + queries
  enrichment/  lead enrichment provider contract
  sequences/   cadence engine
  shared/      types, schemas, constants
  ui/          shared React primitives
```

## Install

```bash
brew tap shipshitdev/tap
brew install --cask shiplead
```

## CLI

```bash
npx @shipshitdev/shiplead status
npx @shipshitdev/shiplead serve
```

## Run From Source

```bash
bun install
bun run dev:api
bun run dev:desktop
bun run dev:web
```

Default API URL: `http://127.0.0.1:4280`

The API auto-seeds a local demo workspace on first run into `.data/shiplead.db`.
