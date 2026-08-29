import User from '../models/User.js'
import Course from '../models/Course.js'

// Shared by the Stripe webhook and the post-checkout verification endpoint, so
// enrolling a student happens exactly once no matter which path gets there
// first. Safe to call repeatedly: an already-completed purchase is a no-op.
export const completePurchase = async (purchaseData) => {
    if (!purchaseData) return false
    if (purchaseData.status === 'completed') return true

    const userData = await User.findById(purchaseData.userId)
    const courseData = await Course.findById(purchaseData.courseId.toString())

    if (!userData || !courseData) return false

    if (!courseData.enrolledStudents.includes(userData._id)) {
        courseData.enrolledStudents.push(userData._id)
        await courseData.save()
    }

    if (!userData.enrolledCourses.some((id) => id.equals(courseData._id))) {
        userData.enrolledCourses.push(courseData._id)
        await userData.save()
    }

    purchaseData.status = 'completed'
    await purchaseData.save()

    return true
}

export default completePurchase
