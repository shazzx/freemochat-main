import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { useBookamrks } from '@/hooks/Bookmarks/useBookmark'
import { useBookmarkPost, useLikeBookmarkedPost } from '../hooks/Bookmarks/useBookmark'
import { BookmarkIcon, Video, Grid, List } from 'lucide-react'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


const useIntersectionObserver = ({
  onIntersect,
  threshold = 0.1,
  rootMargin = '100px',
  enabled = true
}) => {
  const targetRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        })
      },
      { threshold, rootMargin }
    )

    const currentTarget = targetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [onIntersect, threshold, rootMargin, enabled])

  return targetRef
}


const LoadingIndicator = () => (
  <div className="flex justify-center items-center py-8">
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      <span className="text-sm">Loading more...</span>
    </div>
  </div>
)


const EndOfResults = () => (
  <div className="flex justify-center items-center py-8">
    <span className="text-sm text-muted-foreground">No more content to load</span>
  </div>
)





































































































































































































const PostsList = ({
  data,
  isLoading,
  user,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage
}) => {
  
  const loadMoreRef = useIntersectionObserver({
    onIntersect: onLoadMore,
    enabled: !isLoading && !isFetchingNextPage && hasNextPage,
    threshold: 0.1,
    rootMargin: '100px'
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <ScreenLoader />
      </div>
    )
  }

  if (!data || data.length === 0 || data[0]?.bookmarks?.length === 0) {
    return (
      <div className="flex flex-col w-full items-center justify-center py-20">
        <svg className="w-60 h-40 mb-4" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="transparent" d="M0 0h900v600H0z" />
          <path d="M777.431 522H385.569C374.055 522 365 513.427 365 503.191V276.809c0-10.236 9.055-18.809 20.569-18.809h391.862c11.514 0 20.569 8.572 20.569 18.809v226.382c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" />
          <path d="M798 268.775H365v-6.206c0-11.358 9.211-20.569 20.569-20.569h391.862c11.358 0 20.569 9.211 20.569 20.569v6.206z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" />
          <path d="M385.61 261.224a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm20.195 0a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" />
          <path fillRule="evenodd" clipRule="evenodd" d="M337 289.704c0 31.055 16.436 58.395 41.657 75.629-.011 9.897.012 23.231.012 37.225l40.87-20.221a114.597 114.597 0 0 0 21.633 2.071c57.318 0 104.173-42.166 104.173-94.704 0-52.537-46.855-94.704-104.173-94.704C383.854 195 337 237.167 337 289.704z" fill="#666AF6" stroke="#666AF6" strokeWidth="12.5" strokeLinecap="round" strokeLinejoin="round" />
          <path fillRule="evenodd" clipRule="evenodd" d="m433.223 259.957 36.981 21.876c5.324 3.149 5.324 10.857 0 14.017l-36.981 21.877c-5.429 3.206-12.281-.707-12.281-7.003v-43.753c0-6.319 6.852-10.232 12.281-7.014z" fill="#fff" />
        </svg>
        <span className="text-center text-muted-foreground">No Bookmarked Posts.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((page, i) => {
        return page.bookmarks.map((postData, postIndex) => {
          return (
            <Post
              useLikePost={useLikeBookmarkedPost}
              useBookmarkPost={useBookmarkPost}
              pageIndex={i}
              postIndex={postIndex}
              postData={{ ...postData?.post, target: postData?.target, user: postData?.user }}
              userId={user?._id}
              username={user?.username}
              profile={user?.images?.profile}
              key={postData?.post?._id}
              type={postData?.type}
            />
          )
        })
      })}

      <div className="w-full">
        {isFetchingNextPage && <LoadingIndicator />}
        {hasNextPage && !isFetchingNextPage && (
          <div ref={loadMoreRef} className="h-4" />
        )}
        {!hasNextPage && data.length > 0 && <EndOfResults />}
      </div>
    </div>
  )
}

function Bookmarked() {
  const { user } = useAppSelector(data => data.user)
  const navigate = useNavigate()

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useBookamrks()

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  const handleReelPress = useCallback((reel) => {
    
    const currentItems = bookmarkedItems || []

    
    const enrichedReel = {
      ...reel,
      _navigationTimestamp: Date.now() 
    }

    navigate('/reels', {
      state: {
        initialReelId: reel._id,
        reelData: enrichedReel,
        sourceMode: 'bookmarks',
        
        reelIndex: currentItems.findIndex(item => item._id === reel._id),
        totalReels: currentItems.length,
        
        initialItems: currentItems
      }
    })
  }, [navigate])

  
  const bookmarkedItems = useMemo(() => {
    if (!data || isLoading) return []

    const items = []
    data.forEach(page => {
      if (page.bookmarks && page.bookmarks.length > 0) {
        page.bookmarks.forEach(bookmark => {
            items.push({
              ...bookmark.post,
              target: bookmark.target,
              user: bookmark.user,
              type: bookmark.type
            })
        })
      }
    })

    return items
  }, [data, isLoading])


  return (
    <div className='w-full flex md:px-6 lg:px-24 overflow-y-auto border-muted'>
      <div className='max-w-4xl w-full flex flex-col gap-4'>
        <div className='flex gap-3 items-center border border-muted p-4 bg-card rounded-md'>
          <BookmarkIcon />
          <span className='text-base'>Bookmarked Posts</span>
        </div>

        <div className='relative flex w-full flex-col'>
           <PostsList
          data={data}
          isLoading={isLoading}
          user={user}
          onLoadMore={handleLoadMore}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
        </div>
      </div>
    </div>
  )
}

export default Bookmarked