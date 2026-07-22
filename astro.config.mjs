// Overlay this over a `create-emdash --platform node --template blog` scaffold to
// target RDS Postgres + S3. Keeps the scaffold's react/fonts/audit-log config
// (dropping any of it crashes the <Font> component at render) and swaps only the
// database (sqlite -> postgres) and storage (local -> s3), plus a per-pod cache.
import node from "@astrojs/node";
import devAiInspector from "./dev-ai-preview/index.mjs";
import react from "@astrojs/react";
import auditLog from "@emdash-cms/plugin-audit-log";
import { defineConfig, fontProviders } from "astro/config";
import emdash, { s3, memoryCache } from "emdash/astro";
import { postgres } from "emdash/db";

export default defineConfig({
  // Dev-server host allow-list. The dev-ai preview reaches `astro dev` via the
  // ALB at <slug>-dev-ai.<suffix>; Astro's native server.allowedHosts defaults
  // to [] (block all non-localhost), which 403s that host. `true` allows it.
  // Committed here (not injected at runtime) so codex's reset-to-main can't
  // revert it. Ignored by `astro build` — production serving is unaffected.
  server: { allowedHosts: true },
  // The EmDash /_emdash/admin is a vite-dev SPA; its /@fs//@vite//@id/ module
  // endpoints 403 through the external ALB without these. Astro server.* does
  // NOT cover them — must be under vite.server. Committed so reset-to-main keeps it.
  vite: { server: { cors: true, fs: { strict: false, allow: ["/var/www/repo"] } } },
  output: "server",
  adapter: node({ mode: "standalone" }),

  image: {
    layout: "constrained",
    responsiveStyles: true,
  },

  integrations: [
    react(),
    devAiInspector({ dashboardOrigin: process.env.PREVIEW_DASHBOARD_ORIGIN }),
    emdash({
      // RDS Postgres. NOTE: connectionString is captured at BUILD time (undefined
      // in the image build), so pg falls back to PG* env vars at runtime — the
      // entrypoint derives those from DATABASE_URL. See app/entrypoint.sh.
      database: postgres({ connectionString: process.env.DATABASE_URL }),

      // S3 media. bucket / region / endpoint come from S3_* env; credentials are
      // omitted so the AWS SDK default chain uses the pod's IRSA role.
      storage: s3(),

      // Per-pod in-memory cache. Revisit before scaling replicas high.
      objectCache: memoryCache(),

      plugins: [auditLog],
    }),
  ],

  // Self-hosted webfonts. The blog template's layout renders <Font cssVariable=
  // "--font-body"> — these entries define those variables. Dropping them crashes
  // the page render (truncated response -> Cloudflare 502).
  fonts: [
    { provider: fontProviders.google(), name: "Inter", cssVariable: "--font-body", weights: [400, 500, 600, 700], fallbacks: ["sans-serif"] },
    { provider: fontProviders.google(), name: "JetBrains Mono", cssVariable: "--font-mono", weights: [400, 500], fallbacks: ["monospace"] },
  ],

  devToolbar: { enabled: false },
});
