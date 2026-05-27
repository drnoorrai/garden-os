# Garden OS

Garden OS is a calm, local-first personal operating system for intentional living. V1 centers on one useful question each morning: **what matters today?**

The product is deliberately smaller than a productivity suite. `Today` is the home screen and the other areas exist to inform it: movement in `Train`, thinking in `Think`, commitments in `Work`, nourishment in `Eat`, and an evening reflection loop.

## V1 Experience

- A Today dashboard built around the 1-3-5 rule and Ivy Lee execution order.
- Editable, reorderable and completable daily priorities, with one-click deferral to tomorrow.
- A deterministic daily briefing and realistic available-focus-hours prompt.
- Lightweight Train, Think, Work and Eat cards on Today, with focused supporting routes.
- GTD inbox capture, impact/effort strategic bets, simple Kanban and MoSCoW scope boundaries.
- Clarity coaching sessions and Field Notes.
- Evening review persistence and derived weekly review.
- Realistic first-use data, stored locally in the browser.

## Routes

| Route | Purpose |
| --- | --- |
| `/today` | Daily control centre and default landing page |
| `/train` | Today's movement and light history |
| `/think`, `/think/clarity`, `/think/field-notes` | Reflection sessions and notes |
| `/work`, `/work/inbox`, `/work/bets`, `/work/kanban` | Execution and strategic scope |
| `/eat` | Protein target, meal idea, hydration and meal log |
| `/review` | Evening review |
| `/weekly-review` | Weekly reflection summary |
| `/settings` | Local profile preferences and demo reset |

## Architecture

This is a pnpm workspace using React, TypeScript, Vite and Tailwind CSS.

```text
apps/
  web/          React app shell, routes and feature views
packages/
  ai/           Deterministic daily briefing logic
  domain/       Seed data and daily planning rules
  storage/      Local storage adapter and Supabase placeholder
  types/        Shared product contracts
  ui/           Small shadcn-style primitive component set
docs/design/    Today-screen visual reference
```

Data stays local by default through `localStorageAdapter`. `supabaseAdapter` is intentionally a typed placeholder for a future synchronization layer; no account or backend is required for V1.

## Frameworks Encoded

- **1-3-5 Rule:** one big task, three medium tasks and five small tasks on Today.
- **Ivy Lee:** order carries meaning; the first incomplete priority is next.
- **GTD:** Work Inbox captures and triages loose commitments.
- **Action Priority Matrix:** bets are classified from impact and effort.
- **Kanban:** a compact board for execution flow.
- **MoSCoW:** visible project scope decisions prevent V1 overbuilding.

## Development

Requirements: Node.js 20+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Vite serves the app locally and redirects `/` to `/today`.

Validation:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Configuration

Copy `.env.example` only when exploring future synchronization. The local-first application does not require environment variables.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Product Boundary

The V1 modules are orchestration views, not replacements for Noor Rai's deeper training, task, bets, clarity or Field Notes projects. Integration can follow once the daily operating loop proves useful.
