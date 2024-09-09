import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import Stories from '@/components/Stories'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBookmarkFeedPost, useCreatePost, useFeed, useLikeFeedPost } from '@/hooks/Post/usePost'
import CPostModal from '@/models/CPostModal'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect, useMemo, useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { useInView } from 'react-intersection-observer'
import { useNavigate, useSearchParams } from 'react-router-dom'

function FeedSection() {
    const [searchParams] = useSearchParams()
    const [postModal, setPostModal] = useState(false)
    const [feed, setFeed] = useState([])
    const { user } = useAppSelector((data) => data.user)
    const { inView, ref } = useInView()
    const { data, isLoading, fetchNextPage } = useFeed()

    // useEffect(() => {

    //     let promotionPaymentSuccess = async () => {
    //         const { data } = await axiosClient.get("posts/promotion/payment/success?promotionId=" + searchParams.get("promotionId"))
    //         console.log(data)
    //     }

    //     if (searchParams.get("success")) {
    //         promotionPaymentSuccess()
    //     }


    // }, [])

    const createPost = useCreatePost("userPosts", user?._id)

    const _createPost = async ({ content, selectedMedia, formData }) => {
        let postDetails = { content, type: "user", targetId: user?._id }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, type: "user", target: user })
        setPostModal(false)
    }

    const navigate = useNavigate()

    // useEffect(() => {
    //     console.log('fetching next posts...')
    //     fetchNextPage()
    // }, [inView])


    return (
        <div className='w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted md:px-6 lg:px-24'>
            {searchParams.get("createpost") && <CPostModal setModelTrigger={setPostModal} createPost={_createPost} />}

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
                                                <AvatarImage src={user?.profile} alt="Avatar" />
                                                <AvatarFallback>{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                    <div
                                        className="max-w-2xl w-full rounded-md p-2 cursor-pointer flex items-center appearance-none bg-background border border-accent shadow-none"
                                        onClick={() => {
                                            navigate("?createpost=true")
                                        }}
                                    >
                                        <span className='text-sm'>Start writing a post</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    {/* {!data.isLoading && data && data.length && data[0]?.viewed &&
                        <Card className="w-full mx-auto bg-card border border-muted rounded-lg p-6 flex items-center space-x-4">
                            <FaCheckCircle className="text-green-500 text-3xl" />
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold">All Caught Up!</h2>
                                <p className="mt-1">You've seen all new posts.</p>
                            </div>
                        </Card>
                    } */}
                    <div className='flex w-full items-center  flex-col gap-2  '>
                        {!isLoading && data.length > 0 ? data.map((page, pageIndex: number) => {

                            return page.posts.map((post, postIndex: number) => {
                                if (pageIndex == data.length - 1 && data[pageIndex].posts.length - 2 == postIndex) {
                                    return (
                                        <Post useLikePost={useLikeFeedPost} useBookmarkPost={useBookmarkFeedPost} pageIndex={pageIndex} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.profile} key={post?._id} type="user" scrollRef={ref} fetchNextPage={fetchNextPage} />
                                    )
                                }
                                return (
                                    <Post useLikePost={useLikeFeedPost} useBookmarkPost={useBookmarkFeedPost} pageIndex={pageIndex} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.profile} key={post?._id} type="user" />
                                )
                            })

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

export default FeedSection