# Activity Tracker

A Vue 3 + Vite app for tracking media (movies, series, anime, games) with per-user
desire/rating scores, backed by Supabase.

## ⚠️ Testing rule (must follow)

**After every code change or new feature:**

1. **Write or update unit tests** covering the new/changed behavior.
2. **Run the full suite** with `npm test` and make sure it passes before considering
   the task done.

If a change makes a test obsolete, update it — don't delete coverage. Pure logic
(in `src/lib/`) should be tested directly; components are tested with
`@vue/test-utils`; composables that hit Supabase are tested with the client mocked.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run all unit tests once (CI mode) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run build` | Production build |

## Structure

- `src/views/` — page-level components (`LoginView`, `ListView`)
- `src/components/` — reusable UI (`CategoryFilter`, `EntryCard`, `AddModal`)
- `src/composables/` — shared reactive state (`useAuth`, `useEntries`, `useCategories`)
- `src/lib/` — framework-free helpers (`supabase` client, `entryUtils` filter/sort logic)
- `src/router/` — Vue Router with a hash history and an auth guard
- `supabase/migration.sql` — database schema, seed data, and the `login` RPC

## Git conventions

- **Branch names** use conventional commit prefixes: `feat/description`,
  `fix/description`, `refactor/description`, `chore/description`, `docs/description`,
  `test/description`.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat: add image search`, `fix: handle empty categories`, `chore: add Dockerfile`, etc.
  Use a scope when it adds clarity: `feat(auth): add change-password flow`.
  Keep the first line **under 25 words** — brief and to the point.

## Conventions

- **Tests** live next to the file they cover as `*.test.js`.
- **Pure logic goes in `src/lib/`** so it can be unit-tested without mounting components.
  When adding non-trivial filtering/sorting/derivation logic to a component, extract it
  here first, then test it.
- **Dynamic Tailwind color classes** (stored in the DB on `categories`) must be added to
  the `safelist` in `tailwind.config.js`, or Tailwind will purge them.
- Auth uses a custom `users` table + a Postgres `login` RPC (pgcrypto), not Supabase Auth.
  RLS is disabled on all tables for now.

## Image search (`src/lib/imageSearch.js`)

`searchImages()` merges up to 3 results each from, in priority order: **TMDB** (needs
`VITE_TMDB_KEY`), **Wikipedia**, **Fandom** (cross-wiki unified search), **Wikimedia
Commons**. All but TMDB are keyless and CORS-friendly. Each source fails soft (returns
`[]`) so one outage never breaks search.

**Do not reintroduce Google Custom Search** — it was abandoned: the user's `@altave.ai`
Google account / project plumbing kept returning `403 PERMISSION_DENIED` on the Custom
Search JSON API and we never got a working key. The keyless multi-source approach replaced it.
