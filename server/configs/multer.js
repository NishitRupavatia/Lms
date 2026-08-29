import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

// Uploads land on disk first. Cloudinary is the intended destination, but the
// file needs a real path with an extension so it can also be served locally
// when Cloudinary is unavailable (see utils/uploadImage.js).
// Resolved from this file, not process.cwd(), so the folder is the same
// wherever the server is launched from.
export const UPLOAD_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "uploads"
);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        // Never trust the client's filename: derive the extension from it but
        // generate the name itself, so a crafted name cannot escape the folder.
        const ext = path.extname(file.originalname).toLowerCase().slice(0, 10)
        cb(null, `${crypto.randomUUID()}${/^\.[a-z0-9]+$/.test(ext) ? ext : ".img"}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) return cb(null, true)
        cb(new Error("Only image files are allowed"))
    },
})

export default upload
