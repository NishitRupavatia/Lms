import React, { useCallback, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import { Line } from 'rc-progress'
import Footer from '../../components/student/Footer'
import { useUser } from '@clerk/react'

const MyEnrollments = () => {

  const {
    enrolledCourses,
    calculateCourseDuration,
    calculateNoOfLectures,
    navigate,
    backendUrl,
    authHeaders,
  } = useContext(AppContext)

  const { user } = useUser()

  // One entry per enrolled course, in the same order as `enrolledCourses`
  const [progressArray, setProgressArray] = useState([])

  // Progress lives in its own collection, so it is fetched per course once the
  // enrollment list is known.
  const getCourseProgress = useCallback(async () => {
    if (!user || enrolledCourses.length === 0) {
      setProgressArray([])
      return
    }

    try {
      const config = await authHeaders()

      const results = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            config
          )

          const totalLectures = calculateNoOfLectures(course)
          const lectureCompleted = data.progressData?.lectureCompleted?.length ?? 0

          return { totalLectures, lectureCompleted }
        })
      )

      setProgressArray(results)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }, [user, enrolledCourses, backendUrl, authHeaders, calculateNoOfLectures])

  useEffect(() => {
    getCourseProgress()
  }, [getCourseProgress])

  const percentFor = (index) => {
    const entry = progressArray[index]
    if (!entry || entry.totalLectures === 0) return 0
    return (entry.lectureCompleted * 100) / entry.totalLectures
  }

  return (
    <>
      <div className='md:px-36 px-8 pt-10 min-h-screen'>
        <h1 className='text-2xl font-semibold'>My Enrollments</h1>

        {enrolledCourses.length === 0 ? (
          <div className='mt-10 text-gray-500'>
            <p>You haven't enrolled in any course yet.</p>
            <button
              onClick={() => navigate('/course-list')}
              className='mt-4 bg-blue-600 text-white px-5 py-2 rounded'
            >
              Browse courses
            </button>
          </div>
        ) : (
          <table className='md:table-auto table-fixed w-full overflow-hidden border mt-10'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>Course</th>
                <th className='px-4 py-3 font-semibold truncate'>Duration</th>
                <th className='px-4 py-3 font-semibold truncate'>Completed</th>
                <th className='px-4 py-3 font-semibold truncate'>Status</th>
              </tr>
            </thead>
            <tbody className='text-gray-700'>
              {enrolledCourses.map((course, index) => (
                <tr key={course._id} className='border-b border-gray-500/20'>
                  <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3'>
                    <img src={course.courseThumbnail} alt="" className='w-14 sm:w-24 md:w-28' />
                    <div className='flex-1'>
                      <p className='mb-1 max-sm:text-sm'>{course.courseTitle}</p>
                      <Line
                        strokeWidth={2}
                        percent={percentFor(index)}
                        className='bg-gray-300 rounded-full'
                      />
                    </div>
                  </td>
                  <td className='px-4 py-3 max-sm:hidden'>
                    {calculateCourseDuration(course)}
                  </td>
                  <td className='px-4 py-3 max-sm:hidden'>
                    {progressArray[index]
                      ? `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures}`
                      : '0 / 0'} <span>Lectures</span>
                  </td>
                  <td className='px-4 py-3 max-sm:text-right'>
                    <button
                      className='px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white rounded'
                      onClick={() => navigate('/player/' + course._id)}
                    >
                      {percentFor(index) === 100 ? 'Completed' : 'Ongoing'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  )
}

export default MyEnrollments
