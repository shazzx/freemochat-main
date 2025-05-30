import { Card } from './ui/card'
import { useState } from 'react'
import { Image, Video } from 'lucide-react'
import UserReelsSection from './Reel/UserReelsSection'
import { useAppSelector } from '@/app/hooks'

// Tabs Component
const Tabs = ({ currentTab, setCurrentTab, tabs }) => {
  return (
    <div className="flex space-x-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentTab === tab.id
              ? 'bg-white dark:bg-background  text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          {tab.id === 'images' ? <Image size={16} /> : <Video size={16} />}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Images List Component
const ImagesList = ({ images, setMediaOpenDetails, setMediaOpenModel }) => {
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col w-full items-center justify-center py-20">
        <svg width="190" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="transparent" d="M0 0h900v600H0z" />
          <path fillRule="evenodd" clipRule="evenodd" d="M249.841 115.734v250.041c0 13.572 10.867 24.563 24.287 24.563h147.186l64.25-91.581c3.063-4.369 10.722-4.369 13.786 0l22.494 32.07.175.25.152-.221 48.243-70.046c3.336-4.85 11.695-4.85 15.031 0l63.892 92.779v12.215-250.07c0-13.572-10.897-24.562-24.288-24.562H274.128c-13.42 0-24.287 10.99-24.287 24.562z" fill="#666AF6" />
          <path d="M362.501 281.935c-34.737 0-62.896-28.16-62.896-62.897 0-34.736 28.159-62.896 62.896-62.896s62.897 28.16 62.897 62.896c0 34.737-28.16 62.897-62.897 62.897z" fill="#fff" />
          <path d="M449.176 445.963H259.725c-7.79 0-14.188-6.399-14.188-14.188 0-7.882 6.398-14.281 14.188-14.281h189.451c7.882 0 14.28 6.399 14.28 14.281 0 7.789-6.398 14.188-14.28 14.188zm189.543.002H501.662c-7.882 0-14.281-6.399-14.281-14.281 0-7.882 6.399-14.281 14.281-14.281h137.057c7.883 0 14.281 6.399 14.281 14.281 0 7.882-6.398 14.281-14.281 14.281zm-298.503 62.592h-80.491c-7.79 0-14.188-6.398-14.188-14.188 0-7.882 6.398-14.281 14.188-14.281h80.491c7.882 0 14.281 6.399 14.281 14.281 0 7.79-6.399 14.188-14.281 14.188zm298.503.002H388.065c-7.882 0-14.28-6.398-14.28-14.28s6.398-14.281 14.28-14.281h250.654c7.883 0 14.281 6.399 14.281 14.281 0 7.882-6.398 14.28-14.281 14.28z" fill="#E1E4E5" />
        </svg>
        <span className="text-center text-muted-foreground">No Images</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {images.map((image, index) => {
        if (!image) {
          return null
        }
        return (
          <div
            className="relative h-24 w-24 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
            key={`${image}-${index}`}
            onClick={() => {
              setMediaOpenDetails({ type: 'image', url: image })
              setMediaOpenModel(true)
            }}
          >
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src={image}
              alt={`Image ${index + 1}`}
            />
          </div>
        )
      })}
    </div>
  )
}

// Videos List Component
const VideosList = ({ videos, setMediaOpenDetails, setMediaOpenModel }) => {
  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col w-full items-center justify-center py-20">
        <svg width="190" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="transparent" d="M0 0h900v600H0z" />
          <path d="M777.431 522H385.569C374.055 522 365 513.427 365 503.191V276.809c0-10.236 9.055-18.809 20.569-18.809h391.862c11.514 0 20.569 8.572 20.569 18.809v226.382c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" />
          <path d="M798 268.775H365v-6.206c0-11.358 9.211-20.569 20.569-20.569h391.862c11.358 0 20.569 9.211 20.569 20.569v6.206z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" />
          <path d="M385.61 261.224a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm20.195 0a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" />
          <path fillRule="evenodd" clipRule="evenodd" d="M337 289.704c0 31.055 16.436 58.395 41.657 75.629-.011 9.897.012 23.231.012 37.225l40.87-20.221a114.597 114.597 0 0 0 21.633 2.071c57.318 0 104.173-42.166 104.173-94.704 0-52.537-46.855-94.704-104.173-94.704C383.854 195 337 237.167 337 289.704z" fill="#666AF6" stroke="#666AF6" strokeWidth="12.5" strokeLinecap="round" strokeLinejoin="round" />
          <path fillRule="evenodd" clipRule="evenodd" d="m433.223 259.957 36.981 21.876c5.324 3.149 5.324 10.857 0 14.017l-36.981 21.877c-5.429 3.206-12.281-.707-12.281-7.003v-43.753c0-6.319 6.852-10.232 12.281-7.014z" fill="#fff" />
        </svg>
        <span className="text-center text-muted-foreground">No Videos</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {videos.map((video, index) => {
        return (
          <div
            className="relative h-24 w-24 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 group"
            key={`${video}-${index}`}
            onClick={() => {
              setMediaOpenDetails({ type: 'video', url: video })
              setMediaOpenModel(true)
            }}
          >
            <video
              src={video}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all duration-200">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                className="opacity-90 group-hover:scale-110 transition-transform duration-200"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const MediaSection = ({ media, setMediaOpenDetails, setMediaOpenModel, targetId }) => {
  // Tab state
  const [currentTab, setCurrentTab] = useState('images')

  // Define tabs
  const mediaTabs = [
    { id: 'images', label: 'Photos' },
    { id: 'videos', label: 'Videos' }
  ]

  console.log(media)

  // Render tab content
  const renderTabContent = () => {
    if (currentTab === 'images') {
      return (
        <ImagesList
          images={media?.images || []}
          setMediaOpenDetails={setMediaOpenDetails}
          setMediaOpenModel={setMediaOpenModel}
        />
      )
    } else {
      return (
        // <VideosList
        //   videos={media?.videos || []}
        //   setMediaOpenDetails={setMediaOpenDetails}
        //   setMediaOpenModel={setMediaOpenModel}
        // />
        <UserReelsSection targetId={targetId} />
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="flex flex-col w-full h-fit gap-4 p-4">
        {/* Tabs */}
        <div className="flex">
          <Tabs
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            tabs={mediaTabs}
          />
        </div>

        {/* Content */}
        <div className="relative flex w-full flex-col">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  )
}

export default MediaSection