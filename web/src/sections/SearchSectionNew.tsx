import { axiosClient } from '@/api/axiosClient'
import { loginSuccess } from '@/app/features/user/authSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { domain } from '@/config/domain'
import { useBookmarkSearchPost, useLikeSearchPost } from '@/hooks/Post/usePost'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import NoSearchResult from './NoSearchResult'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import HashtagResult from './HashtagResult'
import TrendingHashtags from './TrendingHashtags'

const ITEMS_PER_PAGE = 10

function SearchSection() {
    const [searchParams, setSearchParams] = useSearchParams()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { user } = useAppSelector(state => state.user)

    // Get search parameters
    const params = Object.fromEntries(searchParams.entries())
    const [type, setType] = useState(params.type || 'all')
    const [groupAction, setGroupAction] = useState('')
    const searchQuery = params.query || ''

    // Create refs for intersection observer
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.5,
        triggerOnce: false,
    })

    // Fetch search results with infinite query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: ['search', searchQuery, type],
        queryFn: async ({ pageParam = 0 }) => {
            const { data } = await axiosClient.get(`/search?query=${searchQuery}&type=${type}&limit=${ITEMS_PER_PAGE}&skip=${pageParam * ITEMS_PER_PAGE}`)
            console.log(data, 'result')
            return data
        },
        initialPageParam: null,
        getNextPageParam: (lastPage, pages) => {
            // If any of the result arrays have items equal to the limit, we assume there are more pages
            const hasMoreItems = Object.values(lastPage).some(arr =>
                Array.isArray(arr) && arr.length === ITEMS_PER_PAGE
            )
            return hasMoreItems ? pages.length : undefined
        },
        enabled: !!searchQuery,
        refetchOnWindowFocus: false,
    })

    // Fetch trending hashtags when on hashtags tab with no search query
    const { data: trendingHashtags, isLoading: trendingLoading } = useQuery({
        queryKey: ['trending-hashtags'],
        queryFn: async () => {
            const { data } = await axiosClient.get('/search/trending-hashtags?limit=10')
            return data
        },
        enabled: type === 'hashtags' && !searchQuery.trim(),
        refetchOnWindowFocus: false,
    })

    // Flatten the results from all pages
    const allUsers = data ? data.pages.flatMap(page => page.users || []) : []
    const allPosts = data ? data.pages.flatMap(page => page.posts || []) : []
    const allGroups = data ? data.pages.flatMap(page => page.groups || []) : []
    const allPages = data ? data.pages.flatMap(page => page.pages || []) : []
    const allHashtags = data ? data.pages.flatMap(page => page.hashtags || []) : []

    // Load more when second-to-last item is in view
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage])

    // Update type in search params
    const updateType = (newType) => {
        searchParams.set('type', newType)
        setSearchParams(searchParams)
        setType(newType)
    }

    // Handle hashtag press
    const handleHashtagPress = useCallback((hashtag) => {
        navigate(`/hashtags-feed/${hashtag}`)
    }, [navigate])

    // Join group handler
    const joinGroup = async (groupId) => {
        try {
            const { data } = await axiosClient.post("/groups/join", { groupDetails: { groupId } })
            if (data.success) {
                setGroupAction("join")
            }
        } catch (error) {
            console.error("Error joining group:", error)
        }
    }

    // Follow page handler
    const followPage = async (pageId) => {
        try {
            const { data } = await axiosClient.post("/page/follow", { pageDetails: { pageId } })
            if (data.success) {
                // You could update local state or refetch data here
            }
        } catch (error) {
            console.error("Error following page:", error)
        }
    }

    // Accept friend request handler
    const acceptFriendRequest = async (username) => {
        try {
            const { data } = await axiosClient.post("user/acceptrequest", {
                requestDetails: { username }
            })
            if (data.success) {
                dispatch(loginSuccess(data.user))
            }
        } catch (error) {
            console.error("Error accepting friend request:", error)
        }
    }

    // Send friend request handler
    const sendFriendRequest = async (username) => {
        try {
            const { data } = await axiosClient.post("/user/friendrequest", {
                friendRequestDetails: { username }
            })
            if (data.success) {
                dispatch(loginSuccess(data.user))
            }
        } catch (error) {
            console.error("Error sending friend request:", error)
        }
    }

    // Render user card
    const renderUserCard = (userData, showActions = true) => (
        <Link to={`${domain}/user/${userData?.username}`} key={userData?._id}>
            <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                <div className='flex gap-2'>
                    <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                        <Avatar>
                            <AvatarImage src={userData?.profile} alt="Avatar" />
                            <AvatarFallback className='text-2xl'>
                                {userData?.firstname?.[0]?.toUpperCase() + userData?.lastname?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className=''>{userData?.firstname + " " + userData?.lastname}</div>
                        <div className='text-gray-400 text-sm'>@{userData?.username}</div>
                    </div>
                </div>
            </div>
        </Link>
    )

    // Render group card
    const renderGroupCard = (group) => (
        <Link to={`${domain}/group/${group?.handle}`} key={group?._id}>
            <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                <div className='flex gap-2'>
                    <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                        <Avatar>
                            <AvatarImage src={group?.profile} alt="Avatar" />
                            <AvatarFallback className='text-2xl'>
                                {group?.name?.[0]?.toUpperCase() + (group?.name?.[1]?.toUpperCase() || '')}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className=''>{group?.name}</div>
                        <div className='text-gray-400 text-sm'>@{group?.handle}</div>
                    </div>
                </div>
            </div>
        </Link>
    )

    // Render page card
    const renderPageCard = (page) => (
        <Link to={`${domain}/page/${page?.handle}`} key={page?._id}>
            <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                <div className='flex gap-2'>
                    <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                        <Avatar>
                            <AvatarImage src={page?.profile} alt="Avatar" />
                            <AvatarFallback className='text-2xl'>
                                {page?.name?.[0]?.toUpperCase() + (page?.name?.[1]?.toUpperCase() || '')}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className=''>{page?.name}</div>
                        <div className='text-gray-400 text-sm'>@{page?.handle}</div>
                    </div>
                </div>
            </div>
        </Link>
    )

    // Render post
    const renderPost = (post, index) => (
        <Post
            key={post._id}
            postData={post}
            useLikePost={useLikeSearchPost}
            postIndex={index}
            useBookmarkPost={useBookmarkSearchPost}
            query={searchQuery}
            isSearch={true}
            userId={user?._id}
            username={user?.username}
            profile={user?.profile}
        />
    )

    // Render hashtag content
    const renderHashtagContent = () => {
        // Show trending hashtags when no search query
        if (!searchQuery.trim()) {
            if (trendingLoading) {
                return <ScreenLoader />
            }
            return (
                <div className='w-full flex flex-col gap-2'>
                    <TrendingHashtags onHashtagPress={handleHashtagPress} />
                </div>
            )
        }

        // Show hashtag search results
        if (isLoading) {
            return <ScreenLoader />
        }

        if (allHashtags.length === 0) {
            return <NoSearchResult content={`No hashtags found for "${searchQuery}"`} />
        }

        return (
            <div className='w-full flex flex-col gap-2'>
                <div className='font-medium text-lg'>Hashtags</div>
                {allHashtags.map((hashtag, index) => {
                    // Add ref to second-to-last item for infinite loading
                    if (index === allHashtags.length - 2) {
                        return (
                            <div ref={loadMoreRef} key={hashtag._id}>
                                <HashtagResult
                                    hashtag={hashtag}
                                    onPress={handleHashtagPress}
                                />
                            </div>
                        )
                    }
                    return (
                        <HashtagResult
                            key={hashtag._id}
                            hashtag={hashtag}
                            onPress={handleHashtagPress}
                        />
                    )
                })}
                {isFetchingNextPage && <div className="w-full text-center py-4">Loading more...</div>}
            </div>
        )
    }

    // Render content based on type
    const renderContent = () => {
        // Special handling for hashtags
        if (type === 'hashtags') {
            return renderHashtagContent()
        }

        if (isLoading) return <ScreenLoader />
        if (isError) return <NoSearchResult content="An error occurred" />

        if (type === 'all') {
            if (allUsers.length === 0 && allGroups.length === 0 && allPages.length === 0 && allPosts.length === 0 && allHashtags.length === 0) {
                return <NoSearchResult content='No results found' />
            }

            return (
                <>
                    {/* Users section */}
                    {allUsers.length > 0 && (
                        <div className='w-full flex flex-col gap-2 mb-4'>
                            <div className='font-medium text-lg'>Users</div>
                            {allUsers.slice(0, 3).map(user => renderUserCard(user))}
                            {allUsers.length > 3 && (
                                <div className='w-full text-center mt-2'>
                                    <Button
                                        className='bg-card hover:bg-card/90 text-foreground'
                                        onClick={() => updateType("users")}
                                    >
                                        Show more users
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Groups section */}
                    {allGroups.length > 0 && (
                        <div className='w-full flex flex-col gap-2 mb-4'>
                            <div className='font-medium text-lg'>Groups</div>
                            {allGroups.slice(0, 3).map(group => renderGroupCard(group))}
                            {allGroups.length > 3 && (
                                <div className='w-full text-center mt-2'>
                                    <Button
                                        className='bg-card hover:bg-card/90 text-foreground'
                                        onClick={() => updateType("groups")}
                                    >
                                        Show more groups
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pages section */}
                    {allPages.length > 0 && (
                        <div className='w-full flex flex-col gap-2 mb-4'>
                            <div className='font-medium text-lg'>Pages</div>
                            {allPages.slice(0, 3).map(page => renderPageCard(page))}
                            {allPages.length > 3 && (
                                <div className='w-full text-center mt-2'>
                                    <Button
                                        className='bg-card hover:bg-card/90 text-foreground'
                                        onClick={() => updateType("pages")}
                                    >
                                        Show more pages
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hashtags section */}
                    {allHashtags.length > 0 && (
                        <div className='w-full flex flex-col gap-2 mb-4'>
                            <div className='font-medium text-lg'>Hashtags</div>
                            {allHashtags.slice(0, 3).map(hashtag => (
                                <HashtagResult
                                    key={hashtag._id}
                                    hashtag={hashtag}
                                    onPress={handleHashtagPress}
                                />
                            ))}
                            {allHashtags.length > 3 && (
                                <div className='w-full text-center mt-2'>
                                    <Button
                                        className='bg-card hover:bg-card/90 text-foreground'
                                        onClick={() => updateType("hashtags")}
                                    >
                                        Show more hashtags
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )
        }

        // User-specific view
        if (type === 'users') {
            return allUsers.length > 0 ? (
                <div className='w-full flex flex-col gap-2'>
                    <div className='font-medium text-lg'>Users</div>
                    {allUsers.map((user, index) => {
                        // Add ref to second-to-last item for infinite loading
                        if (index === allUsers.length - 2) {
                            return <div ref={loadMoreRef} key={user._id}>{renderUserCard(user)}</div>
                        }
                        return renderUserCard(user)
                    })}
                    {isFetchingNextPage && <div className="w-full text-center py-4">Loading more...</div>}
                </div>
            ) : <NoSearchResult content='No users found' />
        }

        // Posts-specific view
        if (type === 'posts') {
            return allPosts.length > 0 ? (
                <div className='w-full flex flex-col gap-2'>
                    <div className='font-medium text-lg'>Posts</div>
                    {allPosts.map((post, index) => {
                        // Add ref to second-to-last item for infinite loading
                        if (index === allPosts.length - 2) {
                            return <div ref={loadMoreRef} key={post._id}>{renderPost(post, index)}</div>
                        }
                        return renderPost(post, index)
                    })}
                    {isFetchingNextPage && <div className="w-full text-center py-4">Loading more...</div>}
                </div>
            ) : <NoSearchResult content='No posts found' />
        }

        // Pages-specific view
        if (type === 'pages') {
            return allPages.length > 0 ? (
                <div className='w-full flex flex-col gap-2'>
                    <div className='font-medium text-lg'>Pages</div>
                    {allPages.map((page, index) => {
                        // Add ref to second-to-last item for infinite loading
                        if (index === allPages.length - 2) {
                            return <div ref={loadMoreRef} key={page._id}>{renderPageCard(page)}</div>
                        }
                        return renderPageCard(page)
                    })}
                    {isFetchingNextPage && <div className="w-full text-center py-4">Loading more...</div>}
                </div>
            ) : <NoSearchResult content='No pages found' />
        }

        // Groups-specific view
        if (type === 'groups') {
            return allGroups.length > 0 ? (
                <div className='w-full flex flex-col gap-2'>
                    <div className='font-medium text-lg'>Groups</div>
                    {allGroups.map((group, index) => {
                        // Add ref to second-to-last item for infinite loading
                        if (index === allGroups.length - 2) {
                            return <div ref={loadMoreRef} key={group._id}>{renderGroupCard(group)}</div>
                        }
                        return renderGroupCard(group)
                    })}
                    {isFetchingNextPage && <div className="w-full text-center py-4">Loading more...</div>}
                </div>
            ) : <NoSearchResult content='No groups found' />
        }

        return <NoSearchResult content='No results found' />
    }

    return (
        <div className='w-full flex px-2 sm:px-14 overflow-hidden overflow-y-auto'>
            <div className='max-w-xl w-full flex flex-col gap-2'>
                {/* Search filters */}
                <div className='flex w-full gap-3 flex-wrap items-center border border-muted p-2 bg-card rounded-md'>
                    <Button
                        className={`${type === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                        onClick={() => updateType("all")}
                    >
                        All
                    </Button>
                    <Button
                        className={`${type === 'users' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                        onClick={() => updateType("users")}
                    >
                        Users
                    </Button>
                    <Button
                        className={`${type === 'pages' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                        onClick={() => updateType("pages")}
                    >
                        Pages
                    </Button>
                    <Button
                        className={`${type === 'groups' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                        onClick={() => updateType("groups")}
                    >
                        Groups
                    </Button>
                    <Button
                        className={`${type === 'hashtags' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                        onClick={() => updateType("hashtags")}
                    >
                        Hashtags
                    </Button>
                </div>

                {/* Search results */}
                <div className='flex w-full items-center flex-col'>
                    <div className='relative w-full flex justify-center overflow-y-auto'>
                        <div className='w-full flex flex-col gap-2'>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchSection