import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from 'humanize-duration'
import {useAuth,useUser} from '@clerk/react'

export const AppContext=createContext();

export const AppContextProvider= (props)=>{

    const currency=import.meta.env.VITE_CURRENCY
    const backendUrl=import.meta.env.VITE_BACKEND_URL

    const navigate= useNavigate()

    const {getToken}=useAuth()
    const {user} =useUser()

    const [allCourses, setAllCourses]= useState([])
    // Derived from Clerk's publicMetadata, which the backend sets via /api/educator/update-role
    const isEducator = user?.publicMetadata?.role === 'educator'
    const [enrolledCourses, setEnrolledCourses]= useState([])

    //fetch all courses
    const fetchAllCourses=async ()=>{
        setAllCourses(dummyCourses)
    }

    //function to calculate average rating

    const calculateRating=(course)=>{
        if(course.courseRatings.length===0){
            return 0;
        }
        let totalRating=0
        course.courseRatings.forEach(rating=>{
            totalRating+=rating.rating
        })
        return totalRating/course.courseRatings.length
    }
    //function to calculate course chap time
    const calculateChapterTime=(chapter)=>{
        let time =0
        chapter.chapterContent.map((lecture)=>time +=lecture.lectureDuration)
        return humanizeDuration(time * 60 *1000,{units:["h","m"]})
    }
    //func to cal course duration
    const calculateCourseDuration=(course)=>{
        let time=0;
        course.courseContent.map((chapter)=>chapter.chapterContent.map((lecture)=>time+=lecture.lectureDuration))
        return humanizeDuration(time * 60 *1000,{units:["h","m"]})
    }

    // func to count no of lec

    const calculateNoOfLectures=(course)=>{
        let totalLectures=0;
        course.courseContent.forEach(chapter=>{
            if(Array.isArray(chapter.chapterContent)){
                totalLectures+=chapter.chapterContent.length
            }
        });
        return totalLectures;
    }

    //fetch user enrolled courses
    const fetchUserEnrolledCourses= async ()=>{
        setEnrolledCourses(dummyCourses)
    }

    useEffect(()=>{
       fetchAllCourses()
       fetchUserEnrolledCourses()
    },[])

    // Ask the backend to promote the signed-in user to educator.
    // The Clerk session token must be forwarded, otherwise the API replies 401.
    const becomeEducator=async ()=>{
        try{
            const token=await getToken()
            const res=await fetch(`${backendUrl}/api/educator/update-role`,{
                headers:{ Authorization:`Bearer ${token}` }
            })
            const data=await res.json()
            if(data.success){
                // Refresh the local Clerk user so publicMetadata.role is visible immediately
                await user.reload()
                return true
            }
            console.error('becomeEducator failed:',data.message)
            return false
        }catch(error){
            console.error('becomeEducator error:',error)
            return false
        }
    }
    const value={
        currency, backendUrl, allCourses, navigate, calculateRating, isEducator, becomeEducator, getToken,calculateChapterTime,calculateCourseDuration,calculateNoOfLectures,enrolledCourses,fetchUserEnrolledCourses
    };
    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}