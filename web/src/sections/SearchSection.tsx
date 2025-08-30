import { axiosClient } from '@/api/axiosClient'
import { loginSuccess } from '@/app/features/user/authSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { domain } from '@/config/domain'
import { useBookmarkSearchPost, useLikeSearchPost, useSearch } from '@/hooks/Post/usePost'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import NoSearchResult from './NoSearchResult'
import HashtagResult from './HashtagResult'
import TrendingHashtags from './TrendingHashtags'

function SearchSection() {
    const [searchParams, setSearchParams] = useSearchParams()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [posts, setPosts] = useState([])
    const [groups, setGroups] = useState([])
    const [pages, setPages] = useState([])
    const [users, setUsers] = useState([])
    const [hashtags, setHashtags] = useState([])
    const { user } = useAppSelector(state => state.user)
    let params = Object.fromEntries(searchParams.entries())
    const [type, setType] = useState(params.type)
    const [isFetched, setIsFetched] = useState(false)
    const [groupAction, setGroupAction] = useState('')
    const paramsRef = useRef(params.query)
    const typeRef = useRef(null)
    const keyRef = useRef("default")

    const { data, isLoading } = useSearch(typeRef, paramsRef, keyRef)

    const _setType = (type) => {
        searchParams.set('type', type)
        setSearchParams(searchParams)
        setType(type)
    }

    useEffect(() => {
        typeRef.current = type
        paramsRef.current = params.query
        keyRef.current = type
    }, [searchParams])

    useEffect(() => {
        if (data?.users) {
            setUsers(data?.users)
        }
        if (data?.posts) {
            setPosts(data.posts)
        }
        if (data?.groups) {
            setGroups(data?.groups)
        }
        if (data?.pages) {
            setPages(data?.pages)
        }
        if (data?.hashtags) {
            setHashtags(data?.hashtags)
        }
        setIsFetched(true)
    }, [data])

    const joinGroup = async (groupId) => {
        const { data } = await axiosClient.post("/groups/join", { groupDetails: { groupId } })
        console.log(data)
    }

    const followPage = async (pageId) => {
        const { data } = await axiosClient.post("/page/follow", { pageDetails: { pageId } })
        console.log(data)
    }

    const handleHashtagPress = useCallback((hashtag) => {
        navigate(`/hashtags-feed/${hashtag}`)
    }, [navigate])

    
    const renderTrendingHashtags = () => {
        if (params.query?.trim() || type !== 'hashtags') return null;
        return <TrendingHashtags onHashtagPress={handleHashtagPress} />;
    };

    
    const renderHashtagResults = () => {
        if (type !== 'hashtags' || !params.query?.trim()) return null;

        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <ScreenLoader />
                </div>
            );
        }

        if (hashtags.length === 0) {
            return <NoSearchResult content={`No hashtags found for "${params.query}"`} />;
        }

        return (
            <div className='w-full flex flex-col gap-2'>
                <div>Hashtags</div>
                {hashtags.map((hashtag) => (
                    <HashtagResult
                        key={hashtag._id}
                        hashtag={hashtag}
                        onPress={handleHashtagPress}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className='w-full flex px-2 sm:px-14 overflow-hidden overflow-y-auto border-muted'>
            <div className='max-w-xl w-full flex flex-col gap-2'>
                <div className='flex w-full gap-3 flex-wrap items-center border border-muted p-2 bg-card'>
                    <Button className={`${type == 'default' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("default")}>All</Button>
                    <Button className={`${type == 'users' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("users")}>People</Button>
                    <Button className={`${type == 'posts' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("posts")}>Posts</Button>
                    <Button className={`${type == 'pages' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("pages")}>Pages</Button>
                    <Button className={`${type == 'groups' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("groups")}>Groups</Button>
                    <Button className={`${type == 'hashtags' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("hashtags ")}>Hashtags</Button>
                </div>
                
                <div className='flex w-full items-center flex-col'>
                    {type === 'hashtags' ? (
                        <div className="w-full">
                            {renderTrendingHashtags()}
                            {renderHashtagResults()}
                        </div>
                    ) : (
                        <>
                            {isFetched ? (
                                <div className='relative w-full flex justify-center overflow-y-auto border-muted'>
                                    <div className='w-full flex flex-col gap-2'>
                                        <div className='flex w-full flex-col gap-2'>
                                            {type == 'default' && (
                                                <div className='w-full flex flex-col gap-2'>
                                                    {users?.length > 0 && <div>Users</div>}
                                                    {users?.length > 0 && users?.map((_user, i) => {
                                                        if (i >= 3) return null
                                                        return (
                                                            <Link key={_user._id} to={domain + "/user/" + _user?.username}>
                                                                <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                                    <div className='flex gap-2'>
                                                                        <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                                                                            <Avatar>
                                                                                <AvatarImage src={_user?.profile} alt="Avatar" />
                                                                                <AvatarFallback className='text-2xl'>{_user?.firstname[0]?.toUpperCase() + _user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                        <div className="flex flex-col justify-center">
                                                                            <div className=''>{_user?.firstname + " " + _user?.lastname}</div>
                                                                            <div className='text-gray-400 text-sm'>@{_user?.username}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className='flex gap-2'>
                                                                        {user?.friends?.includes(_user?._id) && <Button>Friends</Button>}
                                                                        {user?.username !== _user?.username && (
                                                                            <div>
                                                                                {user?.sentRequests?.includes(_user?._id) && (
                                                                                    <Button onClick={async () => {
                                                                                        await axiosClient.post("/user/friendrequest", { friendRequestDetails: { username: _user?.username } })
                                                                                    }}>Cancel</Button>
                                                                                )}
                                                                                {user?.recievedRequests?.includes(_user?._id) && (
                                                                                    <Button onClick={async () => {
                                                                                        const { data } = await axiosClient.post("user/acceptrequest", { requestDetails: { username: _user?.username } })
                                                                                        if (data.success) {
                                                                                            dispatch(loginSuccess(data.user))
                                                                                        }
                                                                                    }}>Accept</Button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        )
                                                    })}
                                                    {users.length > 0 && (
                                                        <div className='w-full text-center rounded-md' onClick={() => _setType("users")}>
                                                            <Button className='bg-card px-4 text-foreground'>Show more</Button>
                                                        </div>
                                                    )}

                                                    {groups.length > 0 && (
                                                        <div className='w-full flex flex-col gap-2'>
                                                            <div>Groups</div>
                                                            {groups.map((group, i) => {
                                                                if (i >= 3) return null
                                                                return (
                                                                    <Link key={group._id} to={domain + "/group/" + group?.handle}>
                                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                                            <div className='flex gap-2'>
                                                                                <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                                                                                    <Avatar>
                                                                                        <AvatarImage src={group?.profile} alt="Avatar" />
                                                                                        <AvatarFallback className='text-2xl'>{group?.name[0]?.toUpperCase() + group?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                                    </Avatar>
                                                                                </div>
                                                                                <div className="flex flex-col justify-center">
                                                                                    <div className=''>{group?.name}</div>
                                                                                    <div className='text-gray-400 text-sm'>@{group?.handle}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className='flex gap-2'>
                                                                                {!group?.admins?.includes(user?._id) && !group?.members?.includes(user?._id) ? (
                                                                                    <Button onClick={() => joinGroup(group?._id)}>Join</Button>
                                                                                ) : (
                                                                                    <Button>Member</Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </Link>
                                                                )
                                                            })}
                                                            {groups?.length > 4 && (
                                                                <div className='w-full text-center rounded-md' onClick={() => _setType("groups")}>
                                                                    <Button className='bg-card px-4'>Show more</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {pages.length > 0 && (
                                                        <div className='w-full flex flex-col gap-2'>
                                                            <div>Pages</div>
                                                            {pages.map((page, i) => {
                                                                if (i >= 3) return null
                                                                return (
                                                                    <Link key={page._id} to={domain + "/page/" + page?.handle}>
                                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                                            <div className='flex gap-2'>
                                                                                <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                                                                                    <Avatar>
                                                                                        <AvatarImage src={page?.profile} alt="Avatar" />
                                                                                        <AvatarFallback className='text-2xl'>{page?.name[0]?.toUpperCase() + page?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                                    </Avatar>
                                                                                </div>
                                                                                <div className="flex flex-col justify-center">
                                                                                    <div className=''>{page?.name}</div>
                                                                                    <div className='text-gray-400 text-sm'>@{page?.handle}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className='flex gap-2'>
                                                                                {page && !page.admins?.includes(user?._id) && (page?.followers?.includes(user?._id) ? (
                                                                                    <Button>Followed</Button>
                                                                                ) : (
                                                                                    <Button onClick={() => followPage(page?._id)}>Follow</Button>
                                                                                ))}
                                                                                {page && page.admins.includes(user?._id) && <Button>Admin</Button>}
                                                                            </div>
                                                                        </div>
                                                                    </Link>
                                                                )
                                                            })}
                                                            {pages.length > 0 && (
                                                                <div className='w-full text-center rounded-md' onClick={() => _setType("pages")}>
                                                                    <Button className='bg-card px-4'>Show more</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {hashtags.length > 0 && (
                                                        <div className='w-full flex flex-col gap-2'>
                                                            <div>Hashtags</div>
                                                            {hashtags.map((hashtag, i) => {
                                                                if (i >= 3) return null
                                                                return (
                                                                    <HashtagResult
                                                                        key={hashtag._id}
                                                                        hashtag={hashtag}
                                                                        onPress={handleHashtagPress}
                                                                    />
                                                                )
                                                            })}
                                                            {hashtags.length > 3 && (
                                                                <div className='w-full text-center rounded-md' onClick={() => _setType("hashtags")}>
                                                                    <Button className='bg-card px-4'>Show more</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {pages.length == 0 && users.length == 0 && groups.length == 0 && hashtags.length == 0 && (
                                                        <NoSearchResult content={'not found'} />
                                                    )}
                                                </div>
                                            )}

                                            {type == 'users' && users && (
                                                <div className='w-full flex flex-col gap-2'>
                                                    {users.length > 0 && <div>Users</div>}
                                                    {users?.length > 0 ? (
                                                        users.map((_user) => (
                                                            <Link key={_user._id} to={domain + "/user/" + _user?.username}>
                                                                <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                                    <div className='flex gap-2'>
                                                                        <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                                                                            <Avatar>
                                                                                <AvatarImage src={_user?.profile} alt="Avatar" />
                                                                                <AvatarFallback className='text-2xl'>{_user?.firstname[0]?.toUpperCase() + _user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                        <div className="flex flex-col justify-center">
                                                                            <div className=''>{_user?.firstname + " " + _user?.lastname}</div>
                                                                            <div className='text-gray-400 text-sm'>@{_user?.username}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        type == "users" && isFetched && <NoSearchResult content={'no users found'} />
                                                    )}
                                                </div>
                                            )}

                                            {type == 'posts' && data?.posts?.length > 0 ? (
                                                data?.posts.map((post, i) => (
                                                    <Post 
                                                        key={post._id}
                                                        postData={post} 
                                                        useLikePost={useLikeSearchPost} 
                                                        postIndex={i} 
                                                        useBookmarkPost={useBookmarkSearchPost} 
                                                        query={paramsRef.current} 
                                                        isSearch={true} 
                                                        userId={user?._id} 
                                                        username={user?.username} 
                                                        profile={user?.profile} 
                                                    />
                                                ))
                                            ) : (
                                                type == "posts" && <NoSearchResult content={'no posts found'} />
                                            )}

                                            {type == 'pages' && pages && !isLoading && (
                                                pages?.length > 0 ? (
                                                    <div className='w-full flex flex-col gap-2'>
                                                        <div>Pages</div>
                                                        {pages.map((page, i) => {
                                                            if (i >= 3) return null
                                                            return (
                                                                <Link key={page._id} to={domain + "/page/" + page?.handle}>
                                                                    <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                                        <div className='flex gap-2'>
                                                                            <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                                                                                <Avatar>
                                                                                    <AvatarImage src={page?.profile} alt="Avatar" />
                                                                                    <AvatarFallback className='text-2xl'>{page?.name[0]?.toUpperCase() + page?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                            </div>
                                                                            <div className="flex flex-col justify-center">
                                                                                <div className=''>{page?.name}</div>
                                                                                <div className='text-gray-400 text-sm'>@{page?.handle}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className='flex gap-2'>
                                                                            {page && !page.admins?.includes(user?._id) && (page?.followers?.includes(user?._id) ? (
                                                                                <Button>Followed</Button>
                                                                            ) : (
                                                                                <Button onClick={() => followPage(page?._id)}>Follow</Button>
                                                                            ))}
                                                                            {page && page.admins.includes(user?._id) && <Button>Admin</Button>}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    type == "pages" && !isLoading && <NoSearchResult content={'no pages found'} />
                                                )
                                            )}

                                            {type == 'groups' && groups && (
                                                <div className='w-full flex flex-col gap-2'>
                                                    {groups.length > 0 && <div>Groups</div>}
                                                    {groups?.length > 0 ? (
                                                        groups.map((group, i) => {
                                                            if (i >= 3) return null
                                                            return (
                                                                <Link key={group._id} to={domain + "/group/" + group?.handle}>
                                                                    <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                                        <div className='flex gap-2'>
                                                                            <div className='w-16 h-16 rounded-md flex items-center justify-center border-primary border-2 overflow-hidden'>
                                                                                <Avatar>
                                                                                    <AvatarImage src={group?.profile} alt="Avatar" />
                                                                                    <AvatarFallback className='text-2xl'>{group?.name[0]?.toUpperCase() + group?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                            </div>
                                                                            <div className="flex flex-col justify-center">
                                                                                <div className=''>{group?.name}</div>
                                                                                <div className='text-gray-400 text-sm'>@{group?.handle}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className='flex gap-2'>
                                                                            {groupAction == "" && !group?.admins?.includes(user?._id) && !group?.members?.includes(user?._id) ? (
                                                                                <Button onClick={() => {
                                                                                    joinGroup(group?._id)
                                                                                    setGroupAction("join")
                                                                                }}>Join</Button>
                                                                            ) : (
                                                                                <Button>Member</Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            )
                                                        })
                                                    ) : (
                                                        type == "groups" && !isLoading && <NoSearchResult content={'no groups found'} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <ScreenLoader />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SearchSection