import { clerkClient, getAuth } from '@clerk/express'
import Course from '../models/Course.js'
import User from '../models/User.js'
import { Purchase } from '../models/Purchase.js'
import { uploadImage, removeStoredImage } from '../utils/uploadImage.js'
import { CourseProgress } from '../models/CourseProgress.js'

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

//update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

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

//add new course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = requireUserId(req, res)
        if (!educatorId) return

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail not attached' })
        }

        if (!courseData) {
            return res.json({ success: false, message: 'Course data not attached' })
        }

        const parsedCourseData = JSON.parse(courseData)
        parsedCourseData.educator = educatorId

        // Upload the thumbnail first so a failed upload does not leave a
        // thumbnail-less course behind in the database.
        parsedCourseData.courseThumbnail = await uploadImage(imageFile, req)

        await Course.create(parsedCourseData)

        res.json({ success: true, message: 'Course Added' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get educator courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = requireUserId(req, res)
        if (!educator) return

        const courses = await Course.find({ educator })
        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get educator dashboard, total earning etc
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = requireUserId(req, res)
        if (!educator) return

        const courses = await Course.find({ educator })
        const totalCourses = courses.length

        const courseIds = courses.map(course => course._id)

        //calculate earning
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)

        //collect enrolled students per course
        const enrolledStudentsData = []
        for (const course of courses) {
            const students = await User.find(
                { _id: { $in: course.enrolledStudents } },
                'name imageUrl'
            )

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                })
            })
        }

        res.json({
            success: true,
            dashboardData: { totalEarnings, enrolledStudentsData, totalCourses }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//get enrolled data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = requireUserId(req, res)
        if (!educator) return

        const courses = await Course.find({ educator })
        const courseIds = courses.map(course => course._id)

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        // A purchase whose user or course was deleted populates to null, so skip those
        const enrolledStudents = purchases
            .filter(purchase => purchase.userId && purchase.courseId)
            .map(purchase => ({
                student: purchase.userId,
                courseTitle: purchase.courseId.courseTitle,
                purchaseDate: purchase.createdAt
            }))

        res.json({ success: true, enrolledStudents })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Load a course and confirm it belongs to the caller. Returns null after
// responding, so the caller just bails out.
const findOwnedCourse = async (req, res, educatorId) => {
    const course = await Course.findById(req.params.id)

    if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' })
        return null
    }

    if (course.educator !== educatorId) {
        res.status(403).json({ success: false, message: 'This is not your course' })
        return null
    }

    return course
}

// Replace a course thumbnail
export const updateCourseThumbnail = async (req, res) => {
    try {
        const educatorId = requireUserId(req, res)
        if (!educatorId) return

        if (!req.file) {
            return res.json({ success: false, message: 'No image attached' })
        }

        const course = await findOwnedCourse(req, res, educatorId)
        if (!course) return

        const previous = course.courseThumbnail

        course.courseThumbnail = await uploadImage(req.file, req)
        await course.save()

        // Only once the new one is safely stored
        await removeStoredImage(previous)

        res.json({
            success: true,
            message: 'Thumbnail updated',
            courseThumbnail: course.courseThumbnail,
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Delete a course, along with the references that would otherwise dangle.
// Purchases are deliberately kept: they are financial history, and the views
// that read them already skip rows whose course is gone.
export const deleteCourse = async (req, res) => {
    try {
        const educatorId = requireUserId(req, res)
        if (!educatorId) return

        const course = await findOwnedCourse(req, res, educatorId)
        if (!course) return

        await User.updateMany(
            { enrolledCourses: course._id },
            { $pull: { enrolledCourses: course._id } }
        )

        await CourseProgress.deleteMany({ courseId: course._id.toString() })

        await Course.findByIdAndDelete(course._id)
        await removeStoredImage(course.courseThumbnail)

        res.json({ success: true, message: 'Course deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
