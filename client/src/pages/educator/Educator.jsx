import React, { useContext } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import Navbar from '../../components/educator/Navbar'
import Sidebar from '../../components/educator/Sidebar'
import Footer from '../../components/educator/Footer'
import Loading from '../../components/student/Loading'
import { AppContext } from '../../context/AppContext'

const Educator = () => {

  const { isLoaded, isSignedIn } = useUser()
  const { isEducator } = useContext(AppContext)

  // Clerk resolves the session asynchronously; redirecting before it does
  // would bounce a legitimate educator straight back to the home page.
  if (!isLoaded) return <Loading />

  if (!isSignedIn || !isEducator) return <Navigate to='/' replace />

  return (
    <div className=' text-default min-h-screen bg-white'>

      <Navbar />

      <div className='flex'>
        <Sidebar />
        <div className='flex-1'>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Educator
