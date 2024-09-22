import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { useBookamrks } from '@/hooks/Bookmarks/useBookmark'
import { useBookmarkPost, useLikeBookmarkedPost } from '../hooks/Bookmarks/useBookmark'
import { BookmarkIcon } from 'lucide-react'

function Bookmarked() {
    const { user } = useAppSelector(data => data.user)

    const { data, isLoading } = useBookamrks()
    console.log(data)

    return (
        <div className='w-full flex sm:px-24 px-4 overflow-y-auto border-muted'>
            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='flex gap-3 items-center border border-muted p-4 bg-card rounded-md'>
                    <BookmarkIcon />
                    <span className='text-base'>Bookmarked Posts</span>
                </div>
                <div className='relative flex w-full items-center  flex-col gap-2 '>
                    {!isLoading && data.length > 0 ? data.map((page, i) => {
                        return page.bookmarks.map((postData, postIndex) => (
                            <Post useLikePost={useLikeBookmarkedPost} useBookmarkPost={useBookmarkPost} pageIndex={i} postIndex={postIndex} postData={{ ...postData?.post, target: postData?.target, user: postData?.user }} userId={user?._id} username={user?.username} profile={user?.images?.profile} key={postData?.post?._id} type={postData?.type} />
                        ))
                    })
                        :
                        <ScreenLoader />
                    }
                </div>
            </div>
        </div>

    )
}

export default Bookmarked