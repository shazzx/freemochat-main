import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import Stories from '@/components/Stories'
import { Input } from '@/components/ui/input'
import { useBookmarkFeedPost, useBookmarkSinglePost, useCreatePost, useFeed, useLikeFeedPost, useLikeSinglePost, usePost } from '@/hooks/Post/usePost'
import CPostModal from '@/models/CPostModal'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useParams, useSearchParams } from 'react-router-dom'

function PostSection() {
    const [searchParams] = useSearchParams()
    const params = useParams()
    const [postModal, setPostModal] = useState(false)
    const [feed, setFeed] = useState([])
    const { user } = useAppSelector((data) => data.user)
    const { inView, ref } = useInView()
    const { data, isLoading} = usePost(params.post, searchParams.get('type'))
    console.log(data)

    const createPost = useCreatePost("userPosts", user?._id)

    const _createPost = async ({ content, selectedMedia, formData }) => {
        let postDetails = { content, type: "user", targetId: user?._id }
        formData.append("postData", JSON.stringify(postDetails))
        // createPost.mutate({ content, formData, selectedMedia, type: "user", target: user })
        
        setPostModal(false)
    }

    return (
        <div className='w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted px-4 md:px-6 lg:px-24'>
            {postModal && <CPostModal  setModelTrigger={setPostModal} createPost={_createPost} />}
            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='max-w-xl w-full flex flex-col gap-2 relative py-4'>
                    <div className='flex w-full items-center  flex-col gap-2  '>
                        {!isLoading && data.length > 0 ? data.map((post, postIndex: number) => {
                                return (
                                    <Post useLikePost={useLikeSinglePost} useBookmarkPost={useBookmarkSinglePost} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.profile} key={post?._id} type="user" />
                                )
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

export default PostSection