import { getAuth } from "@clerk/express"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import Course from "../models/Course.js"
import User from "../models/User.js"
import { ensureUser } from "../utils/syncUser.js"
import { completePurchase } from "../utils/completePurchase.js"
import Stripe from "stripe"

// @clerk/express v2 exposes `req.auth` as a function, not an object,
// so the session must be read through getAuth(req).
const requireUserId = (req, res) => {
    const { userId } = getAuth(req)
    if (!userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' })
        return null
    }
    return userId
}

//get user data
export const getUserData = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        // Creates the document on first sign-in when the Clerk webhook could
        // not reach this machine (always the case on localhost).
        const user = await ensureUser(userId)

        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        await ensureUser(userId)
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({ success: true, enrolledCourses: userData?.enrolledCourses ?? [] })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Purchase Course
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body
        const { origin } = req.headers
        const userId = requireUserId(req, res)
        if (!userId) return

        const userData = await ensureUser(userId)
        const courseData = await Course.findById(courseId)

        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data Not Found' })
        }

        if (userData.enrolledCourses.some(id => id.equals(courseData._id))) {
            return res.json({ success: false, message: 'Already enrolled in this course' })
        }

        const amount = Number(
            (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)
        )

        const newPurchase = await Purchase.create({
            courseId: courseData._id,
            userId,
            amount,
        })

        //stripe gateway
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
        const currency = (process.env.CURRENCY || 'usd').toLowerCase()

        // Creating line items for Stripe. Stripe expects the smallest currency
        // unit, so round the cents instead of flooring away the decimal part.
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.round(newPurchase.amount * 100)
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
            line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })

        res.json({ success: true, session_url: session.url })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        const { courseId, lectureId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' })
            }
            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        } else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })
        }

        res.json({ success: true, message: 'Progress updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// get User Course Progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        const { courseId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })
        res.json({ success: true, progressData: progressData ?? null })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Add User Ratings to Course
export const addUserRating = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        const { courseId, rating } = req.body

        if (!courseId || !rating || rating < 1 || rating > 5) {
            return res.json({ success: false, message: 'Invalid Details' })
        }

        const course = await Course.findById(courseId)

        if (!course) {
            return res.json({ success: false, message: 'Course not found.' })
        }

        const user = await User.findById(userId)

        // enrolledCourses holds ObjectIds, so compare as strings
        const isEnrolled = user?.enrolledCourses.some(id => id.toString() === String(courseId))

        if (!isEnrolled) {
            return res.json({ success: false, message: 'User has not purchased this course.' })
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)

        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating
        } else {
            course.courseRatings.push({ userId, rating })
        }
        await course.save()

        return res.json({ success: true, message: 'Rating added' })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

// Confirm a Stripe Checkout session straight from the browser return trip.
// The webhook is the source of truth in production, but it cannot reach a
// localhost server, so the client calls this after being redirected back and
// the enrollment is completed here instead. completePurchase is idempotent, so
// the two paths never double-enroll.
export const verifyPurchase = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        const { sessionId } = req.body

        if (!sessionId) {
            return res.json({ success: false, message: 'Missing session id' })
        }

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId)

        if (session.payment_status !== 'paid') {
            return res.json({ success: false, message: 'Payment not completed' })
        }

        const purchase = await Purchase.findById(session.metadata?.purchaseId)

        if (!purchase) {
            return res.json({ success: false, message: 'Purchase not found' })
        }

        // Never let one user's return URL complete another user's purchase
        if (purchase.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' })
        }

        const completed = await completePurchase(purchase)

        res.json({ success: completed, message: completed ? 'Enrolled' : 'Could not complete enrollment' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
