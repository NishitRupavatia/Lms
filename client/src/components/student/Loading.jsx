import React, { useContext, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'

const Loading = () => {

  const { path } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { backendUrl, authHeaders, fetchUserEnrolledCourses } = useContext(AppContext)

  const sessionId = searchParams.get('session_id')

  // Stripe redirects here after checkout. In production the webhook records the
  // enrollment, but a webhook cannot reach a localhost server, so we confirm the
  // session from the browser instead. The backend call is idempotent, so running
  // both paths is harmless.
  useEffect(() => {
    if (!path) return

    let cancelled = false

    const finish = async () => {
      if (sessionId) {
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-purchase`,
            { sessionId },
            await authHeaders()
          )

          if (data.success) {
            await fetchUserEnrolledCourses()
            if (!cancelled) toast.success('Enrollment successful')
          } else if (!cancelled) {
            toast.error(data.message)
          }
        } catch (error) {
          if (!cancelled) toast.error(error.response?.data?.message || error.message)
        }
      }

      if (!cancelled) navigate(`/${path}`, { replace: true })
    }

    finish()

    return () => { cancelled = true }
  }, [path, sessionId, backendUrl, authHeaders, fetchUserEnrolledCourses, navigate])

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='w-16 sm:w-20 aspect-square border-4 border-gray-300 border-t-4 border-t-blue-400 rounded-full animate-spin'></div>
    </div>
  )
}

export default Loading
