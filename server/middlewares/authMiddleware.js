import { clerkClient, getAuth } from "@clerk/express";

// Middleware protecting the educator routes
export const protectEducator = async (req, res, next) => {
    try {
        // @clerk/express v2 exposes `req.auth` as a function, not an object,
        // so the session must be read through getAuth(req).
        const { userId } = getAuth(req)

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' })
        }

        const user = await clerkClient.users.getUser(userId)

        if (user.publicMetadata?.role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Unauthorized Access' })
        }

        next()
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}
