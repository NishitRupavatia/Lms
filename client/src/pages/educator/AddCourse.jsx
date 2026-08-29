import React, { useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import uniqid from '../../utils/uniqid'
import Quill from 'quill' 
import 'quill/dist/quill.snow.css'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const AddCourse = () => {
  const quillRef = useRef(null)
  const editorRef = useRef(null)

  const { backendUrl, authHeaders, refreshCourses } = useContext(AppContext)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [currentChapterId, setCurrentChapterId] = useState(null)

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
  })

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      })
    }
  }, [])

  // Chapter Actions
  const handleAddChapter = () => {
    const newChapter = {
      chapterId: uniqid(),
      chapterTitle: `Chapter ${chapters.length + 1}`,
      chapterContent: [],
      collapsed: false,
    }
    setChapters([...chapters, newChapter])
  }

  const handleToggleChapter = (chapterId) => {
    setChapters(
      chapters.map((ch) =>
        ch.chapterId === chapterId ? { ...ch, collapsed: !ch.collapsed } : ch
      )
    )
  }

  const handleDeleteChapter = (chapterId) => {
    setChapters(chapters.filter((ch) => ch.chapterId !== chapterId))
  }

  // Lecture Actions
  const handleOpenAddLectureModal = (chapterId) => {
    setCurrentChapterId(chapterId)
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    })
    setShowPopup(true)
  }

  const handleAddLecture = () => {
    if (!lectureDetails.lectureTitle || !lectureDetails.lectureUrl) return

    const newLecture = {
      lectureId: uniqid(),
      ...lectureDetails,
    }

    setChapters(
      chapters.map((ch) => {
        if (ch.chapterId === currentChapterId) {
          return {
            ...ch,
            chapterContent: [...ch.chapterContent, newLecture],
          }
        }
        return ch
      })
    )

    setShowPopup(false)
  }

  const handleDeleteLecture = (chapterId, lectureIndex) => {
    setChapters(
      chapters.map((ch) => {
        if (ch.chapterId === chapterId) {
          return {
            ...ch,
            chapterContent: ch.chapterContent.filter((_, idx) => idx !== lectureIndex),
          }
        }
        return ch
      })
    )
  }

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!image) {
      return toast.error('Please select a course thumbnail')
    }

    const description = quillRef.current ? quillRef.current.root.innerHTML : ''

    // Quill leaves an empty paragraph behind, so check the text instead
    if (!quillRef.current || quillRef.current.getText().trim().length === 0) {
      return toast.error('Please add a course description')
    }

    if (chapters.length === 0) {
      return toast.error('Please add at least one chapter')
    }

    // Shape the form state into exactly what the Course schema expects:
    // `courseContent` chapters, numeric durations, and explicit ordering.
    const courseData = {
      courseTitle,
      courseDescription: description,
      coursePrice: Number(coursePrice),
      discount: Number(discount),
      courseContent: chapters.map((chapter, chapterIndex) => ({
        chapterId: chapter.chapterId,
        chapterOrder: chapterIndex + 1,
        chapterTitle: chapter.chapterTitle,
        chapterContent: chapter.chapterContent.map((lecture, lectureIndex) => ({
          lectureId: lecture.lectureId,
          lectureTitle: lecture.lectureTitle,
          lectureDuration: Number(lecture.lectureDuration) || 0,
          lectureUrl: lecture.lectureUrl,
          isPreviewFree: Boolean(lecture.isPreviewFree),
          lectureOrder: lectureIndex + 1,
        })),
      })),
    }

    // multipart/form-data: the thumbnail travels alongside the JSON payload
    const formData = new FormData()
    formData.append('courseData', JSON.stringify(courseData))
    formData.append('image', image)

    setIsSubmitting(true)

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        formData,
        await authHeaders()
      )

      if (data.success) {
        toast.success(data.message)

        setCourseTitle('')
        setCoursePrice(0)
        setDiscount(0)
        setImage(null)
        setChapters([])
        quillRef.current.setContents([])

        // Keep the shared course list in step with what was just published
        refreshCourses()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }

    setIsSubmitting(false)
  }

  return (
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-md w-full text-gray-500'>
        {/* Course Title */}
        <div className='flex flex-col gap-1'>
          <p>Course Title</p>
          <input 
            onChange={e => setCourseTitle(e.target.value)} 
            value={courseTitle} 
            type="text" 
            placeholder='Type here' 
            className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500' 
            required 
          />
        </div>

        {/* Course Description */}
        <div className='flex flex-col gap-1'>
          <p>Course Description</p>
          <div ref={editorRef}></div>
        </div>

        {/* Course Price and Course Thumbnail Row */}
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <p>Course Price</p>
            <input 
              onChange={e => setCoursePrice(e.target.value)} 
              value={coursePrice} 
              type="number" 
              placeholder='0' 
              min={0}
              className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' 
              required 
            />
          </div>

          <div className='flex items-center gap-3 mt-6'>
            <p className='text-gray-700 font-medium'>Course Thumbnail</p>
            <label htmlFor='thumbnailImage' className='flex items-center gap-3 cursor-pointer'>
              <img src={assets.file_upload_icon} alt="" className='p-3 bg-blue-500 rounded' />
              <input type="file" id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
              {image && <img className='max-h-10' src={URL.createObjectURL(image)} alt="" />}
            </label>
          </div>
        </div>

        {/* Discount % */}
        <div className='flex flex-col gap-1'>
          <p>Discount %</p>
          <input 
            onChange={e => setDiscount(e.target.value)} 
            value={discount} 
            type="number" 
            placeholder='0' 
            min={0} 
            max={100} 
            className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' 
            required 
          />
        </div>

        {/* Chapters Section */}
        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapter.chapterId || chapterIndex} className="bg-white border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className='flex items-center'>
                  <img 
                    src={assets.dropdown_icon} 
                    width={14} 
                    alt="" 
                    onClick={() => handleToggleChapter(chapter.chapterId)}
                    className={`mr-2 cursor-pointer transition-all ${chapter.collapsed ? "-rotate-90" : ""}`}
                  />
                  <span className="font-semibold">{chapterIndex + 1} {chapter.chapterTitle}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-500'>
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <img 
                    src={assets.cross_icon} 
                    alt="" 
                    className='cursor-pointer w-3'
                    onClick={() => handleDeleteChapter(chapter.chapterId)}
                  />
                </div>
              </div>

              {!chapter.collapsed && (
                <div className='p-4'>
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className='flex justify-between items-center mb-2'>
                      <span>
                        {lectureIndex + 1} {lecture.lectureTitle} - {lecture.lectureDuration} mins - <a href={lecture.lectureUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">Link</a> - {lecture.isPreviewFree ? 'Free Preview' : 'Paid'}
                      </span>
                      <img 
                        src={assets.cross_icon} 
                        alt="" 
                        className='cursor-pointer w-3' 
                        onClick={() => handleDeleteLecture(chapter.chapterId, lectureIndex)}
                      />
                    </div>
                  ))}

                  <div 
                    onClick={() => handleOpenAddLectureModal(chapter.chapterId)}
                    className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2'
                  >
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Chapter Button */}
          <div 
            onClick={handleAddChapter}
            className='flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer text-blue-600 font-medium'
          >
            + Add Chapter
          </div>

          {/* Add Lecture Modal */}
          {showPopup && (
            <div className='fixed inset-0 flex items-center justify-center bg-gray-800/50 z-50'>
              <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-80">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>

                <div className="mb-2">
                  <p>Lecture Title</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                  />
                </div>

                <div className="mb-2">
                  <p>Duration (minutes)</p>
                  <input
                    type="number"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                  />
                </div>

                <div className="mb-2">
                  <p>Lecture URL</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureUrl}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 my-4">
                  <p>Is Preview Free?</p>
                  <input
                    type="checkbox" 
                    className='mt-1 scale-125'
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                  />
                </div>

                <button 
                  type='button' 
                  onClick={handleAddLecture}
                  className="w-full bg-blue-400 text-white px-4 py-2 rounded"
                >
                  Add
                </button>

                <img 
                  onClick={() => setShowPopup(false)} 
                  src={assets.cross_icon} 
                  className='absolute top-4 right-4 w-4 cursor-pointer' 
                  alt="" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className='bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:bg-gray-500'
        >
          {isSubmitting ? 'ADDING...' : 'ADD'}
        </button>
      </form>
    </div>
  )
}

export default AddCourse