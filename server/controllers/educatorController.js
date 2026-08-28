import { clerkClient, getAuth } from '@clerk/express'
import Course from './models/Course.js'
import {v2 as cloudinary} from 'cloudinary'
import { Purchase } from '../models/Purchase.js'

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

//add new course
export const addCourse=async(req,res)=>{
    try {
        const {courseData}=req.body
        const imageFile=req.file
        const { educatorId } = getAuth(req)

        if(!imageFile){
            return res.json({success:false,message:'Thumbnail not attached'})
        }

        const parsedCourseData=await JSON.parse(courseData)
        parsedCourseData.educator=educatorId
        const newCourse=await Course.create(parsedCourseData)
        const imageUpload= await cloudinary.uploader.upload(imageFile.path) 
        newCourse.courseThumbnail =imageUpload.secure_url
        await newCourse.save()

        res.json({success:true , message:'Course Added'})


    } catch (error) {
        res.json({success:false,message:error.message})
    }
}


//get educator courses
export const getEducatorCourses =async (req,res)=>{
     try {
        const educator=req.auth.userId
        const courses=await Course.find({educator})
        res.json({success:true , courses})
     } catch (error) {
        res.json({success:false, message:error.message})
     }
}

//get educator dashboard, total earning etc
export const educatorDashboardData =async (req,res)=>{
    try {
        const educator=req.aut.userId;
        const courses=await Course.find({educator})
        const totalCourses=courses.length;

        const courseIds=courses.map(course=>course._id);

        //calculate earning
        const purchases =await Purchase.find({
            courseId:{$in:courseIds},
            status:'completed'
        });
        const totalEarnings= purchases.reduce((sum,purchase)=>sum+purchase.amount,0)

        //collect unique enrolled student
        const enrolledStudentsData=[];
        for(const course of courses){
            const students=await User.find({
                _id:{$in:course.enrolledStudents}
            },'name imageUrl');

            students.forEach(element=>{
                enrolledStudentsData.push({
                    courseTitle:course.courseTitle,
                    student
                })
            })
        }
        res.jsom({success:true, dashboardData:{
            totalEarnings, enrolledStudentsData, totalCourses
        }})
    } catch (error) {
       res.jsom({success:false,message:error.message}) 
    }
}

//get enrolled data
export const getEnrolledStudentsData=async (req,res)=>{
    try {
       const educator=req.aut.userId;
       const courses=await Course.find({educator})
        const courseIds=courses.map(course=>course._id);

        const purchases =await Purchase.find({
            course_Id:{$in:courseIds},
            status:'completed'
        }).populate('userId','name imageUrl').populate('courseId','courseTitle')

        const enrolledStudents=purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }))

        res.json({success:true, enrolledStudents})

    } catch (error) {
        res.json({success:false,message:error.message})
    }
}