# over-track-web

Vue 3 frontend for the OverTrack overtime-management system.

## Run locally

```bash
cp .env.example .env            # VITE_API_URL=http://localhost:3000/api/v1
pnpm install && pnpm dev        # http://localhost:5173  (API must be running and seeded)
```

## Test

```bash
pnpm test                       # unit (Vitest)
pnpm e2e                        # Playwright against a seeded API (starts pnpm dev if needed)
```

The e2e flows mutate the seeded data and run in file order (`01-` to `03-`), so
re-running them needs a fresh seed first:

```bash
cd ../over-track-api && docker compose down -v && docker compose up -d && pnpm db:migrate && pnpm seed
```

Then restart the API if it was running. Run a single project with
`pnpm exec playwright test --project=chromium`. Set `PLAYWRIGHT_BASE_URL` to
target another host.

## Build / Docker

```bash
pnpm build
docker build -t over-track-web .   # served by nginx, /api proxied to the api service (see over-track-api/docker-compose.prod.yml)
```

The image is built with `VITE_API_URL=/api/v1` by default; override with
`--build-arg VITE_API_URL=...`.
