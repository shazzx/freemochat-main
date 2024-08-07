import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import Stories from '@/components/Stories'
import { Input } from '@/components/ui/input'
import { useBookmarkFeedPost, useCreatePost, useFeed, useLikeFeedPost } from '@/hooks/Post/usePost'
import CPostModal from '@/models/CPostModal'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function FeedSection() {
    const [searchParams] = useSearchParams()
    const [postModal, setPostModal] = useState(false)
    const [feed, setFeed] = useState([])
    const { user } = useAppSelector((data) => data.user)

    const { data, isSuccess, isLoading, fetchNextPage } = useFeed()
    useEffect(() => {
        console.log(!isLoading, data)
    }, [data])

    useEffect(() => {

        let promotionPaymentSuccess = async () => {
            const { data } = await axiosClient.get("posts/promotion/payment/success?promotionId=" + searchParams.get("promotionId"))
            console.log(data)
        }
        let feed = async () => {
            const { data } = await axiosClient.get("/posts/feed")
            let posts = data.reverse()
            console.log(posts)
            setFeed(posts)
        }

        // feed()

        if (searchParams.get("success")) {
            promotionPaymentSuccess()
        }


    }, [])

    const createPost = useCreatePost("userPosts", user?._id)

    const _createPost = async ({ content, selectedMedia, formData }) => {
        let postDetails = { content, type: "user", targetId: user?._id }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, type: "user", target: user })
        setPostModal(false)
    }

    return (
        <div className='w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted px-4 md:px-6 lg:px-24'>
            {postModal && <CPostModal setModelTrigger={setPostModal} createPost={_createPost} />}
            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='w-full flex items-center  border border-muted px-2 bg-card'>
                    <Stories />
                </div>
                <div className='max-w-xl w-full flex flex-col gap-2 relative '>
                    <div className='w-full flex items-center justify-center h-fit border border-muted p-3 bg-card'>
                        <div className="w-full flex-1">
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                            }}>
                                <div className="relative flex gap-2">
                                    <div className='w-12'>
                                        <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                            <Avatar >
                                                <AvatarImage src={user?.images?.profile} alt="Avatar" />
                                                <AvatarFallback>{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Start writing a post"
                                        className="max-w-2xl appearance-none bg-background shadow-none"
                                        onClick={() => {
                                            setPostModal(true)
                                        }}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className='flex w-full items-center  flex-col gap-2  '>
                        {!isLoading && data.length > 0 ? data.map((page, i) => {

                            return page.posts.map((post, postIndex) => (
                                <Post useLikePost={useLikeFeedPost} useBookmarkPost={useBookmarkFeedPost} pageIndex={i} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.images?.profile} key={post?._id} type="user" />
                            ))

                        })
                            :
                            <ScreenLoader />
                        }
                    </div>
                </div>
                {/* <div className='flex w-full items-center  flex-col gap-2 '>
                    <Post />
                    <Post />
                </div> */}
            </div>
            {/* <div className='w-80 h-full hidden lg:flex '>
            </div> */}


        </div>
    )
}

export default FeedSection