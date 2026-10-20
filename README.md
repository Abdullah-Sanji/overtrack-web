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
pnpm exec playwright install chromium webkit   # once, downloads the browsers
pnpm e2e                        # Playwright, desktop Chromium, against a seeded API (starts pnpm dev if needed)
pnpm e2e:mobile                 # same flows with the iPhone profile (WebKit)
```

The e2e flows mutate the seeded data and run in file order (`01-` to `04-`), so
reseed before every run, including between `pnpm e2e` and `pnpm e2e:mobile`:

```bash
cd ../over-track-api && docker compose down -v && docker compose up -d && pnpm db:migrate && pnpm seed
```

Then restart the API if it was running. Set `PLAYWRIGHT_BASE_URL` to target
another host.

`04-` creates a role, re-assigns a user, exercises the delete guards and deletes a throwaway user.

## Build / Docker

```bash
pnpm build
docker build -t over-track-web .   # served by nginx, /api proxied to the api service (see over-track-api/docker-compose.prod.yml)
```

The image is built with `VITE_API_URL=/api/v1` by default; override with
`--build-arg VITE_API_URL=...`.
