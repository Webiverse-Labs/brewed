// Phone photos are often 3–12 MB, and the deployed API (a Vercel function) refuses any request over 4.5 MB.
// So big images are shrunk in the browser before upload: longest side 1600 px, re-encoded as JPEG.
// Small images and GIFs (re-encoding would drop the animation) are sent unchanged.
const MAX_SIDE = 1600;
const LEAVE_BELOW_BYTES = 1024 * 1024;

export async function shrinkImage(file) {
  if (file.type === "image/gif" || file.size <= LEAVE_BELOW_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // JPEG has no transparency: transparent PNG areas become white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // a format this browser can't decode (e.g. HEIC on desktop Chrome): the server gives the error
  }
}
