import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import Rating from '../../components/student/Rating'
import Loading from '../../components/student/Loading'
import { useUser } from '@clerk/react'

const Player = () => {

  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    authHeaders,
    userData,
    fetchUserEnrolledCourses,
  } = useContext(AppContext)

  const { user } = useUser()
  const { courseId } = useParams()

  const [openSections, setOpenSections] = useState({})
  const [playerData, setPlayerData] = useState(null)

  // Lecture ids the backend has recorded as completed for this course
  const [completedLectures, setCompletedLectures] = useState([])

  // Get YouTube Video ID
  const getYouTubeVideoId = (url) => {

    if (!url) return null

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/

    const match = url.match(regExp)

    return match && match[2].length === 11
      ? match[2]
      : null
  }

  // Derived during render from the enrolled courses in context
  const courseData = useMemo(
    () => enrolledCourses?.find(course => course._id === courseId) ?? null,
    [enrolledCourses, courseId]
  )

  // The student's own existing rating, if they left one before. Derived during
  // render — it is a pure function of data already in context.
  const initialRating = useMemo(
    () => courseData?.courseRatings?.find(r => r.userId === userData?._id)?.rating ?? 0,
    [courseData, userData]
  )

  const fetchCourseProgress = useCallback(async () => {
    if (!user) return

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        await authHeaders()
      )

      if (data.success) {
        setCompletedLectures(data.progressData?.lectureCompleted ?? [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }, [user, backendUrl, authHeaders, courseId])

  useEffect(() => {
    fetchCourseProgress()
  }, [fetchCourseProgress])

  // Toggle chapter
  const toggleSection = (index) => {

    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Mark lecture complete
  const markLectureComplete = async (lectureId) => {

    if (!lectureId || completedLectures.includes(lectureId)) return

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        await authHeaders()
      )

      if (data.success) {
        setCompletedLectures(prev => [...prev, lectureId])
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleRate = async (rating) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        await authHeaders()
      )

      if (data.success) {
        toast.success(data.message)
        // Pull the course list again so the new rating shows on a revisit
        fetchUserEnrolledCourses()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  // The enrollment list arrives asynchronously; show the spinner until it does
  if (!courseData) {
    return enrolledCourses.length === 0 ? (
      <Loading />
    ) : (
      <div className='min-h-screen flex items-center justify-center text-gray-500'>
        You are not enrolled in this course.
      </div>
    )
  }

  return (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>

        {/* ================= LEFT COLUMN ================= */}

        <div className='text-gray-800'>

          <h2 className='text-xl font-semibold'>
            Course Structure
          </h2>

          <div className='pt-5'>

            {courseData.courseContent?.map((chapter, index) => (

              <div
                key={chapter.chapterId || index}
                className='border border-gray-300 bg-white mb-2 rounded'
              >

                {/* Chapter Header */}

                <div
                  className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'
                  onClick={() => toggleSection(index)}
                >

                  <div className='flex items-center gap-2'>

                    <img
                      className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`}
                      src={assets.down_arrow_icon}
                      alt='arrow icon'
                    />

                    <p className='font-medium md:text-base text-sm'>
                      {chapter.chapterTitle}
                    </p>

                  </div>

                  <p className='text-sm md:text-base'>
                    {chapter.chapterContent.length} lectures -{' '}
                    {calculateChapterTime(chapter)}
                  </p>

                </div>


                {/* Lectures */}

                <div
                  className={`overflow-hidden transition-all duration-300 ${openSections[index] ? 'max-h-250' : 'max-h-0'}`}
                >

                  <ul className='md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>

                    {chapter.chapterContent.map((lecture, i) => {

                      const completed = completedLectures.includes(lecture.lectureId)

                      return (

                        <li
                          key={lecture.lectureId || i}
                          className='flex items-start gap-2 py-2'
                        >

                          <img
                            src={completed ? assets.blue_tick_icon : assets.play_icon}
                            alt='lecture icon'
                            className='w-4 h-4 mt-1'
                          />

                          <div className='flex items-center justify-between w-full text-gray-800 text-xs md:text-base'>

                            <p className={completed ? 'text-gray-400' : ''}>
                              {lecture.lectureTitle}
                            </p>

                            <div className='flex gap-2 items-center'>

                              {lecture.lectureUrl && (

                                <p
                                  onClick={() => {

                                    const videoId = getYouTubeVideoId(lecture.lectureUrl)

                                    if (videoId) {
                                      setPlayerData({
                                        ...lecture,
                                        videoId,
                                        chapter: index + 1,
                                        lecture: i + 1,
                                      })
                                    } else {
                                      toast.error('This lecture has an invalid YouTube URL')
                                    }

                                  }}
                                  className='text-blue-500 cursor-pointer hover:underline'
                                >
                                  Watch
                                </p>

                              )}

                              <p>
                                {humanizeDuration(
                                  lecture.lectureDuration * 60 * 1000,
                                  { units: ['h', 'm'], round: true }
                                )}
                              </p>

                            </div>

                          </div>

                        </li>

                      )

                    })}

                  </ul>

                </div>

              </div>

            ))}

          </div>

          <div className='flex items-center gap-2 py-3 mt-10'>
            <h1 className='text-xl font-bold'>Rate this course:</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>

        </div>


        {/* ================= RIGHT COLUMN ================= */}

        <div className='w-full'>

          {playerData ? (

            <div className='w-full'>

              {/* VIDEO */}

              <div className='aspect-video w-full'>

                <iframe
                  className='w-full h-full rounded-lg'
                  src={`https://www.youtube.com/embed/${playerData.videoId}`}
                  title={playerData.lectureTitle}
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  allowFullScreen
                />

              </div>


              {/* LECTURE INFORMATION */}

              <div className='flex items-center justify-between mt-3'>

                <div>

                  <p className='text-sm text-gray-500'>
                    {playerData.chapter}.{playerData.lecture}
                  </p>

                  <h2 className='text-lg font-semibold'>
                    {playerData.lectureTitle}
                  </h2>

                </div>

                {(() => {

                  const completed = completedLectures.includes(playerData.lectureId)

                  return (

                    <button
                      onClick={() => markLectureComplete(playerData.lectureId)}
                      disabled={completed}
                      className={`px-4 py-2 rounded text-sm font-medium transition ${completed
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                      {completed ? 'Completed' : 'Mark Complete'}
                    </button>

                  )

                })()}

              </div>

            </div>

          ) : (

            <div className='w-full'>
              <img
                src={courseData.courseThumbnail}
                alt={courseData.courseTitle}
                className='w-full rounded-lg'
              />
              <p className='text-gray-500 text-center mt-3'>
                Select a lecture to start watching
              </p>
            </div>

          )}

        </div>

      </div>
      <Footer />
    </>
  )
}

export default Player
