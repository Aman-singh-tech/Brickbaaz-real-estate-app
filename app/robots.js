import { absoluteUrl } from "@/lib/seo";
import { headers } from "next/headers";

export default async function robots() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "").split(":")[0].toLowerCase();
  if (process.env.OWNER_HOST && host === process.env.OWNER_HOST.toLowerCase())
    return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/owner", "/api/", "/inquiries", "/notifications"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
