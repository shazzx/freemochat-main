import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { useBookmarkGroupFeedPost, useBookmarkPost, useGroupsPosts, useLikeGroupFeedPost, useLikePost } from '@/hooks/Post/usePost'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function Groups() {
    const { user } = useAppSelector((data) => data.user)
    const { data, isLoading } = useGroupsPosts('group')
    console.log(data[0])

    const [modalState, setModalState] = useState(false)
    console.log('hello')
    return (
        <div className='w-full sm:px-24 flex  overflow-y-auto border-muted'>
            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='flex justify-between gap-3 items-center border border-muted p-4 bg-card'>
                    <Link to="/manage/groups"><Button>Manage Groups</Button></Link>
                </div>
                <div className='relative max-w-xl w-full flex flex-col gap-2 '>
                    <div className='flex w-full items-center  flex-col gap-2  '>
                        {!isLoading && data.length > 0 ? data.map((page, i) => {
                            return page.posts.map((post, postIndex) => (
                                <Post useLikePost={useLikeGroupFeedPost} useBookmarkPost={useBookmarkGroupFeedPost} pageIndex={i} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.profile} key={post?._id} type={'groupFeed'}/>
                            ))

                        })
                            :
                            <ScreenLoader />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Groups