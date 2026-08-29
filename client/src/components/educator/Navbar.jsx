import React from 'react'
import { assets } from '../../assets/assets'
import { UserButton, useUser } from '@clerk/react'
import { Link } from 'react-router-dom'

const Navbar = () => {

  const { user } = useUser()

  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-400 py-3'>

      {/* Logo */}
      <Link to='/'>
        <img
          src={assets.logo}
          alt='Edemy Logo'
          className='w-28 lg:w-32'
        />
      </Link>

      {/* User */}
      <div className='flex items-center gap-4 text-gray-600'>

        <p className='text-sm'>
          Hi! {user?.fullName || user?.username || 'Educator'}
        </p>

        {user ? (
          <UserButton />
        ) : (
          <img
            src={assets.profile_img}
            alt='Profile'
            className='w-8 h-8'
          />
        )}

      </div>

    </div>
  )
}

export default Navbar