import React from 'react'

function ScreenLoader({ limit }: { limit?: number }) {
  console.log(limit)
  const screens = limit ? [limit] : [1, 2, 3, 4, 5, 6, 7]
  return (
    <div className='flex flex-col gap-2 w-full'>
      {screens.map((_, i) => (
        <div key={i + 223} className="border bg-card shadow rounded-md p-4 w-full mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full dark:bg-slate-700 bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-gray-300 dark:bg-slate-700 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 dark:bg-slate-700 bg-gray-300 rounded col-span-2"></div>
                  <div className="h-2 dark:bg-slate-700 bg-gray-300 rounded col-span-1"></div>
                </div>
                <div className="h-2 dark:bg-slate-700 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ScreenLoader