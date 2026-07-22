// Allow the dev-ai preview to embed in the urumi-agent dashboard iframe.
// emdash's own middleware sets `X-Frame-Options: SAMEORIGIN` only when no CSP
// is present; setting a CSP frame-ancestors that names the dashboard makes it
// skip X-Frame-Options and scopes framing to the dashboard origin.
// Committed (not runtime-injected) so codex's reset-to-main preserves it.
//
// The framing dashboard differs per environment (sandbox emdash-poc vs prod
// portal), so the origin is NOT hardcoded: the dev-ai chart injects the real
// dashboard origin as PREVIEW_DASHBOARD_ORIGIN (from the same value that drives
// the codex-auth-proxy DASHBOARD_URL). Both known origins stay as a fallback so
// the preview still frames if the env is ever unset.
const FRAME_ANCESTORS = [
  "'self'",
  process.env.PREVIEW_DASHBOARD_ORIGIN,
  "https://portal.emdash.myscalablesite.com",
  "https://emdash-poc.sandbox.myscalablesite.com",
]
  .filter(Boolean)
  // De-dupe so an env that equals a fallback doesn't repeat in the header.
  .filter((v, i, a) => a.indexOf(v) === i)
  .join(" ");

export async function onRequest(ctx, next) {
  const res = await next();
  res.headers.delete("x-frame-options");
  if (!res.headers.has("content-security-policy"))
    res.headers.set(
      "content-security-policy",
      `frame-ancestors ${FRAME_ANCESTORS}`,
    );
  return res;
}
