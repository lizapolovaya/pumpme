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
- Supabase envs:
  - `PUMPME_SUPABASE_URL`
  - `PUMPME_SUPABASE_ANON_KEY`
  - `PUMPME_SUPABASE_SERVICE_ROLE_KEY`

The backend storage boundary lives under [lib/server/backend](/home/liza/pumpme/lib/server/backend). A Postgres-compatible schema reference for the future Supabase move is checked in at [lib/server/backend/db/supabase-schema.sql](/home/liza/pumpme/lib/server/backend/db/supabase-schema.sql).

### Supabase Setup

1. Create a Supabase project.
2. Run the SQL in [supabase-schema.sql](/home/liza/pumpme/lib/server/backend/db/supabase-schema.sql) inside the Supabase SQL editor to create tables.
3. Create a `.env.local` from `.env.example` and set:
   - `PUMPME_STORAGE_DRIVER=supabase`
   - `PUMPME_SUPABASE_URL=...`
   - `PUMPME_SUPABASE_SERVICE_ROLE_KEY=...` (recommended for development unless you have RLS policies configured)
4. Start the app with `npm run dev`.

### Optional Realtime

If you want browser-side realtime updates over Supabase Realtime/WebSockets, also set:

- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

Do not expose `PUMPME_SUPABASE_SERVICE_ROLE_KEY` in the browser. Realtime subscriptions should use an anon key with appropriate RLS policies.
