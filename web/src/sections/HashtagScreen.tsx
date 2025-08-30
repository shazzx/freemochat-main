import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import CreatePostStack from '@/components/Post/CreatePostStack'
import ReelsSuggestionSection from '@/components/Reel/ReelsSuggetion'
import ScreenLoader from '@/components/ScreenLoader'
import { useBookmarkHashtagsFeedPost, useCreatePost, useHashtagsFeed, useLikeHashtagsFeedPost, useHashtag } from '@/hooks/Post/usePost'
import { useCreateReel } from '@/hooks/Reels/useReels'
import BottomCreatePost from '@/models/BottomCreatePost'
import CPostModal from '@/models/CPostModal'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { useInView } from 'react-intersection-observer'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { ArrowLeft, Hash, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HashtagHeader = ({ isLoading, hashtag, onBack }) => (
  <div className="flex items-center px-4 py-3 bg-card sticky top-0 z-10">
    {/* <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="mr-3 p-2 hover:bg-gray-100 rounded-full"
    >
      <ArrowLeft size={20} />
    </Button> */}
    
    {isLoading ? (
      <div className="flex items-center">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span className="text-sm text-foreground">Loading...</span>
      </div>
    ) : (
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Hash size={20} className="text-foreground" />
          <h1 className="text-xl font-bold text-foreground">
            {hashtag?.name}
          </h1>
        </div>
        <p className="text-sm text-foreground mt-1">
          {hashtag?.usageCount?.toLocaleString()} {hashtag?.usageCount === 1 ? 'post' : 'posts'}
        </p>
      </div>
    )}
  </div>
);

function HashtagFeedSection() {
    const [searchParams] = useSearchParams()
    const { hashtag: hashtagParam } = useParams()
    const [postModal, setPostModal] = useState(false)
    const [feed, setFeed] = useState([])
    const { user } = useAppSelector((data) => data.user)
    const { inView, ref } = useInView()
    const [openPostStackModal, setOpenPostStackModal] = useState(false)

    const hashtag = hashtagParam || '';

    
    const reelsCursorRef = useRef(null);
    const [reelsCursor, setReelsCursor] = useState(null);

    useEffect(() => {
        reelsCursorRef.current = reelsCursor;
    }, [reelsCursor]);

    const { data, isLoading, fetchNextPage } = useHashtagsFeed(hashtag)
    const { data: hashtagData, isLoading: hashtagDataIsLoading } = useHashtag(hashtag)

    const createPost = useCreatePost("userPosts", user?._id)
    const createReel = useCreateReel()

    const _createPost = async ({ visibility, content, selectedMedia, backgroundColor, mentions, mentionReferences, formData }) => {
        let postDetails = { content, type: "user", postType: 'post', backgroundColor, mentions, hashtags: [hashtag], targetId: user?._id, visibility }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, mentions, mentionReferences, backgroundColor, postType: 'post', type: "user", target: user })
        setPostModal(false)
    }

    const _createReel = async ({ visibility, content, formData }) => {
        let reelDetails = { content, type: "user", postType: 'reel', hashtags: [hashtag], targetId: user?._id, visibility }
        formData.append("reelData", JSON.stringify(reelDetails))
        createReel.mutate(formData)
        setPostModal(false)
    }

    const navigate = useNavigate()

    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    
    const navigateToReels = useCallback((reel) => {
        
        navigate(`/reels/${reel._id}`, {
            state: {
                sourceMode: 'hashtag-feed',
                initialReelId: reel._id,
                reelData: reel
            }
        });
    }, [navigate]);

    
    const flattenedData = useMemo(() => {
        if (!data || !data.length) return [];

        
        const reelsByPage = {};

        return data.flatMap((page, pageIndex) => {
            
            const regularPosts = page.posts || [];
            const reelsSuggestions = page.reels || [];

            
            if (reelsSuggestions.length > 0) {
                reelsByPage[pageIndex] = reelsSuggestions;

                
                if (pageIndex === data.length - 1) {
                    const lastReel = reelsSuggestions[reelsSuggestions.length - 1];
                    setReelsCursor(lastReel.createdAt);
                }
            }

            
            const result = regularPosts.map((post, postIndex) => ({
                ...post,
                pageIndex,
                postIndex,
                isReelsSection: false
            }));

            
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

    
    const renderItem = useCallback((item, index) => {
        
        if (item.isReelsSection) {
            return (
                <ReelsSuggestionSection
                    key={item._id}
                    reels={item.reels}
                    navigateToReels={navigateToReels}
                />
            );
        }

        
        const isSecondLastItem = index === flattenedData.length - 2;
        const isThirdLastItem = index === flattenedData.length - 3;

        
        const shouldAddRef = (
            (flattenedData.length >= 3 && isThirdLastItem) ||
            (flattenedData.length === 2 && isSecondLastItem)
        );

        return (
            <Post
                useLikePost={() => useLikeHashtagsFeedPost(hashtag)}
                useBookmarkPost={() => useBookmarkHashtagsFeedPost(hashtag)}
                pageIndex={item.pageIndex}
                postIndex={item.postIndex}
                postData={item}
                userId={user?._id}
                username={user?.username}
                profile={user?.profile}
                key={item._id}
                type="hashtags-feed"
                isSearch={true}
                query={{ hashtag, postId: item._id }}
                scrollRef={shouldAddRef ? ref : null}
                fetchNextPage={shouldAddRef ? fetchNextPage : null}
            />
        );
    }, [flattenedData, navigateToReels, user, ref, fetchNextPage, hashtag]);

    return (
        <div className='w-full z-10 flex justify-center md:justify-normal overflow-y-auto border-muted md:px-6 lg:px-24'>
            {openPostStackModal && (
                <CreatePostStack
                    handlePostClick={() => {
                        setOpenPostStackModal(false)
                        navigate(`?createpost=true`)
                    }}
                    handleReelClick={() => {
                        setOpenPostStackModal(false)
                        navigate(`?createpost=true`)
                    }}
                    isOpen={openPostStackModal}
                    onClose={() => setOpenPostStackModal(false)}
                />
            )}

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
                <div className='w-full border border-muted bg-card'>
                    <HashtagHeader
                        isLoading={hashtagDataIsLoading}
                        hashtag={hashtagData}
                        onBack={handleBack}
                    />
                </div>

                <div className='max-w-xl w-full flex flex-col gap-2 relative'>
                    <div className='flex w-full items-center flex-col gap-2'>
                        {isLoading &&
                            <ScreenLoader />
                        }
                        {!isLoading && flattenedData.length > 0 ?
                            flattenedData.map((item, index) => renderItem(item, index))
                            :
                            !isLoading && (
                                <div className='flex flex-col w-full gap-8 relative top-[60%] items-center justify-center py-12'>
                                    <div className="text-center text-gray-500">
                                        <Hash className="mx-auto mb-4 opacity-50" size={48} />
                                        <h3 className="text-lg font-medium mb-2">No posts found for #{hashtag}</h3>
                                        <p className="text-sm">Posts with this hashtag will appear here</p>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HashtagFeedSection