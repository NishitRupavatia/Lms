import { clerkClient, getAuth } from '@clerk/express'

//update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        // @clerk/express v2 exposes `req.auth` as a function, not an object,
        // so it must be called (via getAuth) to read the session.
        const { userId } = getAuth(req)

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' })
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({ success: true, message: 'You can publish a course now' })

    } catch (error) {
        console.error('updateRoleToEducator error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}
