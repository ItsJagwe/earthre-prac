# SLA Monitoring Dashboard

Next.js foundation for the SLA monitoring take-home assignment.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Both are client-safe values.

## Database

Apply `supabase/migrations/001_create_monitoring_checks.sql` to your Supabase project with `npx supabase db push` or by running the SQL in the Supabase SQL editor. The table starts empty.
