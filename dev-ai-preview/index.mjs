// Dev-ai preview chrome for emdash stores — the Node/Astro analogue of the WP
// urumi-magic mu-plugin, delivered as a dependency-free Astro integration:
//
//   1. Element inspector ("Edit" / point-and-target). Injects a page script that
//      highlights elements on hover in inspect mode and posts the clicked element
//      back to the dashboard, matching dashboard/src/components/UrumiAIPreview.jsx
//      (in URUMI_INSPECT_MODE, out WP_ELEMENT_SELECTED / WP_INSPECT_MODE_CANCELLED).
//   2. Hide EmDash's own CMS chrome inside the preview iframe (the floating
//      "EmDash | Edit" toolbar + the logged-in "Admin" nav link) — the dashboard
//      already supplies its own Admin tab + edit affordances, so these are
//      duplicate, confusing furniture in the merchant's SITE preview.
//
// injectScript ONLY — deliberately no updateConfig/addMiddleware: those reorder
// the astro middleware chain so emdash's own auth.mjs (which stamps a
// portal-only frame-ancestors CSP for logged-in users) wins over the user
// src/middleware.mjs, breaking the dashboard-iframe framing. Frame-ancestors +
// vite dev config are owned elsewhere (src/middleware.mjs + astro.config vite).
// Committed so codex's reset-to-main can't revert it.
import { INSPECTOR_CLIENT } from "./inspector.client.mjs";
import { CMS_CHROME_CLIENT } from "./cms-chrome.client.mjs";

export default function devAiInspector({ dashboardOrigin } = {}) {
  return {
    name: "emdash-dev-ai-inspector",
    hooks: {
      "astro:config:setup": ({ injectScript }) => {
        // The client re-captures the real parent origin from the incoming
        // URUMI_INSPECT_MODE message, so this substitution is a safe fallback.
        injectScript(
          "page",
          INSPECTOR_CLIENT.replace("__DASHBOARD_ORIGIN__", dashboardOrigin || "*"),
        );
        injectScript("page", CMS_CHROME_CLIENT);
      },
    },
  };
}
