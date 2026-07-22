/**
 * Hides EmDash's own CMS chrome inside the dev-ai preview iframe.
 *
 * WHY: the preview pane is meant to show the merchant their SITE, not the CMS
 * editing furniture. Once the operator is signed in as a real user (per-user
 * magic login), EmDash starts rendering two logged-in-only affordances on every
 * page:
 *
 *   #emdash-toolbar  the floating "EmDash | Edit" bar. Server-injected as a
 *                    <div id="emdash-toolbar"> by emdash's own
 *                    astro/middleware/request-context.mjs — note it is an ID,
 *                    not a class. It also ships its own `position: fixed`
 *                    <style>, so we need !important to win.
 *   .nav-admin       the "Admin" link the blog template renders when isLoggedIn
 *
 * Neither belongs in the preview: the dashboard already provides its own Admin
 * tab and edit affordances, so these are duplicate, confusing chrome. This is
 * the Node/Astro analogue of the WordPress preview hiding the wp-admin bar.
 *
 * WHY CSS, AND WHY HERE: the toolbar comes from the emdash package (we do not
 * own it) and the Admin link is conditional template code in the merchant's own
 * repo. Editing the merchant's repo would put a permanent diff in their working
 * tree — the exact problem the committed astro.config.mjs overlay already causes
 * — and codex's reset-to-main would revert it anyway. Hiding from the preview
 * integration keeps the merchant's repo clean, survives reset-to-main, and
 * applies to every store without a per-store change.
 *
 * Scoped to display:none so the elements stay in the DOM: nothing else keys off
 * them, and removing nodes risks breaking emdash's own hydration.
 */
export const CMS_CHROME_CLIENT = `
(() => {
  const STYLE_ID = "urumi-dev-ai-preview-cms-chrome";
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent =
    "#emdash-toolbar,.nav-admin{display:none !important;}";
  // documentElement fallback: this runs as a "page" script, which Astro may
  // execute before <head> exists on a streamed response.
  (document.head || document.documentElement).appendChild(style);
})();
`;
