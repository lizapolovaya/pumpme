# Backend Storage

PumpMe's backend is structured so route handlers and pages talk to service contracts, and services talk to repository contracts. The active storage engine is chosen centrally through `getBackendConfig()` and `createBackendRepositories()`.

## Drivers

- `sqlite` is the current working datastore.
- `supabase` is a Postgres-backed datastore via Supabase. The repository adapters live under `lib/server/backend/repositories/supabase/`.

## Environment

- `PUMPME_STORAGE_DRIVER=sqlite|supabase`
- `PUMPME_SQLITE_PATH=/abs/path/to/pumpme.sqlite`
- `PUMPME_SUPABASE_URL=...`
- `PUMPME_SUPABASE_ANON_KEY=...`
- `PUMPME_SUPABASE_SERVICE_ROLE_KEY=...`

If `PUMPME_SQLITE_PATH` is not set, local development uses `./data/pumpme.sqlite`. On Vercel, the backend falls back to `/tmp/pumpme.sqlite` so the app can run on a writable filesystem.

## Migration Path

1. Keep route handlers and pages on `createBackendServices()`.
2. Create the corresponding tables in Supabase using [supabase-schema.sql](/home/liza/pumpme/lib/server/backend/db/supabase-schema.sql).
3. Switch `PUMPME_STORAGE_DRIVER` to `supabase` and configure `PUMPME_SUPABASE_URL` + a key.

Note: the current Supabase adapter assumes server-side access (API routes / server components) and works best with `PUMPME_SUPABASE_SERVICE_ROLE_KEY` unless you have RLS policies in place.

Client-side realtime is separate from the server adapter. If you subscribe from the browser, use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and keep the service role key server-only.
