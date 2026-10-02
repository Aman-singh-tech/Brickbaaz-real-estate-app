import { NextResponse } from "next/server";

// Optimistic redirects only (cookie presence). Real authorization happens in the pages, layouts and server actions.
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const has = (name) => request.cookies.has(name);

  if (pathname.startsWith("/owner") && pathname !== "/owner/login" && !has("bb_owner")) {
    return NextResponse.redirect(new URL("/owner/login", request.url));
  }
  if ((pathname.startsWith("/inquiries") || pathname.startsWith("/notifications")) && !has("bb_session")) {
    const to = new URL("/login", request.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }
  // first visit: pick a city
  if (pathname === "/" && !has("city")) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/owner/:path*", "/inquiries/:path*", "/inquiries", "/notifications"],
};
