import crypto from "node:crypto";
import multer from "multer";
import Upload from "../models/Upload.js";
import { ApiError } from "../lib/ApiError.js";

//files are stored in MongoDB (models/Upload.js) under a "/uploads/<folder>/<file>" URL and served by app.js.
//Not on disk: the deploy runs as a Vercel function, which has no lasting disk, so disk files would vanish.

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

const requestFiles = (req) => [req.file, ...(Array.isArray(req.files) ? req.files : [])].filter(Boolean);

//the browser-supplied mimetype is just a claim: check the file's first bytes really match it, then store it
//(random name + extension from the allowlist: can't overwrite other files or pick its own file type)
const saveVerifiedImages = (folder) => async (req, res, next) => {
  const files = requestFiles(req);
  if (!files.every((file) => IMAGE_TYPES[file.mimetype]?.matches(file.buffer))) return next(new ApiError(400, REJECTED));
  try {
    for (const file of files) {
      file.filename = `${crypto.randomUUID()}${IMAGE_TYPES[file.mimetype].ext}`;
      await Upload.create({ url: fileUrl(folder, file), contentType: file.mimetype, data: file.buffer });
      file.url = fileUrl(folder, file); //set only once saved, so discardUploads deletes exactly what exists
    }
    next();
  } catch (err) {
    discardUploads(req);
    next(err);
  }
};

//upload("cafes").array("photos", 6)  |  upload("avatars").single("avatar")
//Each returns [multer, saveVerifiedImages]; Express accepts the array as route middleware.
export function upload(folder) {
  const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES },
    fileFilter: (req, file, cb) => {
      if (IMAGE_TYPES[file.mimetype]) cb(null, true);
      else cb(new ApiError(400, REJECTED));
    },
  });

  return {
    single: (field) => [multerUpload.single(field), saveVerifiedImages(folder)],
    array: (field, max) => [multerUpload.array(field, max), saveVerifiedImages(folder)],
  };
}

//headers for serving /uploads: never let a stored file be sniffed or run as a page
function setUploadHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
}

//GET /uploads/:folder/:file -> the stored image
export async function serveUpload(req, res) {
  const upload = await Upload.findOne({ url: `/uploads/${req.params.folder}/${req.params.file}` });
  if (!upload) throw new ApiError(404, "Image not found.");
  setUploadHeaders(res);
  //names are random UUIDs and a file never changes, so browsers can keep it
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.type(upload.contentType).send(upload.data);
}

//public URL path stored in the database, e.g. "/uploads/cafes/abc.jpg"
export const fileUrl = (folder, file) => `/uploads/${folder}/${file.filename}`;

//delete a stored upload by its "/uploads/..." URL (e.g. the old avatar); ignores anything else
export function removeUpload(url) {
  if (!url?.startsWith("/uploads/")) return;
  Upload.deleteOne({ url }).catch((err) => console.error("Could not delete upload", url, err));
}

//delete this request's uploaded files, for when validation fails after they were already saved
export function discardUploads(req) {
  const urls = requestFiles(req)
    .map((file) => file.url)
    .filter(Boolean);
  if (urls.length) Upload.deleteMany({ url: { $in: urls } }).catch((err) => console.error("Could not delete uploads", err));
}
