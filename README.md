# Garden OS

Garden OS is a calm, local-first operating system for intentional living.

V2 turns the product into a modular orchestration layer: `Work` is the capture-first control centre, while `Train`, `Think` and `Eat` remain independently owned domain modules.

The product goal is simple: opening the app should make life feel organized.

## V2 Experience

- `Work` is the default surface for quick capture, content development, relationship context, shared prioritization and execution.
- `/` is a public, Quick Capture-led landing page for creators, partners, operators and anyone turning mental clutter into organized context.
- New private workspaces start fresh after login, with example content kept out of account data.
- First-run onboarding explains Quick Capture, universal object pages and private/shared workspaces before opening the workspace.
- The local mock includes `My Garden` and a shared `Noor + Sonum` Partner Garden while preserving the existing local-first JSON sync model.
- Quick Capture includes a `Content` category that feeds a dedicated `/work/content` development lane.
- Quick Capture includes `Person` and `Company` categories that feed a dedicated `/work/relationships` CRM-style lane.
- Shared Quick Capture can also send items directly into `/work/task-garden`.
- Universal Object Pages give people, companies, content ideas, field notes and sources one shared pattern for summaries, notes, links, related objects, backlinks, activity and next actions.
- Universal Object Pages now show workspace, visibility, comments and shared next actions.
- Pasted YouTube, podcast and news links become source objects for timestamped notes and content idea generation.
- `Train` brings the core Tension experience into Garden OS: workout templates, session flow, movement system, hard-set volume, phase-aware targets and history.
- `Think` combines Clarity, Field Notes, Journal, Decisions and Mental Models into one private thinking system.
- `Work` unifies GTD capture, content development, relationship context, Task Garden execution, MoSCoW project scope and weekly sprint focus.
- `Eat` stays intentionally lightweight: protein, hydration, meal planning, groceries and energy awareness.
- Existing V1 local data is preserved by a migration layer and expanded with V2 defaults.

## Architecture

This is a pnpm workspace using React, TypeScript, Vite and Tailwind CSS.

```text
apps/
  web/              React app shell, shared layout and lazy module routes
packages/
  auth/             Supabase Auth provider, login screen and route guard
  ai/               Public deterministic intelligence API
  design-system/    Shared module headers, tabs and stats
  domain/           Seed data, daily planning rules and object graph helpers
  shared-state/     GardenProvider, UserContext and V1-to-V2 migration
  storage/          Local storage adapter and Supabase sync adapter
  today-engine/     Cross-module Today intelligence
  types/            Shared product contracts
  ui/               Small shadcn-style primitive component set
modules/
  train/            Tension-inspired training domain
  think/            Clarity, notes, journal, decisions and mental models
  work/             Inbox, content, relationships, shared Task Garden, execution and projects
  eat/              Meals, groceries, hydration and protein
```

Each module owns its route surface, components, state updates and domain logic. Shared packages contain only cross-cutting contracts and infrastructure.

## Module Contract

Every module exports `getTodaySummary(data)` from its `summary` entrypoint:

```ts
import { getTodaySummary as getTrainSummary } from "@garden/module-train/summary";
```

`Today` consumes these summaries, combines them with `UserContext`, and calls `buildTodayIntelligence()` from `@garden/ai`.

The current AI layer is deterministic by design. It produces summaries, recommendations, warnings, suggested focus, recovery guidance and tomorrow-planning prompts without a live model dependency.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public Quick Capture-led landing page |
| `/login` | Email magic-link and Google sign-in |
| `/onboarding` | First-run walkthrough for fresh private workspaces |
| `/today` | Legacy redirect to `/work` |
| `/train`, `/train/session`, `/train/history`, `/train/settings` | Training week, workout flow, history and structure |
| `/think` | Thinking system overview |
| `/think/clarity` | Guided clarity sessions |
| `/think/field-notes` | Knowledge capture and search |
| `/think/journal` | Daily reflection |
| `/think/decisions` | Decision log |
| `/think/models` | Mental models |
| `/work` | Work overview |
| `/work/inbox` | GTD capture and triage |
| `/work/content` | Content idea development |
| `/work/relationships` | People and companies CRM-style context |
| `/work/task-garden` | Shared 3-zone Task Garden: Do Now, Develop, Ask / Delegate |
| `/work/execute` | Task Garden-style Kanban execution, with weekly focus and capacity |
| `/work/projects` | MoSCoW project scope |
| `/objects/person/:id`, `/objects/company/:id` | Universal relationship object pages |
| `/objects/content/:id` | Universal content idea page |
| `/objects/note/:id` | Universal field note page |
| `/objects/source/:id` | Universal source page with manual timestamp notes |
| `/eat`, `/eat/plan`, `/eat/groceries` | Nutrition support |
| `/review` | Evening review |
| `/weekly-review` | Weekly reflection summary |
| `/settings` | Local profile preferences and demo reset |

Legacy work routes `/work/prioritize`, `/work/bets`, `/work/kanban` and `/work/sprint` redirect to active Work surfaces.

## Development

Requirements: Node.js 20+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Vite serves the app locally. `/` is the public landing page and private users land on `/work` after onboarding.

Validation:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Storage

Garden OS is local-first. Public examples live on the landing page, while private user workspaces use fresh local data keyed by account when authentication is not configured.

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, signed-in users sync through `public.garden_data`. Local data is still cached so the app remains resilient, and first sign-in migrates an existing local Garden into the user's private Supabase row if one exists.

## Authentication

Garden OS supports Supabase Auth for email magic-link login and Google OAuth.

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, the app requires a signed-in user and exposes `/login`. When those values are empty, Garden OS runs in local demo mode so development and review still work without a backend.

In Supabase, configure:

- Email provider enabled for magic links.
- Google provider enabled with a Google OAuth Client ID and Client Secret.
- Site URL: `https://garden-os.pages.dev`
- Redirect URLs: `https://garden-os.pages.dev/**` and `http://localhost:5173/**`
- Apply the migration in `supabase/migrations` to create `public.garden_data` with RLS and authenticated-only row access.

## Configuration

Copy `.env.example` to configure hosted authentication.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
