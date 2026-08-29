import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'
import { UPLOAD_DIR } from '../configs/multer.js'

// Cloudinary's SDK collapses any status it does not special-case (403 included)
// into "Server returned unexpected status code - 403", throwing away the reason
// the API actually sent. Recover it so the log says what is really wrong.
const describeCloudinaryError = (error) => {
    const detail = error?.error?.message || error?.message || String(error)
    const code = error?.http_code || error?.error?.http_code

    if (code === 403) {
        return `${detail} (403 - the Cloudinary API key is not permitted to upload; ` +
            `check the key's access level and that the account is verified)`
    }

    return code ? `${detail} (${code})` : detail
}

const isConfigured = () =>
    Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY)

/**
 * Upload a multer file and return a URL that can be rendered directly.
 *
 * Cloudinary is the primary target. When it is unconfigured or rejects the
 * upload, the file is left in `server/uploads` and served by the API itself, so
 * local development is never blocked by an account-side problem. That fallback
 * is disabled on Vercel, whose filesystem is read-only and non-persistent —
 * there a failed upload has to surface as a real error.
 */
export const uploadImage = async (file, req) => {
    if (isConfigured()) {
        try {
            const result = await cloudinary.uploader.upload(file.path, { folder: 'lms-courses' })

            // Cloudinary has its own copy now; drop the local one
            await fs.unlink(file.path).catch(() => { })

            return result.secure_url
        } catch (error) {
            const reason = describeCloudinaryError(error)

            if (process.env.VERCEL) {
                throw new Error(`Thumbnail upload failed: ${reason}`)
            }

            console.warn(`Cloudinary upload failed, serving the thumbnail locally instead: ${reason}`)
        }
    } else if (process.env.VERCEL) {
        throw new Error('Cloudinary is not configured')
    } else {
        console.warn('Cloudinary is not configured, serving the thumbnail locally instead')
    }

    // Served by the `/uploads` static route registered in server.js
    return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
}

export default uploadImage

/**
 * Delete a thumbnail that is no longer referenced, whether it lives on
 * Cloudinary or on local disk. Best-effort: a stored image that cannot be
 * removed must never fail the request that replaced it.
 */
export const removeStoredImage = async (url) => {
    if (!url) return

    try {
        if (url.includes('/uploads/')) {
            // basename only — a crafted URL must not reach outside UPLOAD_DIR
            const name = path.basename(new URL(url).pathname)
            await fs.unlink(path.join(UPLOAD_DIR, name)).catch(() => { })
            return
        }

        if (url.includes('res.cloudinary.com')) {
            // https://res.cloudinary.com/<cloud>/image/upload/v123/<public_id>.jpg
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i)
            if (match) await cloudinary.uploader.destroy(match[1])
        }
    } catch (error) {
        console.warn('Could not remove the previous thumbnail:', error.message)
    }
}
