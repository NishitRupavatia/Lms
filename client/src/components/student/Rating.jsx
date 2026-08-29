import React, { useState } from 'react'

const Rating = ({ initialRating, onRate }) => {

  const [rating, setRating] = useState(initialRating || 0)

  // Adjust state while rendering when the prop changes, which React handles in
  // the same pass — an effect here would cause an extra render.
  const [prevInitialRating, setPrevInitialRating] = useState(initialRating)

  if (initialRating !== prevInitialRating) {
    setPrevInitialRating(initialRating)
    setRating(initialRating || 0)
  }

  const handleRating = (value) => {
    setRating(value)

    if (onRate) {
      onRate(value)
    }
  }

  return (
    <div>
      {Array.from({ length: 5 }, (_, index) => {

        const starValue = index + 1

        return (
          <span
            key={index}
            className={`text-xl sm:text-2xl cursor-pointer transition-colors ${
              starValue <= rating
                ? 'text-yellow-500'
                : 'text-gray-400'
            }`}
            onClick={() => handleRating(starValue)}
          >
            &#9733;
          </span>
        )
      })}
    </div>
  )
}

export default Rating