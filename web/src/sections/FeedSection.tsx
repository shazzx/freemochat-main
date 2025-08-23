import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import CreatePostStack from '@/components/Post/CreatePostStack'
import ReelsSuggestionSection from '@/components/Reel/ReelsSuggetion'
import ScreenLoader from '@/components/ScreenLoader'
import Stories from '@/components/Stories'
import { useBookmarkFeedPost, useCreatePost, useFeed, useLikeFeedPost } from '@/hooks/Post/usePost'
import { useCreateReel } from '@/hooks/Reels/useReels'
import BottomCreatePost from '@/models/BottomCreatePost'
import CPostModal from '@/models/CPostModal'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { useInView } from 'react-intersection-observer'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

function FeedSection() {
    const [searchParams] = useSearchParams()
    const [postModal, setPostModal] = useState(false)
    const [feed, setFeed] = useState([])
    const { user } = useAppSelector((data) => data.user)
    const { inView, ref } = useInView()
    const [openPostStackModal, setOpenPostStackModal] = useState(false)

    // Add reels cursor state
    const reelsCursorRef = useRef(null);
    const [reelsCursor, setReelsCursor] = useState(null);

    useEffect(() => {
        reelsCursorRef.current = reelsCursor;
    }, [reelsCursor]);

    const { data, isLoading, fetchNextPage } = useFeed(reelsCursorRef)

    const createPost = useCreatePost("userPosts", user?._id)
    const createReel = useCreateReel()

    const _createPost = async ({ visibility, content, selectedMedia, backgroundColor, mentions, mentionReferences, formData }) => {
        let postDetails = { content, type: "user", postType: 'post', backgroundColor, mentions, targetId: user?._id, visibility }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, mentions, mentionReferences, backgroundColor, postType: 'post', type: "user", target: user })
        setPostModal(false)
    }

    const _createReel = async ({ visibility, content, formData }) => {
        let reelDetails = { content, type: "user", postType: 'post', targetId: user?._id, visibility }
        formData.append("reelData", JSON.stringify(reelDetails))
        createReel.mutate(formData)
        setPostModal(false)
    }

    const navigate = useNavigate()

    // Function to navigate to reels screen
    const navigateToReels = useCallback((reel) => {
        // Navigate to reels screen with the selected reel
        navigate(`/reels/${reel._id}`, {
            state: {
                sourceMode: 'feed',
                initialReelId: reel._id,
                reelData: reel
            }
        });
    }, [navigate]);

    // Process flattened data similar to React Native version
    const flattenedData = useMemo(() => {
        if (!data || !data.length) return [];

        // Group reels by page for easier display
        const reelsByPage = {};

        return data.flatMap((page, pageIndex) => {
            // Split posts and reels
            const regularPosts = page.posts;
            const reelsSuggestions = page.reels;

            // Store reels for this page
            if (reelsSuggestions.length > 0) {
                reelsByPage[pageIndex] = reelsSuggestions;

                // Update reels cursor if available
                if (pageIndex === data.length - 1) {
                    const lastReel = reelsSuggestions[reelsSuggestions.length - 1];
                    setReelsCursor(lastReel.createdAt);
                }
            }

            // Add regular posts with metadata
            const result = regularPosts.map(post => ({
                ...post,
                pageIndex,
                postIndex: regularPosts.indexOf(post),
                isReelsSection: false
            }));

            // Only add reels section if this page has reels
            if (reelsByPage[pageIndex]?.length > 0) {
                result.push({
                    _id: `reels-section-${pageIndex}`,
                    isReelsSection: true,
                    reels: reelsByPage[pageIndex],
                    pageIndex
                });
            }

            return result;
        });
    }, [data]);

    const [width, setWidth] = useState(window.innerWidth)

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth)
        })
    }, [])

    // Render individual item (post or reels section)
    const renderItem = useCallback((item, index) => {
        // Render reels section
        if (item.isReelsSection) {
            return (
                <ReelsSuggestionSection
                    key={item._id}
                    reels={item.reels}
                    navigateToReels={navigateToReels}
                />
            );
        }

        // Render regular post
        const isSecondLastItem = index === flattenedData.length - 2;
        const isThirdLastItem = index === flattenedData.length - 3;

        // Trigger fetch on 3rd last item, or 2nd last if there are only 2 items, or last if there's only 1 item
        const shouldAddRef = (
            (flattenedData.length >= 3 && isThirdLastItem) ||
            (flattenedData.length === 2 && isSecondLastItem)
        );

        return (
            <Post
                useLikePost={useLikeFeedPost}
                useBookmarkPost={useBookmarkFeedPost}
                pageIndex={item.pageIndex}
                postIndex={item.postIndex}
                postData={item}
                userId={user?._id}
                username={user?.username}
                profile={user?.profile}
                key={item._id}
                type="user"
                scrollRef={shouldAddRef ? ref : null}
                fetchNextPage={shouldAddRef ? fetchNextPage : null}
            />
        );
    }, [flattenedData, navigateToReels, user, ref, fetchNextPage]);

    const updatePosts = async () => {
        const { data } = await axiosClient.get('/posts/posts/update')
        alert(JSON.stringify(data))
    }

    useEffect(() => {
        updatePosts()
    }, [])

    return (
        <div className='w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted md:px-6 lg:px-24'>
            {openPostStackModal && (
                <CreatePostStack
                    handlePostClick={() => {
                        setOpenPostStackModal(false)
                        navigate("?createpost=true")
                    }}
                    handleReelClick={() => {
                        // This is no longer needed, but keeping for compatibility
                        setOpenPostStackModal(false)
                        navigate("?createpost=true")
                    }}
                    isOpen={openPostStackModal}
                    onClose={() => setOpenPostStackModal(false)}
                />
            )}

            {/* Updated to pass both createPost and createReel functions */}
            {searchParams.get("createpost") && (width < 540) ? (
                <BottomCreatePost
                    setModelTrigger={setPostModal}
                    createPost={_createPost}
                    createReel={_createReel}
                />
            ) : searchParams.get("createpost") && (
                <CPostModal
                    setModelTrigger={setPostModal}
                    createPost={_createPost}
                    createReel={_createReel}
                />
            )}

            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='w-full flex items-center border border-muted bg-card'>
                    <Stories />
                </div>

                <div className='max-w-xl w-full flex flex-col gap-2 relative'>
                    <div className='w-full flex items-center justify-center h-fit border border-muted p-3 bg-card'>
                        <div className="w-full flex-1">
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                            }}>
                                <div className="relative flex gap-2">
                                    <div className='w-12'>
                                        <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                            <Link to="/profile">
                                                <Avatar>
                                                    <AvatarImage src={user?.profile} alt="Avatar" />
                                                    <AvatarFallback>{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                        </div>
                                    </div>
                                    <div
                                        className="max-w-2xl w-full rounded-md p-2 cursor-pointer flex items-center appearance-none bg-background border border-accent shadow-none"
                                        onClick={() => {
                                            setOpenPostStackModal(true)
                                        }}
                                    >
                                        <span className='text-sm'>What's in your mind</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className='flex w-full items-center flex-col gap-2'>
                        {isLoading &&
                            <ScreenLoader />
                        }
                        {!isLoading && flattenedData.length > 0 ?
                            flattenedData.map((item, index) => renderItem(item, index))
                            :
                            !isLoading && (
                                <div className='flex flex-col w-full gap-8 relative top-[60%] items-center justify-center'>
                                    <svg className='w-[60%] h-[50%]' viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="M777.431 522H385.569C374.055 522 365 513.427 365 503.191V276.809c0-10.236 9.055-18.809 20.569-18.809h391.862c11.514 0 20.569 8.572 20.569 18.809v226.382c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" /><path d="M798 268.775H365v-6.206c0-11.358 9.211-20.569 20.569-20.569h391.862c11.358 0 20.569 9.211 20.569 20.569v6.206z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" /><path d="M385.61 261.224a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm20.195 0a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" /><path d="M649.431 431H257.569C246.055 431 237 422.427 237 412.191V185.809c0-10.236 9.055-18.809 20.569-18.809h391.862c11.514 0 20.569 8.572 20.569 18.809v226.382c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" /><path d="M670 185.775H237v-6.206c0-11.358 9.211-20.569 20.569-20.569h391.862c11.358 0 20.569 9.211 20.569 20.569v6.206z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" /><path d="M257.61 178.224a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm20.195 0a4.847 4.847 0 1 0-.001-9.693 4.847 4.847 0 0 0 .001 9.693zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" /><path d="M513.431 343H121.569C110.055 343 101 334.427 101 324.191V97.809C101 87.573 110.055 79 121.569 79h391.862C524.945 79 534 87.573 534 97.809V324.19c0 10.236-9.055 18.809-20.569 18.809z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" /><path d="M534 105.775H101v-6.206C101 88.21 110.211 79 121.569 79h391.862C524.789 79 534 88.21 534 99.569v6.206z" fill="#fff" stroke="#E1E4E5" strokeWidth="4" /><path d="M121.61 98.224a4.847 4.847 0 1 0-.001-9.694 4.847 4.847 0 0 0 .001 9.694zm20.195 0a4.847 4.847 0 1 0-.001-9.694 4.847 4.847 0 0 0 .001 9.694zm19.387 0a4.847 4.847 0 1 0 0-9.694 4.847 4.847 0 0 0 0 9.694z" fill="#E1E4E5" /><path d="M257.569 431c-1.918 0-3.77-.248-5.526-.709l-.509 1.934a23.15 23.15 0 0 1-4.735-1.818l.918-1.777c-3.362-1.738-6.146-4.332-8.031-7.456l-1.713 1.034a20.744 20.744 0 0 1-2.073-4.627l1.912-.587a18.443 18.443 0 0 1-.812-5.424v-5.877h-2v-4.898h2V389.04h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.754h-2v-4.898h2V272.47h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-11.755h-2v-4.898h2v-5.877c0-1.885.284-3.704.812-5.424l-1.912-.587a20.744 20.744 0 0 1 2.073-4.627l1.713 1.034c1.885-3.124 4.669-5.718 8.031-7.456l-.918-1.777a23.15 23.15 0 0 1 4.735-1.818l.509 1.934a21.737 21.737 0 0 1 5.526-.709h6.013v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.012v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h12.027v-2h5.011v2h12.026v-2h5.011v2h6.013c1.918 0 3.77.248 5.526.709l.509-1.934a23.15 23.15 0 0 1 4.735 1.818l-.918 1.777c3.362 1.738 6.146 4.332 8.031 7.456l1.713-1.034a20.744 20.744 0 0 1 2.073 4.627l-1.912.587c.528 1.72.812 3.539.812 5.424v5.877h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.754h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v11.755h2v4.898h-2v5.877c0 1.885-.284 3.704-.812 5.424l1.912.587a20.744 20.744 0 0 1-2.073 4.627l-1.713-1.034c-1.885 3.124-4.669 5.718-8.031 7.456l.918 1.777a23.15 23.15 0 0 1-4.735 1.818l-.509-1.934a21.737 21.737 0 0 1-5.526.709h-6.013v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.012v-2h-12.026v2h-5.011v-2H353.78v2h-5.011v-2h-12.026v2h-5.011v-2h-12.027v2h-5.011v-2h-12.026v2h-5.011v-2H285.63v2h-5.011v-2h-12.026v2h-5.011v-2h-6.013z" stroke="#E1E4E5" strokeWidth="4" strokeDasharray="12 5" /><path fillRule="evenodd" clipRule="evenodd" d="M337 289.704c0 31.055 16.436 58.395 41.657 75.629-.011 9.897.012 23.231.012 37.225l40.87-20.221a114.597 114.597 0 0 0 21.633 2.071c57.318 0 104.173-42.166 104.173-94.704 0-52.537-46.855-94.704-104.173-94.704C383.854 195 337 237.167 337 289.704z" fill="#666AF6" stroke="#666AF6" strokeWidth="12.5" strokeLinecap="round" strokeLinejoin="round" /><path fillRule="evenodd" clipRule="evenodd" d="m433.223 259.957 36.981 21.876c5.324 3.149 5.324 10.857 0 14.017l-36.981 21.877c-5.429 3.206-12.281-.707-12.281-7.003v-43.753c0-6.319 6.852-10.232 12.281-7.014z" fill="#fff" /></svg>
                                    <span className='text-center'>Welcome! It looks like there are no posts here yet. Stay tuned as our community grows—new posts will be shared soon.</span>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeedSection