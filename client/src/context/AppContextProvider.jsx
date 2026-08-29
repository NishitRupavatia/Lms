import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from 'humanize-duration'
import { useAuth, useUser } from '@clerk/react'
import axios from 'axios'
import { toast } from "react-toastify";
import { AppContext } from "./AppContext";

export const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const navigate = useNavigate()

    const { getToken } = useAuth()
    const { user } = useUser()

    const [allCourses, setAllCourses] = useState([])
    // Derived from Clerk's publicMetadata, which the backend sets via /api/educator/update-role
    const isEducator = user?.publicMetadata?.role === 'educator'
    const [enrolledCourses, setEnrolledCourses] = useState([])
    const [userData, setUserData] = useState(null)

    // Every protected endpoint reads the Clerk session from the Authorization
    // header, so this is the single place that builds it.
    const authHeaders = useCallback(async () => {
        const token = await getToken()
        return { headers: { Authorization: `Bearer ${token}` } }
    }, [getToken])

    //fetch all courses
    const fetchAllCourses = useCallback(async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/course/all');

            if (data.success) {
                return data.courses
            }

            toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }

        return null
    }, [backendUrl])

    //function to calculate average rating
    const calculateRating = useCallback((course) => {
        if (!course?.courseRatings?.length) {
            return 0;
        }
        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        // One decimal place reads better than the raw float in the star rows
        return Math.round((totalRating / course.courseRatings.length) * 10) / 10
    }, [])

    //function to calculate course chapter time
    const calculateChapterTime = useCallback((chapter) => {
        let time = 0
        chapter.chapterContent.forEach((lecture) => { time += lecture.lectureDuration })
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })
    }, [])

    //func to calculate course duration
    const calculateCourseDuration = useCallback((course) => {
        let time = 0
        course.courseContent?.forEach((chapter) =>
            chapter.chapterContent.forEach((lecture) => { time += lecture.lectureDuration })
        )
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })
    }, [])

    // func to count no of lectures
    const calculateNoOfLectures = useCallback((course) => {
        let totalLectures = 0
        course.courseContent?.forEach(chapter => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length
            }
        })
        return totalLectures
    }, [])

    // Load the Mongo user record. The backend creates it on first call, which
    // is what makes sign-in work locally without the Clerk webhook.
    const fetchUserData = useCallback(async () => {
        if (!user) return

        try {
            const { data } = await axios.get(`${backendUrl}/api/user/data`, await authHeaders())

            if (data.success) {
                setUserData(data.user)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [backendUrl, authHeaders, user])

    //fetch user enrolled courses
    const fetchUserEnrolledCourses = useCallback(async () => {
        if (!user) return

        try {
            const { data } = await axios.get(
                `${backendUrl}/api/user/enrolled-courses`,
                await authHeaders()
            )

            if (data.success) {
                // Newest enrollment first
                setEnrolledCourses(data.enrolledCourses.slice().reverse())
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [backendUrl, authHeaders, user])

    // Synchronising with an external system (the courses API) on mount.
    // `ignore` drops a late response if the provider unmounts or the URL
    // changes before the request resolves.
    useEffect(() => {
        let ignore = false

        const load = async () => {
            const courses = await fetchAllCourses()
            if (!ignore && courses) {
                setAllCourses(courses)
            }
        }

        load()

        return () => { ignore = true }
    }, [fetchAllCourses])

    // Pull the signed-in user's record and enrollments once Clerk resolves.
    useEffect(() => {
        if (!user) {
            setUserData(null)
            setEnrolledCourses([])
            return
        }

        fetchUserData()
        fetchUserEnrolledCourses()
    }, [user, fetchUserData, fetchUserEnrolledCourses])

    // Public refresh helper: unlike fetchAllCourses it commits the result
    const refreshCourses = useCallback(async () => {
        const courses = await fetchAllCourses()
        if (courses) setAllCourses(courses)
    }, [fetchAllCourses])

    // Ask the backend to promote the signed-in user to educator.
    // The Clerk session token must be forwarded, otherwise the API replies 401.
    const becomeEducator = useCallback(async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/educator/update-role`,
                await authHeaders()
            )

            if (data.success) {
                // Refresh the local Clerk user so publicMetadata.role is visible immediately
                await user.reload()
                toast.success(data.message)
                return true
            }
            toast.error(data.message)
            return false
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            return false
        }
    }, [backendUrl, authHeaders, user])

    const value = useMemo(() => ({
        currency,
        backendUrl,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        becomeEducator,
        getToken,
        authHeaders,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        enrolledCourses,
        userData,
        fetchUserData,
        fetchUserEnrolledCourses,
        refreshCourses,
    }), [
        currency, backendUrl, allCourses, navigate, calculateRating, isEducator,
        becomeEducator, getToken, authHeaders, calculateChapterTime, calculateCourseDuration,
        calculateNoOfLectures, enrolledCourses, userData, fetchUserData,
        fetchUserEnrolledCourses, refreshCourses,
    ])

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}
