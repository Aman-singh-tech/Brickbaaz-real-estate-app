import { NextResponse } from "next/server";

// Optimistic redirects only (cookie presence). Real authorization happens in the pages, layouts and server actions.
//
// Two hostnames, one app (set OWNER_HOST, e.g. owner.example.com, and APP_URL, e.g. https://www.example.com):
//   - OWNER_HOST serves the owner app (/owner/...). Its "/" goes to the dashboard; customer pages redirect to APP_URL.
//   - every other host serves the customer app; /owner/... redirects to OWNER_HOST.
// Without OWNER_HOST (local dev) everything works on one host.

const isOwnerPath = (p) => p === "/owner" || p.startsWith("/owner/");

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const has = (name) => request.cookies.has(name);

  const ownerHost = process.env.OWNER_HOST?.toLowerCase();
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (ownerHost && appUrl) {
    if (host === ownerHost) {
      if (pathname === "/") return NextResponse.redirect(new URL("/owner/dashboard", request.url));
      if (!isOwnerPath(pathname) && !pathname.startsWith("/api/")) {
        return NextResponse.redirect(`${appUrl}${pathname}${search}`);
      }
    } else if (isOwnerPath(pathname)) {
      return NextResponse.redirect(`https://${ownerHost}${pathname}${search}`);
    }
  }

  if (isOwnerPath(pathname) && pathname !== "/owner/login" && !has("bb_owner")) {
    return NextResponse.redirect(new URL("/owner/login", request.url));
  }
  if ((pathname.startsWith("/inquiries") || pathname.startsWith("/notifications")) && !has("bb_session")) {
    const to = new URL("/login", request.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }
  // Gurugram is the customer default; first-time visitors can explore the homepage directly.
  return NextResponse.next();
}

export const config = {
  // everything except static assets / PWA files
  matcher: ["/((?!_next/|icons/|icon\\.png|sw\\.js|offline\\.html|manifest\\.webmanifest|owner\\.webmanifest).*)"],
};
