import React, { Ref, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import PostModel from '@/models/PostModel'
import { axiosClient } from '@/api/axiosClient'
import { DropdownMenuMain } from './DropDown'
import ReportModel from '@/models/ReportModel'
import { useInView } from 'react-intersection-observer'
import PostPromotionModel from '@/models/PostPromotionModel'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { Link } from 'react-router-dom'
import { WhatsappIcon, WhatsappShareButton } from 'react-share'
import { useRemovePost, useUpdatePost } from '@/hooks/Post/usePost'
import CPostModal from '@/models/CPostModal'
import { domain } from '@/config/domain'
import { toast } from 'react-toastify'
import { useAppSelector } from '@/app/hooks'
import { PostMediaCarousel } from './Post/PostMediaCarousel'
import { Copy } from 'lucide-react'

interface PostProps {
    postData: any,
    model?: boolean,
    username?: string,
    userId?: string,
    removeBookmark?: any,
    removePost?: any,
    postIndex?: number,
    pageIndex?: number
    useLikePost?: any,
    useBookmarkPost?: any,
    type?: string,
    fetchNextPage?: any,
    commentContent?: string,
    setEditCommentModelState?: any,
    editCommentModelState?: boolean,
    self?: boolean,
    profile?: string,
    isAdmin?: boolean
    isSearch?: boolean
    query?: string
    scrollRef?: any
}

const Post: React.FC<PostProps> = ({ postIndex, pageIndex, postData, model, useLikePost, useBookmarkPost, type, fetchNextPage, self, profile, isAdmin, isSearch, query, scrollRef }) => {
    const [shareState, setShareState] = useState(false)
    const [ref, inView] = useInView()
    const [date, setDate] = useState("")
    const [modelTrigger, setModelTrigger] = useState(false)
    const [confirmModelState, setConfirmModelState] = useState(false)
    const [reportModelState, setReportModelState] = useState(false)
    const [editPostModelState, setEditPostModelState] = useState(false)
    const [_profile, setProfile] = useState(undefined)
    const [fullname, setFullname] = useState(undefined)
    const { user } = useAppSelector((state) => state.user)
    const shareRef = useRef(null)
    const [expanded, setExpanded] = useState(false)
    const words = postData?.content?.split(' ')
    const expandable = words?.slice(0, 40).join(' ')

    const { mutate } = useLikePost(isSearch ? query : type + "Posts", postData?.targetId)
    const bookmarkMutation = useBookmarkPost(isSearch ? query : type + "Posts", postData?.targetId, isSearch)
    const updatePost = useUpdatePost(type + "Posts", postData?.targetId)
    const removePost = useRemovePost(type + "Posts", postData?.targetId)

    const deletePost = async () => {
        removePost.mutate({ postId: postData?._id, postIndex, pageIndex, media: postData?.media, })
        toast.success("Post deleted")

    }

    const _updatePost = async ({ content, selectedMedia, formData, media, setModelTrigger }) => {
        let _media = media.filter((media) => {
            if (!media?.file) {
                return media
            }
        })

        let postDetails = { content, media: _media, type, postId: postData._id }
        formData.append("postData", JSON.stringify(postDetails))
        updatePost.mutate({ content, formData, selectedMedia, pageIndex, postIndex, postId: postData?._id, media })
        setModelTrigger(false)
    }

    const [postPromotion, setPostPromotion] = useState(false)
    useEffect(() => {
        let viewPost = async () => {
            const { data } = await axiosClient.post("/posts/view", {
                postId: postData?._id,
                type: "promotion"
            })
            console.log(data)
        }
        if (inView && fetchNextPage) {
            console.log('fetching')
            fetchNextPage()
        }
        if (inView && postData?.promotion?.active == 1) {
            console.log("promoted post view")
            viewPost()
        }
    }, [inView])

    useEffect(() => {
        if (postData) {
            let date = format(postData.createdAt ?? Date.now(), 'MMM d, yyy h:mm a')
            console.log(date)
            setProfile(postData?.target?.profile)
            setFullname(postData?.firstname + postData?.lastname)
            setDate(date)
        }
    }, [postData]);


    useEffect(() => {
        function handleClickOutside(event) {
            if (shareRef.current && !shareRef.current.contains(event.target)) {
                setShareState(false);
            }
        }

        if (shareState) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [shareState])


    let navigation = postData?.type == "user" ? postData?.target?.username : postData?.target?.handle

    if (postData?.isUploaded == false) {
        return (
            <div className='max-w-xl w-full bg-card flex gap-4 p-3 sm:min-w-[420px]' >
                <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24">
                    <path
                        d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                        stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path
                        d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                        stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                    </path>
                </svg>
                Uploading...
            </div>
        )
    }
    console.log(postData)

    return (
        <div className='max-w-xl w-full sm:min-w-[420px]' ref={ref} onClick={() => {
            if (shareState) {
                setShareState(false)
            }
        }} key={postData && postData._id}>
            {
                editPostModelState &&
                <CPostModal setModelTrigger={setEditPostModelState} editPost={true} postDetails={postData} updatePost={_updatePost} />
            }
            {
                modelTrigger &&
                <PostModel useLikePost={useLikePost} useBookmarkPost={useBookmarkPost} postIndex={postIndex} pageIndex={pageIndex} postId={postData?._id} postData={postData} setModelTrigger={setModelTrigger} type={type} />
            }

            {
                reportModelState &&
                <ReportModel postId={postData?._id} setModelTrigger={setReportModelState} />
            }

            {
                postPromotion &&
                <PostPromotionModel postId={postData?._id} setPostPromotion={setPostPromotion} />
            }
            <Card className="w-full border-muted" ref={scrollRef}>
                <CardHeader className='p-3' >
                    <div className='flex items-center justify-between'>
                        <Link to={`${domain}/${postData?.type}/${navigation}`}>
                            <div className='flex gap-2'>
                                <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                    {postData?.type !== 'user' ?
                                        <Avatar >
                                            <AvatarImage src={_profile} alt="Avatar" />
                                            <AvatarFallback>{(postData?.target?.name && postData?.target?.name[0]?.toUpperCase()) + postData?.target?.name[1]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        :
                                        <>
                                            {self ?
                                                <Avatar >
                                                    <AvatarImage src={profile} alt="Avatar" />
                                                    <AvatarFallback>{(postData?.target?.firstname && postData?.target?.firstname[0]?.toUpperCase()) + (postData?.target?.lastname && postData?.target?.lastname[0]?.toUpperCase())}</AvatarFallback>
                                                </Avatar> :
                                                <Avatar >
                                                    <AvatarImage src={_profile} alt="Avatar" />
                                                    <AvatarFallback>{(postData?.target?.firstname && postData?.target?.firstname[0]?.toUpperCase()) + (postData?.target?.lastname && postData?.target?.lastname[0]?.toUpperCase())}</AvatarFallback>
                                                </Avatar>
                                            }
                                        </>

                                    }
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <h3 className='text-card-foreground flex gap-2 text-sm'>{postData?.target?.username || postData?.target?.name}{isAdmin && <div className='p-1  bg-primary rounded-md text-xs text-white'>admin</div>}</h3>
                                    <span className='text-muted-foreground text-xs'>{postData?.promotion ? "sponsored" : date}</span>
                                </div>
                            </div>
                        </Link>
                        <DropdownMenuMain deletePost={deletePost} setConfirmModelState={setConfirmModelState} setReportModelState={setReportModelState} reportModelState={reportModelState} postPromotion={postPromotion} setPostPromotion={setPostPromotion} setEditPostModelState={setEditPostModelState} postBy={postData?.user == user._id} />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-2xl p-0 px-3 font-bold">
                    <div className='text-sm font-normal'>

                        {expanded ?
                            postData?.content :
                            <p>
                                {expandable}
                                {expandable?.length > 40 && <>...{' '} <span className='text-primary text-sm cursor-pointer' onClick={() => setExpanded(true)}>Show more</span></>}
                            </p>
                        }
                    </div>
                    {
                        postData && postData.media &&
                        <div className=' overflow-hidden aspect-auto max-w-xl flex items-center justify-center bg-background' onClick={() => {
                            if (!model) {
                                setModelTrigger(true)
                            }
                        }}>
                            {model ?
                                <PostMediaCarousel media={postData?.media} />
                                :
                                postData.media[0]?.type == 'video' ?
                                    <video className='w-full h-full' autoPlay={false} src={postData?.media && postData?.media[0]?.url} controls></video>
                                    :
                                    <img className='object-contain' src={postData?.media[0]?.url} alt="" />


                            }
                        </div>
                    }
                </CardContent>
                <CardFooter className='py-2 px-3 md:p-4 select-none flex flex-col'>
                    <div className='hidden sm:flex gap-2 w-full flex-start'>
                    <span className='text-sm'>
                    {postData?.likesCount > 0 &&  "Likes " + postData?.likesCount  }
                    </span>
                    <span className='text-sm'>
                    {postData?.commentsCount > 0 &&  "Comments " + postData?.commentsCount  }
                    </span >
                    </div>
                    <div className='flex  items-center justify-between w-full '>

                        <div className='flex gap-1 items-center cursor-pointer' onClick={async () => {
                            // await axiosClient.post("", { postId: postData?._id })
                            mutate({ postId: postData._id, pageIndex, postIndex, authorId: postData.user, type: postData?.type, targetId: postData?.targetId })
                        }}>
                            {/* <svg width="40" height="40" className={`${postData?.isLikedByUser ? 'fill-red-500 stroke-red-500' : 'stroke-foreground dark:stroke-foreground'} `} viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M19.4994 30.0692L14.8713 25.3192L10.2796 20.5692C7.79547 17.944 7.79547 13.8353 10.2796 11.2101C11.496 10.0411 13.1435 9.4302 14.828 9.52358C16.5125 9.61696 18.0824 10.4062 19.1621 11.7026L19.4994 12.0335L19.8334 11.6883C20.9132 10.392 22.4831 9.60271 24.1675 9.50933C25.852 9.41595 27.4996 10.0269 28.7159 11.1959C31.2001 13.8211 31.2001 17.9298 28.7159 20.555L24.1243 25.305L19.4994 30.0692Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg> */}
                            <img className='transform scale-x-[-1]' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABZJJREFUWEftVm1Mk1cUPue+fSmEj4KAIMgAO2EylUWKLFuiMxkxMyAYZvdjGre44SYuRtgHYWiHH+g+1GRzm9mWaTLjMn8Y67I/Swg/XFwEdZn6Y0lVBMYKXUtLW/r53vfM21ECWhDZon+8SdO8955zz3Oe83URHvLCh2wfHgF4IAxYLJYUWZYNqqqWDQwM2K1W62mj0Tgiwh8TwFZTSRJR4vqRUODMyQNXnULutZaKuQkyyJ+1XfhzYt6cOnVK0mq1KzjnS4jIXFdX1xs97+zs1BQWFm4BgM0AkOfz+RIGBwfP2u32RqPRODglgC3vLzdIEh4loh1f7uk6t7W1/HVg2A6Ex7/Yc+GdqAGTyaQpLS09whirBwArADTW1tb+IM77+/uXcs6/B4AS8R0Oh8Fms/ncbneDx+M5aTQaQ5MAvGWqmK8S36YQN6ugcccBfg2ktANJC4jhHgD4RVF401f7L/0hFM1mc7KqqscQsU58E9E1IqrX6/VXdDrdS0R0ABEzOefg8/nA7XZDQkIC+P3+M3a7vaGmpuavSQC2t1RkhTV0EIA0KtIhpuJeAvgdEapQhQ4EPHhkb1ePUBLUut3uZiJqBQDtGCM98fHxHxQXF+cCwA5hXOwLw6Ojo6DT6SAYDPocDsdOv99/tLq62jcJwPr1IGUWl1cCQrNK8KOEsFoFXMwAOgHJCsAcnPOOo/sudpvN5qeISNBbFM0jSZKC2dnZlszMzHQAmBcNk2BA/AQQh8NxORAIbKmpqbkYPZ+UhPXvlenkONZIACsFeCIMMCROgPEIGEfEzyo2+nbNmp0mItqOiEkRLxAhLS0NsrOzIS4ubjxHhWGv1xuJv9/vJ4/HczwcDrdG6Y+ZhA0thkrSsE+ASAuA3jm6eeGczEXXkhNTfurt+637sYLqcDImf4eIlVHvBb05OTmg1UajEckJGBoaiuxJkgQej+e6y+Vq7urqMre1tSkxGRCbb7QankPEFVlzCq+sLN/wri454+kEbYonXptoRcRzAwMDHTab7W1ELBPyt+MOhYWFEc8FE9ElAAjPxb/dbrc6nc6PfD7fN0aj0TuxjO/qA/s/XvT8siznxmVFy4t9c/eVDo8o8aqqQnp6OgGA4vV6+/r6+lJDoVA6YwyKiooiXk40HjXg8XjAarWOhEKhxu7u7hNtbW2R0psSAP0MOaoWdqmAmxTtYo0985h06MgJVBQOTU1NEb0xj0RNQ25uLqSmpt55ZyTrBf2yLMPIyMj5qqqqZ+8SGtu4i4HDh/PnMYzfZViQvyD3yUPLXB4lIxgMQlZW1qQ7FEWJxDaW54J6ce50OoeHhoa2rVu3TlRMzBWzFb/ZYniBSVL55hcPPzNHl7N6KuVY+6FQSGQ8DA8PC+8/rK2tbZ5OPyaA+voyWc7GNS9XHajMmft4w/0AEF0vEAiAy+Xyer3elWvXrr183wAiCiZgPa/0bETE4/cDYIz6UYfDcTAjI2OvwWAIzw7AvwNlCef8ykwBiFxxuVwi+VxJSUmnZVm2AIBTVdVLer1+vPtNW4YTD8fGqQCwaCYgRLmKH2NMZYwFAYADgO/2XPg8Pz9/d6w77vkguXnzZjVj7OxMAEwhYwOA2oKCgl9nBUAo3bp1a/dY70+e6hEzDcDr4XC4bOHChe5ZA+jv709QVXUDEW0aC4foPmwGrIju2V5QUCDG9sz7QCxJItLcuHHjCUmSxBBaKuY9IiYTURwRISJmAIB+gq5KRB0ajebVvLy8gf8MIHqBMCZmAWMsnXOeIkmSrCiKyKUKRDQBQBoA/C0eTZzzT/V6/dVZl+EMKB4XsVgs82VZbgeARM75yWAweL6kpES8E6dd96yCe10wgRnW29ubFQgE0Gq12latWjU+8x8IAzMFeqfc/8bAIwCzZeAfB5Z+P+kq0XIAAAAASUVORK5CYII=" alt="" />
                            <span className={`text-sm hidden sm:block ${postData?.isLikedByUser && "text-primary"}`}>Freedom</span>
                            {postData?.likesCount && postData?.likesCount > 0 ?
                                <span className='text-sm sm:hidden'>{postData?.likesCount}</span> : <span></span>
                            }
                        </div>
                        <div className='flex gap-0 items-center cursor-pointer' onClick={() => {
                            if (!model) {
                                setModelTrigger(true)
                            }
                        }}>
                            <svg width="36" height="35" className="stroke-foreground  dark:stroke-foreground" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M13.8829 7.91666H24.4517C27.6778 7.94105 30.2735 10.5758 30.2498 13.8019V20.9475C30.2612 22.497 29.6566 23.9876 28.5689 25.0913C27.4812 26.195 25.9996 26.8214 24.4501 26.8327H13.8829L8.08317 30.0833V13.8019C8.07179 12.2524 8.67645 10.7618 9.76412 9.65807C10.8518 8.55436 12.3334 7.92795 13.8829 7.91666Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            <span className='text-sm hidden sm:block'>Comment</span>
                            {postData?.commentsCount && postData?.commentsCount > 0 ?
                                <span className='text-sm sm:hidden'>{postData?.commentsCount}</span> : <span></span>
                            }
                        </div>
                        <div className='flex gap-0 items-center cursor-pointer' onClick={async () => {
                            bookmarkMutation.mutate({ postId: postData._id, pageIndex, postIndex, targetId: postData?.targetId, type })
                        }}>
                            <svg width="34" height="34" className={`${postData?.isBookmarkedByUser ? " fill-black dark:fill-white" : "stroke-foreground"} dark:stroke-foreground`} viewBox="0 0 39 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M29.3447 28.1251V8.54816C29.3518 7.79031 29.0222 7.06097 28.4283 6.52057C27.8345 5.98018 27.025 5.67302 26.178 5.66666H13.5113C12.6643 5.67302 11.8548 5.98018 11.261 6.52057C10.6671 7.06097 10.3375 7.79031 10.3447 8.54816V28.1251C10.2694 28.6903 10.5796 29.241 11.1322 29.5231C11.6847 29.8053 12.3724 29.764 12.878 29.4185L18.8947 24.7704C19.437 24.3324 20.2618 24.3324 20.8042 24.7704L26.8113 29.4199C27.3172 29.7657 28.0053 29.8069 28.558 29.5244C29.1108 29.2418 29.4207 28.6906 29.3447 28.1251Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            <span className='text-sm hidden sm:block'>Bookmark</span>
                            {postData?.bookmarksCount && postData?.bookmarksCount > 0 ?
                                <span className='text-sm sm:hidden'>{postData?.bookmarksCount}</span> : <span></span>
                            }
                        </div>

                        <div className='relative flex gap-0 items-center cursor-pointer z-10' onClick={() => {
                            console.log(shareState)
                            setShareState(true)
                        }}>
                            <svg width="43" height="42" className="stroke-foreground  dark:stroke-foreground" viewBox="0 0 43 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M25.4095 27.8205L33.26 21.2405C33.5699 20.9872 33.7496 20.6082 33.7496 20.208C33.7496 19.8078 33.5699 19.4288 33.26 19.1755L25.4095 12.5955C24.9908 12.2376 24.4046 12.1498 23.8994 12.3695C23.3942 12.5891 23.0586 13.0777 23.0347 13.628V16.2233C12.0132 14.314 9.25 24.177 9.25 29.7455C11.8067 25.5035 18.4322 17.814 23.0347 24.177V26.7793C23.0554 27.3312 23.3898 27.8227 23.8956 28.0445C24.4015 28.2663 24.9896 28.1793 25.4095 27.8205Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            <span className='text-sm hidden sm:block' >Share</span>
                            {shareState &&
                                <div className='border-accent border absolute flex flex-col gap-4 items-center justify-center top-10 -left-5 drop-shadow-xl z-10 bg-card rounded-md p-2' ref={shareRef}>
                                    <WhatsappShareButton url={'localhost:5173'} >
                                        <div className='flex gap-1 items-center justify-center'>
                                            <WhatsappIcon borderRadius={60} size={24} /> <span>Whatsapp</span>
                                        </div>
                                    </WhatsappShareButton>
                                        <div className='flex gap-1 items-center justify-center' onClick={() => {
                                            navigator.clipboard.writeText(`${domain}/post/${postData._id}?type=${postData.type}`);
                                            toast.info("URL Copied")
                                        }}>
                                            <Copy size={24} /> <span>Copy URL</span>
                                        </div>
                                </div>}
                            {/* <span className='text-sm sm:hidden'>25</span> */}
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div >
    )

}

export default React.memo(Post)