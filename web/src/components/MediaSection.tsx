import { Card } from './ui/card'
import { useState } from 'react'
import { Image, Video } from 'lucide-react'
import UserReelsSection from './Reel/UserReelsSection'
import { useAppSelector } from '@/app/hooks'

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

const MediaSection = ({ media, setMediaOpenDetails, setMediaOpenModel, targetId, type = 'user' }) => {
  const [currentTab, setCurrentTab] = useState('images')

  const mediaTabs = [
    { id: 'images', label: 'Photos' },
    { id: 'videos', label: 'Videos' }
  ]

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
        <UserReelsSection targetId={targetId} type={type} />
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="flex flex-col w-full h-fit gap-4 p-4">
        <div className="flex">
          <Tabs
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            tabs={mediaTabs}
          />
        </div>

        <div className="relative flex w-full flex-col">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  )
}

export default MediaSection