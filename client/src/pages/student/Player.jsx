import React, { useEffect, useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import Rating from '../../components/student/Rating'

const Player = () => {

  const {
    enrolledCourses,
    calculateChapterTime
  } = useContext(AppContext)

  const { courseId } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [playerData, setPlayerData] = useState(null)

  // Store completed lectures
  const [completedLectures, setCompletedLectures] = useState({})

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

  // Get course data
  const getCourseData = () => {

    const course = enrolledCourses.find(
      course => course._id === courseId
    )

    setCourseData(course)
  }

  // Toggle chapter
  const toggleSection = (index) => {

    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Load course
  useEffect(() => {

    if (enrolledCourses && enrolledCourses.length > 0) {
      getCourseData()
    }

  }, [enrolledCourses, courseId])


  // Mark lecture complete
  const markLectureComplete = () => {

    if (!playerData) return

    const lectureKey = `${playerData.chapter}-${playerData.lecture}`

    setCompletedLectures(prev => ({
      ...prev,
      [lectureKey]: true
    }))
  }


  // Check if lecture is completed
  const isLectureCompleted = (chapterIndex, lectureIndex) => {

    const lectureKey = `${chapterIndex + 1}-${lectureIndex + 1}`

    return completedLectures[lectureKey]
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

          {courseData &&
            courseData.courseContent.map((chapter, index) => (

              <div
                key={index}
                className='border border-gray-300 bg-white mb-2 rounded'
              >

                {/* Chapter Header */}

                <div
                  className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'
                  onClick={() => toggleSection(index)}
                >

                  <div className='flex items-center gap-2'>

                    <img
                      className={`transform transition-transform ${
                        openSections[index]
                          ? 'rotate-180'
                          : ''
                      }`}
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
                  className={`overflow-hidden transition-all duration-300 ${
                    openSections[index]
                      ? 'max-h-250'
                      : 'max-h-0'
                  }`}
                >

                  <ul className='md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>

                    {chapter.chapterContent.map((lecture, i) => {

                      const completed = isLectureCompleted(
                        index,
                        i
                      )

                      return (

                        <li
                          key={i}
                          className='flex items-start gap-2 py-2'
                        >

                          {/* Lecture Icon */}

                          <img
                            src={
                              completed
                                ? assets.blue_tick_icon
                                : assets.play_icon
                            }
                            alt='lecture icon'
                            className='w-4 h-4 mt-1'
                          />


                          <div className='flex items-center justify-between w-full text-gray-800 text-xs md:text-base'>

                            {/* Lecture Title */}

                            <p
                              className={`${
                                completed
                                  ? 'text-gray-400'
                                  : ''
                              }`}
                            >
                              {lecture.lectureTitle}
                            </p>


                            <div className='flex gap-2 items-center'>

                              {/* Watch */}

                              {lecture.lectureUrl && (

                                <p
                                  onClick={() => {

                                    const videoId =
                                      getYouTubeVideoId(
                                        lecture.lectureUrl
                                      )

                                    if (videoId) {

                                      setPlayerData({

                                        ...lecture,

                                        videoId: videoId,

                                        chapter: index + 1,

                                        lecture: i + 1

                                      })

                                    } else {

                                      console.error(
                                        'Could not extract YouTube video ID:',
                                        lecture.lectureUrl
                                      )

                                    }

                                  }}
                                  className='text-blue-500 cursor-pointer hover:underline'
                                >
                                  Watch
                                </p>

                              )}


                              {/* Duration */}

                              <p>

                                {humanizeDuration(
                                  lecture.lectureDuration *
                                    60 *
                                    1000,
                                  {
                                    units: ['h', 'm'],
                                    round: true
                                  }
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
          <Rating initialRating={0} />
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

              {/* Lecture Number + Title */}

              <div>

                <p className='text-sm text-gray-500'>
                  {playerData.chapter}.{playerData.lecture}
                </p>

                <h2 className='text-lg font-semibold'>
                  {playerData.lectureTitle}
                </h2>

              </div>


              {/* MARK COMPLETE BUTTON */}

              {(() => {

                const lectureKey =
                  `${playerData.chapter}-${playerData.lecture}`

                const completed =
                  completedLectures[lectureKey]

                return (

                  <button
                    onClick={markLectureComplete}
                    disabled={completed}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      completed
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >

                    {completed
                      ? '✓ Completed'
                      : 'Mark Complete'}

                  </button>

                )

              })()}

            </div>

          </div>

        ) : (

          /* NO VIDEO SELECTED */

          <div className='flex items-center justify-center h-full min-h-75 bg-gray-100 rounded-lg'>

            <p className='text-gray-500'>
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