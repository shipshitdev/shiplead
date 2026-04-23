# MEMORY.md — ShipLead Long-Term Memory

## Workspace

- Bootstrapped on 2026-04-22 from an empty directory at `/Users/decod3rs/www/shipshitdev/public/shiplead`

## Known Facts

- The workspace now contains a Bun/Turbo monorepo with `apps/api`, `apps/web`, `apps/desktop`, and shared packages for `db`, `shared`, `agents`, `channels`, `sequences`, `enrichment`, and `ui`
- The first implementation milestone is local-first and single-owner: multi-project CRM, task queue, search, inbox, activities, opportunities, sequences, and bounded AI helper endpoints
- The API auto-seeds demo data into `.data/shiplead.db` and is expected at `http://127.0.0.1:4280` by default
- The desktop cockpit follows ShipCode interaction patterns: New Task is a real modal, Search is a command palette, and shared UI comes from `@shipshitdev/ui`
- Desktop navigation convention: Tasks/Inbox/Activities are global; sidebar projects stay flat; the selected project view uses ShipCode-style tabs for Overview, Pipeline, Contacts, and Companies; Pipeline is a lead-status kanban board
- Pipeline tab convention: no metric cards above the board; kanban columns fill available height with equal weight; clicking a lead opens a right overlay detail panel
- Desktop CRUD convention: Companies and Contacts are created from project tabs with modal forms; contact creation can create a manual lead in the selected project when offer/company context exists
- Lead status moves are persisted through `PATCH /leads/:id/status`, update optimistically in desktop, and write `stage-changed` activity records
- The parent `shipshitdev` git worktree already had unrelated uncommitted changes at session start

## Open Direction

- Next meaningful work is real provider integrations: email/X accounts, CSV import, enrichment adapters, and deeper CRUD/editor flows in desktop/web
