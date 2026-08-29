import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const MyCourses = () => {

  const { currency, backendUrl, authHeaders, isEducator, refreshCourses } = useContext(AppContext)

  // Only the signed-in educator's own courses, which is a different set from
  // the public `allCourses` list in context.
  const [courses, setCourses] = useState(null)

  // Id of the course currently uploading a thumbnail, so only its row is busy
  const [uploadingId, setUploadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // The course awaiting delete confirmation
  const [pendingDelete, setPendingDelete] = useState(null)

  // One hidden file input, retargeted at whichever course was clicked
  const fileInputRef = useRef(null)
  const targetCourseRef = useRef(null)

  const fetchEducatorCourses = useCallback(async () => {
    if (!isEducator) return

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/educator/courses`,
        await authHeaders()
      )

      if (data.success) {
        setCourses(data.courses)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }, [isEducator, backendUrl, authHeaders])

  useEffect(() => {
    fetchEducatorCourses()
  }, [fetchEducatorCourses])

  const pickThumbnail = (courseId) => {
    targetCourseRef.current = courseId
    fileInputRef.current?.click()
  }

  const handleThumbnailSelected = async (event) => {
    const file = event.target.files?.[0]
    const courseId = targetCourseRef.current

    // Let the same file be picked again after a failed attempt
    event.target.value = ''

    if (!file || !courseId) return

    const formData = new FormData()
    formData.append('image', file)

    setUploadingId(courseId)

    try {
      const { data } = await axios.put(
        `${backendUrl}/api/educator/course/${courseId}/thumbnail`,
        formData,
        await authHeaders()
      )

      if (data.success) {
        toast.success(data.message)
        setCourses(prev => prev.map(course =>
          course._id === courseId
            ? { ...course, courseThumbnail: data.courseThumbnail }
            : course
        ))
        // The student-facing list holds its own copy of the thumbnail
        refreshCourses()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }

    setUploadingId(null)
  }

  const confirmDelete = async () => {
    const course = pendingDelete
    if (!course) return

    setPendingDelete(null)
    setDeletingId(course._id)

    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/educator/course/${course._id}`,
        await authHeaders()
      )

      if (data.success) {
        toast.success(data.message)
        setCourses(prev => prev.filter(c => c._id !== course._id))
        refreshCourses()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }

    setDeletingId(null)
  }

  if (!courses) return <Loading />

  return (
    <div className='min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>

        {/* Shared by every row; retargeted on click */}
        <input
          type='file'
          accept='image/*'
          ref={fileInputRef}
          onChange={handleThumbnailSelected}
          hidden
        />

        <div className='flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
          <table className='md:table-auto table-fixed w-full overflow-hidden'>
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">All Courses</th>
                <th className="px-4 py-3 font-semibold truncate">Earnings</th>
                <th className="px-4 py-3 font-semibold truncate">Students</th>
                <th className="px-4 py-3 font-semibold truncate">Published On</th>
                <th className="px-4 py-3 font-semibold truncate">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    You haven't published any course yet.
                  </td>
                </tr>
              )}
              {courses.map((course) => {
                const busy = uploadingId === course._id || deletingId === course._id

                return (
                  <tr key={course._id} className="border-b border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3">
                      <div className='flex items-center space-x-3'>
                        {/* The thumbnail itself is the change-image affordance */}
                        <button
                          type='button'
                          onClick={() => pickThumbnail(course._id)}
                          disabled={busy}
                          title='Click to change the thumbnail'
                          className='relative group shrink-0 rounded overflow-hidden disabled:cursor-not-allowed'
                        >
                          <img
                            src={course.courseThumbnail}
                            alt={course.courseTitle}
                            className='w-16 block'
                          />
                          <span className='absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/60 text-white text-[10px] font-medium'>
                            {uploadingId === course._id ? '...' : 'Change'}
                          </span>
                        </button>
                        <span className="truncate hidden md:block">{course.courseTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {currency} {Math.floor((course.enrolledStudents?.length ?? 0) * (course.coursePrice - course.discount * course.coursePrice / 100))}
                    </td>
                    <td className="px-4 py-3">{course.enrolledStudents?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className='flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={() => pickThumbnail(course._id)}
                          disabled={busy}
                          className='text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline'
                        >
                          {uploadingId === course._id ? 'Uploading...' : 'Thumbnail'}
                        </button>
                        <button
                          type='button'
                          onClick={() => setPendingDelete(course)}
                          disabled={busy}
                          className='text-red-600 hover:underline disabled:text-gray-400 disabled:no-underline'
                        >
                          {deletingId === course._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-800/50 p-4'>
          <div className='bg-white rounded p-5 w-full max-w-sm text-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900'>Delete this course?</h2>

            <p className='mt-3 text-sm'>
              <span className='font-medium text-gray-900'>{pendingDelete.courseTitle}</span> will
              be removed permanently. This cannot be undone.
            </p>

            {(pendingDelete.enrolledStudents?.length ?? 0) > 0 && (
              <p className='mt-3 text-sm text-red-600'>
                {pendingDelete.enrolledStudents.length} student
                {pendingDelete.enrolledStudents.length > 1 ? 's are' : ' is'} enrolled. They
                will lose access and their progress will be deleted. Their purchase records
                are kept.
              </p>
            )}

            <div className='flex justify-end gap-3 mt-5'>
              <button
                type='button'
                onClick={() => setPendingDelete(null)}
                className='px-4 py-2 rounded border border-gray-300'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={confirmDelete}
                className='px-4 py-2 rounded bg-red-600 text-white'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyCourses
