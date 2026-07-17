#!/bin/sh
# emdash captures the Postgres connectionString at BUILD time (undefined in the
# image build), so at runtime node-postgres falls back to PG* env vars. Derive
# them from DATABASE_URL so a single injected connection string just works.
set -e
if [ -n "$DATABASE_URL" ]; then
  export PGHOST=$(node -e 'process.stdout.write(new URL(process.env.DATABASE_URL).hostname)')
  export PGPORT=$(node -e 'const u=new URL(process.env.DATABASE_URL);process.stdout.write(u.port||"5432")')
  export PGUSER=$(node -e 'process.stdout.write(decodeURIComponent(new URL(process.env.DATABASE_URL).username))')
  export PGPASSWORD=$(node -e 'process.stdout.write(decodeURIComponent(new URL(process.env.DATABASE_URL).password))')
  export PGDATABASE=$(node -e 'process.stdout.write(new URL(process.env.DATABASE_URL).pathname.replace(/^\//,""))')
  MODE=$(node -e 'process.stdout.write(new URL(process.env.DATABASE_URL).searchParams.get("sslmode")||"")')
  [ -n "$MODE" ] && export PGSSLMODE="$MODE"
  echo "[entrypoint] PGHOST=$PGHOST PGPORT=$PGPORT PGDATABASE=$PGDATABASE PGSSLMODE=$PGSSLMODE"
fi
# cluster.mjs forks WEB_CONCURRENCY workers (default 1 = single process).
exec node ./cluster.mjs
