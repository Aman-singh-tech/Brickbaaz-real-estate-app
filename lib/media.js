import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

// Media storage. With CLOUDINARY_* env vars set, the browser uploads straight to Cloudinary using a signed request
// (see /api/owner/upload-sign). Otherwise files go to local disk and are served by /api/media/[name] (dev only).
export const cloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  return cloud && key && secret ? { cloud, key, secret } : null;
};

export function signCloudinary(params) {
  const c = cloudinaryConfig();
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(toSign + c.secret).digest("hex");
}

// Accepts only URLs this app produced: local uploads or our own Cloudinary account.
export function isMediaUrl(url) {
  if (typeof url !== "string") return false;
  if (/^\/api\/media\/[\w-]+\.\w+$/.test(url)) return true;
  const c = cloudinaryConfig();
  return !!c && url.startsWith(`https://res.cloudinary.com/${c.cloud}/`);
}
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const TYPES = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};
export const MIME = Object.fromEntries(Object.entries(TYPES).map(([m, e]) => [e, m]));
export const MAX_IMAGE = 8 * 1024 * 1024;
export const MAX_VIDEO = 80 * 1024 * 1024;

export async function saveUpload(file) {
  const ext = TYPES[file.type];
  if (!ext) return { error: "Only JPG, PNG, WebP, PDF or MP4/WebM files are allowed." };
  const isVideo = file.type.startsWith("video/");
  if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE))
    return { error: isVideo ? "Video must be under 80 MB." : "Image must be under 8 MB." };
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/api/media/${name}`, kind: isVideo ? "VIDEO" : "IMAGE" };
}
