# pumpme

Next.js 16 fitness dashboard using the App Router, Tailwind CSS v4, and Progressive Web App support.

## Development

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`

## Backend Storage

- Default backend driver: `sqlite`
- Driver switch: `PUMPME_STORAGE_DRIVER=sqlite|supabase`
- SQLite path override: `PUMPME_SQLITE_PATH=/abs/path/to/pumpme.sqlite`
- Vercel default SQLite path: temp storage under `/tmp/pumpme.sqlite`
- Supabase envs reserved for the migration path:
  - `PUMPME_SUPABASE_URL`
  - `PUMPME_SUPABASE_ANON_KEY`
  - `PUMPME_SUPABASE_SERVICE_ROLE_KEY`

The backend storage boundary lives under [lib/server/backend](/home/liza/pumpme/lib/server/backend). A Postgres-compatible schema reference for the future Supabase move is checked in at [lib/server/backend/db/supabase-schema.sql](/home/liza/pumpme/lib/server/backend/db/supabase-schema.sql).
