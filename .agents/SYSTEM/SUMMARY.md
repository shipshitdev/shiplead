# Shiplead System Summary

Shiplead is a self-hosted, local-first CRM + lead-gen + AI SDR cockpit for selling multiple open-source products and offers from one operator workspace.

## Current Shape

- Monorepo: Bun workspaces with Turbo
- Apps: `apps/api`, `apps/desktop`, `apps/web`
- Core packages: `shared`, `db`, `agents`, `channels`, `sequences`, `enrichment`
- Desktop: Electron operator cockpit using `@shipshitdev/ui`
- Web: static public landing page deployed to Vercel
- Data: SQLite with seeded demo workspace

## Product Surfaces

- Global desktop views: Tasks, Inbox, Activities
- Project tabs: Overview, Pipeline, Contacts, Companies
- Pipeline: lead-status kanban with persisted drag/drop through `PATCH /leads/:id/status`
- Contacts/Companies: desktop create modals
- Lead detail: right overlay panel from kanban card click

## Deployment

- GitHub repo: `https://github.com/shipshitdev/shiplead`
- Production web: `https://shiplead.shipshit.dev`
- Vercel project: `shipshitdev/shiplead.shipshit.dev`
- DNS: Route 53 `shipshit.dev` zone uses `*.shipshit.dev CNAME cname.vercel-dns.com` for Vercel subdomain fallback

## Important Constraints

- V1 is single-owner and self-hosted
- Public web must stay static unless a hosted API is added
- LinkedIn remains copilot/manual-send territory
- Route 53 record-set quota was 50/50 during setup; avoid adding one-off subdomain records unless quota is increased or old records are consolidated
