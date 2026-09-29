import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { ApiError } from "../lib/ApiError.js";

//files are saved under backend/uploads/<folder>/ and served by server.js at /uploads
//(resolved from this file, so it works no matter which folder the server is started from)
export const UPLOAD_ROOT = fileURLToPath(new URL("../../uploads", import.meta.url));

const MAX_BYTES = 5 * 1024 * 1024;

//Only these raster formats are accepted. The saved extension comes from this map — never from the
//uploader's filename — and SVG is deliberately absent (it can carry scripts). Otherwise a file named
//"x.html" sent as "image/png" would be served back from the API's origin as a live web page.
const IMAGE_TYPES = {
  "image/jpeg": { ext: ".jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: ".png", matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/gif": { ext: ".gif", matches: (b) => ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("latin1")) },
  "image/webp": {
    ext: ".webp",
    matches: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
};

const REJECTED = "Only JPEG, PNG, WebP or GIF images can be uploaded.";

//the browser-supplied mimetype is just a claim: check the file's first bytes really match it
async function verifySavedImages(req, res, next) {
  const files = [req.file, ...(Array.isArray(req.files) ? req.files : [])].filter(Boolean);
  try {
    for (const file of files) {
      const handle = await fs.promises.open(file.path, "r");
      const { buffer, bytesRead } = await handle.read(Buffer.alloc(12), 0, 12, 0);
      await handle.close();
      if (!IMAGE_TYPES[file.mimetype]?.matches(buffer.subarray(0, bytesRead))) {
        discardUploads(req);
        return next(new ApiError(400, REJECTED));
      }
    }
    next();
  } catch (err) {
    discardUploads(req);
    next(err);
  }
}

//upload("cafes").array("photos", 6)  |  upload("avatars").single("avatar")
//Each returns [multer, verifySavedImages]; Express accepts the array as route middleware.
export function upload(folder) {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });

  const multerUpload = multer({
    storage: multer.diskStorage({
      destination: dir,
      //random name + extension from the allowlist: can't overwrite other files or pick its own file type
      filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${IMAGE_TYPES[file.mimetype].ext}`),
    }),
    limits: { fileSize: MAX_BYTES },
    fileFilter: (req, file, cb) => {
      if (IMAGE_TYPES[file.mimetype]) cb(null, true);
      else cb(new ApiError(400, REJECTED));
    },
  });

  return {
    single: (field) => [multerUpload.single(field), verifySavedImages],
    array: (field, max) => [multerUpload.array(field, max), verifySavedImages],
  };
}

//headers for serving /uploads: never let a stored file be sniffed or run as a page
export function setUploadHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
}

//public URL path stored in the database, e.g. "/uploads/cafes/abc.jpg"
export const fileUrl = (folder, file) => `/uploads/${folder}/${file.filename}`;

//delete a stored upload by its "/uploads/..." URL (e.g. the old avatar); ignores anything else
export function removeUpload(url) {
  if (!url?.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_ROOT, url.slice("/uploads/".length));
  //stay inside UPLOAD_ROOT even if the stored URL is odd
  if (!filePath.startsWith(UPLOAD_ROOT + path.sep)) return;
  fs.rm(filePath, { force: true }, () => {});
}

//delete this request's uploaded files, for when validation fails after Multer already saved them
export function discardUploads(req) {
  const files = [req.file, ...(Array.isArray(req.files) ? req.files : [])].filter(Boolean);
  for (const file of files) fs.rm(file.path, { force: true }, () => {});
}
