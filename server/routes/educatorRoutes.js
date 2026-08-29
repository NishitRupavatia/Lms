import express from 'express'
import { addCourse, deleteCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateCourseThumbnail, updateRoleToEducator } from '../controllers/educatorController.js'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/authMiddleware.js'

const educatorRouter = express.Router()

//add educator role
educatorRouter.get('/update-role', updateRoleToEducator)

// multer must run before protectEducator so the multipart body is parsed
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)

// protectEducator runs first here so an unauthorised request never gets a file
// written to disk. It only reads the auth header, so multer still parses fine.
educatorRouter.put('/course/:id/thumbnail', protectEducator, upload.single('image'), updateCourseThumbnail)
educatorRouter.delete('/course/:id', protectEducator, deleteCourse)

educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)

export default educatorRouter
