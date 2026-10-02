import path from "node:path";
import fs from "node:fs";
import { Readable } from "node:stream";
import { UPLOAD_DIR, MIME } from "@/lib/media";

// Serves uploaded photos/videos with Range support (needed for video seeking on iOS).
export async function GET(request, { params }) {
  const { name } = await params;
  if (!/^[\w-]+\.\w+$/.test(name)) return new Response("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, name);
  const type = MIME[path.extname(name)];
  let stat;
  try {
    stat = await fs.promises.stat(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const headers = {
    "Content-Type": type ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(Readable.toWeb(fs.createReadStream(file)), { headers: { ...headers, "Content-Length": String(stat.size) } });
}
