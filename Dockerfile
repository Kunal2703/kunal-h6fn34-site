# Build the emdash site into a standalone Node server. Multi-stage: the build
# stage has the native toolchain (for any node-gyp fallback); the runtime image
# is slim and carries only dist + node_modules + the entrypoint.
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
# Native build deps in case a prebuilt binary is unavailable for the platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# pnpm-workspace.yaml carries the build-script allowlist (esbuild/better-sqlite3),
# without which pnpm 11 hard-fails the install.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# ---- runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY cluster.mjs /app/cluster.mjs
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Astro stores server sessions on the filesystem at node_modules/.astro/sessions.
# The pod runs as a non-root UID (k8s runAsUser=1000) against a root-owned,
# read-only node_modules, so that dir can't be created or written at runtime —
# session writes fail with ENOENT and NO admin login (magic link OR passkey) can
# establish a session on the built app (the operator gets bounced back to
# /_emdash/admin/login). Pre-create it world-writable at build time so the
# non-root runtime user can persist sessions.
RUN mkdir -p /app/node_modules/.astro/sessions \
  && chmod -R 0777 /app/node_modules/.astro

EXPOSE 4321
# entrypoint derives PG* from DATABASE_URL, then starts the server.
CMD ["sh", "/app/entrypoint.sh"]
