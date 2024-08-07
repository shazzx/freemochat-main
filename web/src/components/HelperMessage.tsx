import React from 'react'

function HelperMessage({svg, message}) {
  return (
    <div className='flex p-12 flex-col items-center justify-center'>
        <div>
        {svg}
        </div>
    <span>{message}</span>
</div>

  )
}

export default HelperMessage