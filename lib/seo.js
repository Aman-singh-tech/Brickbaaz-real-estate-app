import "server-only";

export const siteUrl = (process.env.APP_URL || "https://www.brickbaaz.com").replace(/\/$/, "");
export const absoluteUrl = (path) => new URL(path, `${siteUrl}/`).toString();

export function pageMetadata(title, description, path, image = "/hero.jpg") {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Brickbaaz", type: "website", locale: "en_IN", images: [{ url: absoluteUrl(image), alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(image)] },
  };
}
