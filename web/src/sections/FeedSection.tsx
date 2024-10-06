import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import Stories from '@/components/Stories'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBookmarkFeedPost, useCreatePost, useFeed, useLikeFeedPost } from '@/hooks/Post/usePost'
import BottomCreatePost from '@/models/BottomCreatePost'
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
    console.log(data)

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

    const _createPost = async ({ visibility, content, selectedMedia, formData }) => {
        let postDetails = { content, type: "user", targetId: user?._id, visibility }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, type: "user", target: user })
        setPostModal(false)
    }

    const navigate = useNavigate()

    // useEffect(() => {
    //     console.log('fetching next posts...')
    //     fetchNextPage()
    // }, [inView])

    const [width, setWidth] = useState(window.innerWidth)

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth)
            console.log(window.innerWidth)
        })
    }, [])

    return (
        <div className='w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted md:px-6 lg:px-24'>
            {searchParams.get("createpost") && ( width < 540) ? <BottomCreatePost setModelTrigger={setPostModal} createPost={_createPost} /> : searchParams.get("createpost") && <CPostModal setModelTrigger={setPostModal} createPost={_createPost} />}

            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='w-full flex items-center  border border-muted p-2 bg-card'>
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
                        {isLoading &&
                        <ScreenLoader />
                    }
                        {!isLoading && data.length > 0 && data[0].posts.length > 0 ? data.map((page, pageIndex: number) => {

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
                            <div className=' flex flex-col w-full gap-8 relative top-[60%]  items-center justify-center'>
                            <svg  className='w-[60%] h-[50%]' viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="M777.431 522H385.569C374.055 522 365 513.427 365 503.191V276.809c0-10.236 9.055-18.809 20.569-18.809h391.862c11.514 0 20.569 8.572 20.569 18.809v226.382c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M798 268.775H365v-6.206c0-11.358 9.211-20.569 20.569-20.569h391.862c11.358 0 20.569 9.211 20.569 20.569v6.206z" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M385.61 261.224a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm20.195 0a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" /><path d="M649.431 431H257.569C246.055 431 237 422.427 237 412.191V185.809c0-10.236 9.055-18.809 20.569-18.809h391.862c11.514 0 20.569 8.572 20.569 18.809v226.382c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M670 185.775H237v-6.206c0-11.358 9.211-20.569 20.569-20.569h391.862c11.358 0 20.569 9.211 20.569 20.569v6.206z" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M257.61 178.224a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm20.195 0a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" /><path d="M513.431 343H121.569C110.055 343 101 334.427 101 324.191V97.809C101 87.573 110.055 79 121.569 79h391.862C524.945 79 534 87.573 534 97.809V324.19c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M534 105.775H101v-6.206C101 88.21 110.211 79 121.569 79h391.862C524.789 79 534 88.21 534 99.569v6.206z" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M121.61 98.224a4.847 4.847 0 1 0-.001-9.694 4.847 4.847 0 0 0 .001 9.694zm20.195 0a4.847 4.847 0 1 0-.001-9.694 4.847 4.847 0 0 0 .001 9.694zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" /><path d="M257.569 431c-1.918 0-3.77-.248-5.526-.709l-.509 1.934a23.15 23.15 0 0 1-4.735-1.818l.918-1.777c-3.362-1.738-6.146-4.332-8.031-7.456l-1.713 1.034a20.744 20.744 0 0 1-2.073-4.627l1.912-.587a18.443 18.443 0 0 1-.812-5.424v-5.877h-2v-4.898h2V389.04h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.754h-2v-4.898h2V272.47h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-5.877c0-1.885.284-3.704.812-5.424l-1.912-.587a20.744 20.744 0 0 1 2.073-4.627l1.713 1.034c1.885-3.124 4.669-5.718 8.031-7.456l-.918-1.777a23.15 23.15 0 0 1 4.735-1.818l.509 1.934a21.737 21.737 0 0 1 5.526-.709h6.013v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.012v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h6.013c1.918 0 3.77.248 5.526.709l.509-1.934a23.15 23.15 0 0 1 4.735 1.818l-.918 1.777c3.362 1.738 6.146 4.332 8.031 7.456l1.713-1.034a20.744 20.744 0 0 1 2.073 4.627l-1.912.587c.528 1.72.812 3.539.812 5.424v5.877h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.754h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v5.877c0 1.885-.284 3.704-.812 5.424l1.912.587a20.744 20.744 0 0 1-2.073 4.627l-1.713-1.034c-1.885 3.124-4.669 5.718-8.031 7.456l.918 1.777a23.15 23.15 0 0 1-4.735 1.818l-.509-1.934a21.737 21.737 0 0 1-5.526.709h-6.013v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.012v-2h-12.026v2h-5.011v-2H353.78v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2H285.63v2h-5.011v-2h-12.026v2h-5.011v-2h-6.013z" stroke="#E1E4E5" stroke-width="4" stroke-dasharray="12 5" /><path fill-rule="evenodd" clip-rule="evenodd" d="M337 289.704c0 31.055 16.436 58.395 41.657 75.629-.011 9.897.012 23.231.012 37.225l40.87-20.221a114.597 114.597 0 0 0 21.633 2.071c57.318 0 104.173-42.166 104.173-94.704 0-52.537-46.855-94.704-104.173-94.704C383.854 195 337 237.167 337 289.704z" fill="#666AF6" stroke="#666AF6" stroke-width="12.5" stroke-linecap="round" stroke-linejoin="round" /><path fill-rule="evenodd" clip-rule="evenodd" d="m433.223 259.957 36.981 21.876c5.324 3.149 5.324 10.857 0 14.017l-36.981 21.877c-5.429 3.206-12.281-.707-12.281-7.003v-43.753c0-6.319 6.852-10.232 12.281-7.014z" fill="#fff" /></svg>
                            <span className='text-center'>Welcome! It looks like there are no posts here yet. Stay tuned as our community grows—new posts will be shared soon.</span>
                        </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeedSection