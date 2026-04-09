# Backend Storage

PumpMe's backend is structured so route handlers and pages talk to service contracts, and services talk to repository contracts. The active storage engine is chosen centrally through `getBackendConfig()` and `createBackendRepositories()`.

## Drivers

- `sqlite` is the current working datastore.
- `supabase` is a prepared migration target with explicit config validation and a repository provider slot.

## Environment

- `PUMPME_STORAGE_DRIVER=sqlite|supabase`
- `PUMPME_SQLITE_PATH=/abs/path/to/pumpme.sqlite`
- `PUMPME_SUPABASE_URL=...`
- `PUMPME_SUPABASE_ANON_KEY=...`
- `PUMPME_SUPABASE_SERVICE_ROLE_KEY=...`

If `PUMPME_SQLITE_PATH` is not set, local development uses `./data/pumpme.sqlite`. On Vercel, the backend falls back to `/tmp/pumpme.sqlite` so the app can run on a writable filesystem.

## Migration Path

1. Keep route handlers and pages on `createBackendServices()`.
2. Implement the repository methods under `lib/server/backend/repositories/supabase/`.
3. Create the corresponding tables in Supabase using [supabase-schema.sql](/home/liza/pumpme/lib/server/backend/db/supabase-schema.sql).
4. Switch `PUMPME_STORAGE_DRIVER` to `supabase` when the provider implementation is complete.

Until the Supabase repositories are implemented, selecting the `supabase` driver will fail with an explicit error naming the missing adapter.
