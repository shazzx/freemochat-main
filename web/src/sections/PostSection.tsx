import React, { useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { useBookmarkSinglePost, useLikeSinglePost, usePost } from '@/hooks/Post/usePost'

function PostSection() {
    const [searchParams] = useSearchParams()
    const { post: postId } = useParams()
    const { user } = useAppSelector((state) => state.user)
    const isInitialMount = useRef(true)
    
    const postType = searchParams.get('type')
    const { data: post, isLoading, refetch } = usePost(postId, postType)

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        
        if (!isLoading) {
            refetch()
        }
    }, [postId, postType, isLoading, refetch])

    const renderPost = () => {
        if (isLoading) {
            return <ScreenLoader />
        }

        if (!post?.length) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    No post found
                </div>
            )
        }

        return post.map((post, postIndex) => (
            <Post
                key={post?._id}
                useLikePost={useLikeSinglePost}
                useBookmarkPost={useBookmarkSinglePost}
                postIndex={postIndex}
                postData={post}
                userId={user?._id}
                username={user?.username}
                profile={user?.profile}
                type="user"
            />
        ))
    }

    return (
        <div className="w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted px-4 md:px-6 lg:px-24">
            <div className="max-w-xl w-full flex flex-col gap-2">
                <div className="max-w-xl w-full flex flex-col gap-2 relative py-4">
                    <div className="flex w-full items-center flex-col gap-2">
                        {renderPost()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostSection