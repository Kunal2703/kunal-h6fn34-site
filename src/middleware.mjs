// Allow the dev-ai preview to embed in the urumi-agent dashboard iframe.
// emdash's own middleware sets `X-Frame-Options: SAMEORIGIN` only when no CSP
// is present; setting a CSP frame-ancestors that names the dashboard makes it
// skip X-Frame-Options and scopes framing to the dashboard origin.
// Committed (not runtime-injected) so codex's reset-to-main preserves it.
export async function onRequest(ctx, next) {
  const res = await next();
  res.headers.delete("x-frame-options");
  if (!res.headers.has("content-security-policy"))
    res.headers.set(
      "content-security-policy",
      "frame-ancestors 'self' https://portal.emdash.myscalablesite.com",
    );
  return res;
}
