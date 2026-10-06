export async function uploadMedia(file, kind) {
  const video = kind === "VIDEO";
  if (
    !file ||
    !(
      video ? /^video\/(mp4|webm|quicktime)$/ : /^image\/(jpeg|png|webp)$/
    ).test(file.type)
  )
    throw Error(
      video ? "Choose MP4, WebM or MOV." : "Choose JPG, PNG or WebP.",
    );
  if (file.size > (video ? 80 : 8) * 1024 * 1024)
    throw Error(
      video ? "Video must be under 80 MB." : "Image must be under 8 MB.",
    );
  const r = await fetch("/api/owner/upload-sign", { method: "POST" }),
    t = await r.json();
  if (!r.ok) throw Error(t.error || "Please sign in.");
  const fd = new FormData();
  fd.append("file", file);
  let endpoint = "/api/owner/upload";
  if (t.mode === "cloudinary") {
    for (const [k, v] of Object.entries({
      api_key: t.apiKey,
      timestamp: t.timestamp,
      signature: t.signature,
      folder: t.folder,
    }))
      fd.append(k, v);
    endpoint = `https://api.cloudinary.com/v1_1/${t.cloud}/${video ? "video" : "image"}/upload`;
  }
  const response = await fetch(endpoint, { method: "POST", body: fd }),
    j = await response.json();
  if (!response.ok) throw Error(j.error?.message || j.error || "Upload failed");
  return j.secure_url || j.url;
}
