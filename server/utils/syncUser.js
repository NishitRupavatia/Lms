import { clerkClient } from '@clerk/express'
import User from '../models/User.js'

// Users normally arrive through the Clerk `user.created` webhook. That webhook
// cannot reach a machine running on localhost, so any signed-in user would have
// no matching Mongo document during local development. This helper closes the
// gap: it upserts the document straight from the Clerk session on demand, and
// is a cheap no-op once the user exists.
export const ensureUser = async (userId) => {
    const existing = await User.findById(userId)
    if (existing) return existing

    const clerkUser = await clerkClient.users.getUser(userId)

    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
        || clerkUser.username
        || clerkUser.emailAddresses[0]?.emailAddress
        || 'User'

    // findByIdAndUpdate with upsert avoids a duplicate-key race when two
    // requests from the same fresh user arrive at once.
    return User.findByIdAndUpdate(
        userId,
        {
            // `_id` is supplied by the filter; repeating it here would make
            // MongoDB reject the upsert as a change to an immutable field.
            $setOnInsert: {
                name,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                imageUrl: clerkUser.imageUrl || '',
                enrolledCourses: [],
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    )
}

export default ensureUser
