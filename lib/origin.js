// Public origin of the site. Behind Render's proxy request.url shows the internal address (localhost:10000),
// so redirects must be built from APP_URL, or the forwarded host as a fallback.
export function publicOrigin(request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}
