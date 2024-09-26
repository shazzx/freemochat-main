import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { useBookmarkPageFeedPost, useLikePageFeedPost, usePagesPosts } from '@/hooks/Post/usePost'
import CPostModal from '@/models/CPostModal'
import React, { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Link, useSearchParams } from 'react-router-dom'

function PagesSection() {
    const [searchParams] = useSearchParams()
    const [postModal, setPostModal] = useState(false)
    const { user } = useAppSelector((data) => data.user)
    const [ref, inView] = useInView()
    console.log(ref)

    const { data, isSuccess, isLoading, fetchNextPage } = usePagesPosts("page")
    useEffect(() => {
        console.log(data)
    }, [data])

    useEffect(() => {
        console.log(inView)
        if (data && isSuccess && inView) {
            fetchNextPage()
        }
    }, [inView])

    useEffect(() => {

        let promotionPaymentSuccess = async () => {
            const { data } = await axiosClient.get("posts/promotion/payment/success?promotionId=" + searchParams.get("promotionId"))
            console.log(data)
        }

        if (searchParams.get("success")) {
            promotionPaymentSuccess()
        }


    }, [])
    console.log('hello')

    return (
        <div className='w-full flex justify-center md:justify-normal overflow-y-auto border-muted md:px-6 lg:px-24'>
            {postModal && <CPostModal setModelTrigger={setPostModal} />}
            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='flex justify-between gap-3 items-center border border-muted p-4 bg-card'>
                    <Link to="/manage/pages"><Button>Manage Pages</Button></Link>
                </div>
                <div className='w-full flex flex-col gap-2 relative '>
                    <div className='flex w-full items-center  flex-col gap-2  '>
                        {!isLoading && data.length > 0 ? data.map((page, i) => {
                            return page.posts.map((post, postIndex) => {
                                if (postIndex == page.posts.length - 1) {
                                    return (
                                        <Post useLikePost={useLikePageFeedPost} useBookmarkPost={useBookmarkPageFeedPost} pageIndex={i} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.images?.profile} key={post?._id} type={'page'} fetchNextPage={fetchNextPage} />
                                    )
                                }

                                return (
                                    <Post useLikePost={useLikePageFeedPost} useBookmarkPost={useBookmarkPageFeedPost} pageIndex={i} postIndex={postIndex} postData={post} userId={user?._id} username={user?.username} profile={user?.images?.profile} key={post?._id} type={'page'} />)
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

export default React.memo(PagesSection)