# TheFeeder

RSS/Atom aggregator with daily email digest. Next.js 15, PostgreSQL, Redis, BullMQ.

**Live:** https://feeder.works  
**Repo:** https://github.com/runawaydevil/thefeeder

---

## What it does

- Aggregates RSS/Atom/JSON. Auto-discovery from URLs (sites, Reddit, YouTube, GitHub).
- Vote on articles (like/dislike) and share—no account. Votes stored per-client (localStorage), rate-limited.
- Daily digest email to subscribers. Digest time and timezone via env.
- Admin UI: feeds CRUD, OPML import/export, subscribers. NextAuth (credentials), role-based.
- Four themes: Vaporwave (default), Clean, Directory (classic web), Catppuccin Mocha. Toggle in header; choice persisted in localStorage.
- Worker runs fetch + digest jobs. Web talks to worker over HTTP (token-auth). Both use the same Redis and DB.

## Stack

- **Web:** Next.js 15 (App Router), React, Tailwind. API routes, Prisma.
- **Worker:** Node, BullMQ, same Prisma schema.
- **Data:** PostgreSQL, Redis. Nodemailer for SMTP.

## Quick start

Requirements: Node 20+, PostgreSQL 16+, Redis 7+. Docker optional.

```bash
git clone https://github.com/runawaydevil/thefeeder.git
cd thefeeder
npm run install:all
cp .env.example .env
# edit .env: DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, WORKER_API_TOKEN, etc.
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run dev
```

Web: http://localhost:7389. Worker API: http://localhost:7388. Default admin (change in prod): `admin@example.com` / `admin123`.

## Docker

```bash
docker compose up -d --build
```

Web: http://localhost:8041. Worker, Postgres, Redis are wired via compose. Set `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `WORKER_API_TOKEN`, `NEXTAUTH_SECRET` in `.env` before building. Migrations run via a one-off `web-migrate` step.

## Env (main flags)

| Variable | Purpose |
|--------|---------|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis (use `redis://:pass@host:6379` in prod if you use auth) |
| `NEXTAUTH_URL` | Public URL of the app (e.g. `https://feeder.works`) |
| `NEXT_PUBLIC_SITE_URL` | Same as NEXTAUTH_URL for canonical/sitemap |
| `WORKER_API_URL` | URL the web uses to call the worker (e.g. `http://127.0.0.1:7388` or `http://worker:3001` in Docker) |
| `WORKER_API_TOKEN` | Shared secret between web and worker; must be set in prod |
| `ALLOWED_ORIGINS` | Comma-separated origins for CORS (e.g. `https://feeder.works,https://www.feeder.works`) |
| `TZ` | Timezone for digest (default `America/Sao_Paulo`) |
| `DIGEST_TIME` | Daily digest time (e.g. `09:00`) |
| `SMTP_*` | Nodemailer SMTP config; optional (no SMTP = log to stdout) |
| `LOG_LEVEL` | `error` in prod recommended |

See `.env.example` for the full list and comments.

## Scripts (from repo root)

```bash
npm run dev              # web + worker in dev
npm run build            # build web + worker
npm run start            # run in production
npm run install:all      # install deps in root + apps
npm run prisma:generate  # generate Prisma client
npm run prisma:migrate:dev
npm run prisma:seed
npm run prisma:studio    # DB UI
```

## Layout

```
thefeeder/
  apps/web/          Next.js app, Prisma schema
  apps/worker/       BullMQ worker, digest/fetch jobs
  .env / .env.example
  docker-compose.yml
  Dockerfile
```

## Themes

Four themes: Vaporwave, Clean, Directory, Catppuccin. Use the THEME control in the header to cycle; selection is stored in localStorage and applied via `data-theme` and CSS vars in `apps/web/app/themes.css`. Catppuccin uses the Mocha palette and a separate logo asset (`/cat.png` when that theme is active).

## Email

Set SMTP in `.env` (host, port, user, pass, from). For deliverability, configure SPF, DKIM, and DMARC for your domain. Without SMTP, the worker logs mail to stdout.

## Troubleshooting

- DB/Redis: check `DATABASE_URL` and `REDIS_URL` and that the services are up (`docker compose ps` or your process manager).
- Auth: `NEXTAUTH_URL` must match the URL you use in the browser; set `NEXTAUTH_SECRET`.
- Worker: same Redis as web; `WORKER_API_URL` and `WORKER_API_TOKEN` must match on both sides.
- Ports: dev web defaults to 7389; Docker exposes web on 8041.

For anything else, open an issue with OS, Node version, and relevant log output.

---

Contributing: see [CONTRIBUTING.md](CONTRIBUTING.md).  
License: [LICENSE](LICENSE).



niceeeeeeee!!!