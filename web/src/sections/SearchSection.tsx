import { axiosClient } from '@/api/axiosClient'
import { loginSuccess } from '@/app/features/user/authSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import ScreenLoader from '@/components/ScreenLoader'
import { Button } from '@/components/ui/button'
import { domain } from '@/config/domain'
import {  useBookmarkSearchPost,  useLikeSearchPost, useSearch } from '@/hooks/Post/usePost'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

function SearchSection() {
    const [searchParams, setSearchParams] = useSearchParams()
    const dispatch = useAppDispatch()
    const [posts, setPosts] = useState([])
    console.log(posts)
    const [groups, setGroups] = useState([])
    const [pages, setPages] = useState([])
    const [users, setUsers] = useState([])
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
            setIsFetched(true)

    }, [_setType])

    const joinGroup = async (groupId) => {
        const { data } = await axiosClient.post("/groups/join", { groupDetails: { groupId } })
        console.log(data)
    }

    const followPage = async (pageId) => {
        const { data } = await axiosClient.post("/page/follow", { pageDetails: { pageId } })
        console.log(data)
    }


    return (
        <div className='w-full flex px-2 sm:px-14 overflow-hidden overflow-y-auto border-muted'>
            <div className='max-w-xl w-full flex  flex-col gap-2'>
                <div className='flex w-full gap-3 flex-wrap items-center   border border-muted p-2 bg-card'>
                    <Button className={`${type == 'default' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("default")} >All</Button>
                    <Button className={`${type == 'users' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("users")} >People</Button>
                    <Button className={`${type == 'posts' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("posts")} >Posts</Button>
                    <Button className={`${type == 'pages' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("pages")}>Pages</Button>
                    <Button className={`${type == 'groups' ? 'bg-primary' : 'bg-button'}`} onClick={() => _setType("groups")}>Groups</Button>
                    {/* <Button className='bg-button'>
                        <ListFilter />

                    </Button> */}

                </div>
                <div className='flex w-full items-center flex-col '>
                    {isFetched ? <div className='relative w-full flex justify-center overflow-y-auto border-muted'>
                        <div className='w-full flex flex-col gap-2'>
                            <div className='flex w-full   flex-col gap-2  '>
                                {type == 'default' &&
                                    < div className='w-full flex flex-col gap-2'>
                                        {users?.length > 0 && <div>Users</div>}
                                        {users?.length > 0 ?

                                            users?.map((_user, i) => {
                                                console.log(_user)
                                                if (i >= 3) {
                                                    return null
                                                }
                                                return (
                                                    <Link to={domain + "/user/" + _user?.username}>
                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                            <div className='flex gap-2'>
                                                                <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={_user?.images?.profile} alt="Avatar" />
                                                                        <AvatarFallback className='text-2xl'>{_user?.firstname[0]?.toUpperCase() + _user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                                <div className="flex flex-col justify-center">
                                                                    <div className=''>{_user?.firstname + " " + _user?.lastname}</div>
                                                                    <div className='text-gray-400 text-sm'>@{_user?.username}</div>
                                                                </div>

                                                            </div>
                                                            <div className='flex gap-2'>
                                                                {user?.friends?.includes(_user?._id) &&
                                                                    <Button>Friends</Button>
                                                                }
                                                                {
                                                                    user?.username !== _user?.username &&
                                                                    <div>


                                                                        {user?.sentRequests?.includes(_user?._id) &&

                                                                            <Button onClick={async () => {

                                                                                 await axiosClient.post("/user/friendrequest", { friendRequestDetails: { username: _user?.username } })
                                                                            }}>Cancel</Button>
                                                                        }
                                                                        {user?.recievedRequests?.includes(_user?._id) &&
                                                                            <Button onClick={async () => {
                                                                                const { data } = await axiosClient.post("user/acceptrequest", { requestDetails: { username: _user?.username } })
                                                                                if (data.success) {
                                                                                    dispatch(loginSuccess(data.user))
                                                                                }
                                                                            }}>Accept</Button>
                                                                        }
                                                                        {/* 
                                                                        {
                                                                            !user?.recievedRequests?.includes(_user?._id) && !user?.sentRequests?.includes(_user?._id) && !user?.friends?.includes(_user?._id) &&
                                                                            <Button onClick={async () => {
                                                                                const { data } = await axiosClient.post("/user/friendrequest", { friendRequestDetails: { username: _user?.username } })
                                                                                if (data.success) {
                                                                                    dispatch(loginSuccess(data.user))
                                                                                }
                                                                            }}>Add Friend</Button>
                                                                        } */}
                                                                    </div>

                                                                }
                                                            </div>
                                                        </div>
                                                    </Link>

                                                )
                                            }) :
                                            !isLoading &&
                                            < div className='flex items-center justify-center pt-32 flex-col gap-2'>

                                                <svg width="440" height="240" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><circle cx="451.426" cy="300" r="262.123" fill="url(#a)" /><path d="M708.475 240.202c-12.627 22.535-40.281 25.631-84.585 21.349-33.32-3.227-63.705-5.724-97.027-23.892-23.323-12.707-41.785-29.899-55.26-46.597-14.602-18.089-34.983-38.734-24.992-59.245 13.73-28.174 93.133-51.904 170.236-13.099 84.698 42.641 103.981 99.459 91.628 121.484z" fill="url(#b)" /><path d="M793.833 287.316c-23.788 11.8-55.36-3.373-55.36-3.373s7.016-34.297 30.817-46.081c23.787-11.8 55.347 3.356 55.347 3.356s-7.017 34.298-30.804 46.098z" fill="url(#c)" /><path d="M118.142 373.556c31.081 18.628 75.673 1.408 75.673 1.408s-5.831-47.416-36.931-66.023c-31.081-18.629-75.654-1.429-75.654-1.429s5.83 47.416 36.912 66.044z" fill="url(#d)" /><circle cx="747.028" cy="208.246" r="12.989" transform="rotate(180 747.028 208.246)" fill="#666AF6" /><circle cx="257.822" cy="281.817" r="14.612" transform="rotate(180 257.822 281.817)" fill="#666AF6" /><circle r="12.177" transform="matrix(-1 0 0 1 159.929 195.932)" fill="#666AF6" /><circle r="5.683" transform="matrix(-1 0 0 1 635.635 259.251)" fill="#666AF6" /><circle r="7.306" transform="matrix(-1 0 0 1 668.43 512.81)" fill="#E1E4E5" /><circle r="10.553" transform="matrix(-1 0 0 1 157.751 436.948)" fill="#E1E4E5" /><circle r="8.032" transform="matrix(-1 0 0 1 279.793 167.303)" fill="#E1E4E5" /><circle r="8.93" transform="matrix(-1 0 0 1 669.743 168.793)" fill="#E1E4E5" /><circle r="8.019" transform="scale(1 -1) rotate(-75 -85.053 -253.614)" fill="#E1E4E5" /><circle r="10.668" transform="matrix(-1 0 0 1 385.553 99.921)" fill="#E1E4E5" /><ellipse rx="8.206" ry="6.565" transform="matrix(-1 0 0 1 725.744 372.599)" fill="#E1E4E5" /><circle r="16.689" transform="scale(1 -1) rotate(-75 220.696 -421.766)" fill="#E1E4E5" /><path d="M787.973 327.261h.214c1.271 18.011 14.666 18.288 14.666 18.288s-14.77.288-14.77 21.1c0-20.812-14.771-21.1-14.771-21.1s13.389-.277 14.661-18.288zM248.445 502.359h.19c1.128 16.301 13.014 16.552 13.014 16.552s-13.106.261-13.106 19.096c0-18.835-13.106-19.096-13.106-19.096s11.88-.251 13.008-16.552z" fill="#E1E4E5" /><rect x="221.128" y="128.304" width="461.792" height="344.342" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M404.574 247.969v23.992m95.978-23.992v23.992m35.801 108.38s-31.442-30.145-83.879-30.145c-52.436 0-83.879 30.145-83.879 30.145" stroke="#666AF6" stroke-width="33.798" stroke-linecap="round" stroke-linejoin="round" /><rect x="221.128" y="128.304" width="461.792" height="40.04" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><rect x="237.144" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="261.168" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="285.191" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><defs><linearGradient id="a" x1="462.603" y1="856.045" x2="446.439" y2="-532.412" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="623.412" y1="386.251" x2="510.865" y2="-119.486" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="c" x1="702.485" y1="324.123" x2="898.687" y2="168.927" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="d" x1="238.418" y1="433.519" x2="-11.673" y2="201.151" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                                <span>No found</span>
                                            </div>
                                        }

                                        {users.length > 0 && < div className='w-full text-center rounded-md' onClick={() => _setType("users")}>

                                            <Button className='bg-card px-4'>
                                                Show more
                                            </Button>
                                        </div>}
                                    </div>
                                }

                                {type == 'default' && groups.length > 0 &&
                                    < div className='w-full flex flex-col gap-2'>
                                        <div>Groups</div>
                                        {groups?.length > 0 &&

                                            groups.map((group, i) => {
                                                if (i >= 3) {
                                                    return null
                                                }
                                                return (
                                                    <Link to={domain + "/group/" + group?.handle}>
                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                            <div className='flex gap-2'>
                                                                <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={group?.images?.profile} alt="Avatar" />
                                                                        <AvatarFallback className='text-2xl'>{group?.name[0]?.toUpperCase() + group?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                                <div className="flex flex-col justify-center">
                                                                    <div className=''>{group?.name}</div>
                                                                    <div className='text-gray-400 text-sm'>@{group?.handle}</div>
                                                                </div>

                                                            </div>
                                                            <div className='flex gap-2'>
                                                                {!group?.admins?.includes(user?._id) && !group?.members?.includes(user?._id) ? <Button onClick={() => {
                                                                    joinGroup(group?._id)
                                                                }}>Join</Button> : <Button>Member</Button>}
                                                            </div>
                                                        </div>
                                                    </Link>

                                                )
                                            })
                                            // : type == "default" && <div>no group found</div>
                                        }

                                        {groups?.length > 0 && <div className='w-full text-center rounded-md' onClick={() => _setType("groups")}>

                                            <Button className='bg-card px-4'>
                                                Show more
                                            </Button>
                                        </div>}
                                    </div>
                                }


                                {type == 'default' && pages.length > 0 &&
                                    < div className='w-full flex flex-col gap-2'>
                                        <div>Pages</div>
                                        {pages?.length > 0 &&

                                            pages.map((page, i) => {
                                                if (i >= 3) {
                                                    return null
                                                }
                                                return (
                                                    <Link to={domain + "/page/" + page?.handle}>
                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                            <div className='flex gap-2'>
                                                                <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={page?.images?.profile} alt="Avatar" />
                                                                        <AvatarFallback className='text-2xl'>{page?.name[0]?.toUpperCase() + page?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                                <div className="flex flex-col justify-center">
                                                                    <div className=''>{page?.name}</div>
                                                                    <div className='text-gray-400 text-sm'>@{page?.handle}</div>
                                                                </div>

                                                            </div>
                                                            <div className='flex gap-2'>
                                                                {page && !page.admins?.includes(user?._id) && (page?.followers?.includes(user?._id) ? <Button>Followed</Button> : <Button onClick={() => {
                                                                    followPage(page?._id)
                                                                }}>Follow</Button>)}
                                                                {page && page.admins.includes(user?._id) && <Button>Admin</Button>}

                                                            </div>
                                                        </div>
                                                    </Link>

                                                )
                                            })
                                        }
                                        {pages.length > 0 &&
                                            <div className='w-full text-center rounded-md' onClick={() => _setType("pages")}>

                                                <Button className='bg-card px-4'>
                                                    Show more
                                                </Button>
                                            </div>}
                                    </div>
                                }


                                {type == 'users' && users &&
                                    < div className='w-full flex flex-col gap-2'>
                                        {users.length > 0 && <div>Users</div>}
                                        {users?.length > 0 ?

                                            users.map((_user) => {
                                                return (
                                                    <Link to={domain + "/user/" + _user?.username}>
                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                            <div className='flex gap-2'>
                                                                <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={_user?.images?.profile} alt="Avatar" />
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

                                                )
                                            }) :

                                            type == "users" && isFetched &&
                                            < div className='flex items-center justify-center pt-32 flex-col gap-2'>

                                                <svg width="440" height="240" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><circle cx="451.426" cy="300" r="262.123" fill="url(#a)" /><path d="M708.475 240.202c-12.627 22.535-40.281 25.631-84.585 21.349-33.32-3.227-63.705-5.724-97.027-23.892-23.323-12.707-41.785-29.899-55.26-46.597-14.602-18.089-34.983-38.734-24.992-59.245 13.73-28.174 93.133-51.904 170.236-13.099 84.698 42.641 103.981 99.459 91.628 121.484z" fill="url(#b)" /><path d="M793.833 287.316c-23.788 11.8-55.36-3.373-55.36-3.373s7.016-34.297 30.817-46.081c23.787-11.8 55.347 3.356 55.347 3.356s-7.017 34.298-30.804 46.098z" fill="url(#c)" /><path d="M118.142 373.556c31.081 18.628 75.673 1.408 75.673 1.408s-5.831-47.416-36.931-66.023c-31.081-18.629-75.654-1.429-75.654-1.429s5.83 47.416 36.912 66.044z" fill="url(#d)" /><circle cx="747.028" cy="208.246" r="12.989" transform="rotate(180 747.028 208.246)" fill="#666AF6" /><circle cx="257.822" cy="281.817" r="14.612" transform="rotate(180 257.822 281.817)" fill="#666AF6" /><circle r="12.177" transform="matrix(-1 0 0 1 159.929 195.932)" fill="#666AF6" /><circle r="5.683" transform="matrix(-1 0 0 1 635.635 259.251)" fill="#666AF6" /><circle r="7.306" transform="matrix(-1 0 0 1 668.43 512.81)" fill="#E1E4E5" /><circle r="10.553" transform="matrix(-1 0 0 1 157.751 436.948)" fill="#E1E4E5" /><circle r="8.032" transform="matrix(-1 0 0 1 279.793 167.303)" fill="#E1E4E5" /><circle r="8.93" transform="matrix(-1 0 0 1 669.743 168.793)" fill="#E1E4E5" /><circle r="8.019" transform="scale(1 -1) rotate(-75 -85.053 -253.614)" fill="#E1E4E5" /><circle r="10.668" transform="matrix(-1 0 0 1 385.553 99.921)" fill="#E1E4E5" /><ellipse rx="8.206" ry="6.565" transform="matrix(-1 0 0 1 725.744 372.599)" fill="#E1E4E5" /><circle r="16.689" transform="scale(1 -1) rotate(-75 220.696 -421.766)" fill="#E1E4E5" /><path d="M787.973 327.261h.214c1.271 18.011 14.666 18.288 14.666 18.288s-14.77.288-14.77 21.1c0-20.812-14.771-21.1-14.771-21.1s13.389-.277 14.661-18.288zM248.445 502.359h.19c1.128 16.301 13.014 16.552 13.014 16.552s-13.106.261-13.106 19.096c0-18.835-13.106-19.096-13.106-19.096s11.88-.251 13.008-16.552z" fill="#E1E4E5" /><rect x="221.128" y="128.304" width="461.792" height="344.342" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M404.574 247.969v23.992m95.978-23.992v23.992m35.801 108.38s-31.442-30.145-83.879-30.145c-52.436 0-83.879 30.145-83.879 30.145" stroke="#666AF6" stroke-width="33.798" stroke-linecap="round" stroke-linejoin="round" /><rect x="221.128" y="128.304" width="461.792" height="40.04" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><rect x="237.144" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="261.168" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="285.191" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><defs><linearGradient id="a" x1="462.603" y1="856.045" x2="446.439" y2="-532.412" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="623.412" y1="386.251" x2="510.865" y2="-119.486" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="c" x1="702.485" y1="324.123" x2="898.687" y2="168.927" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="d" x1="238.418" y1="433.519" x2="-11.673" y2="201.151" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                                <span>No users found</span>
                                            </div>

                                        }
                                    </div>

                                }

                                {type == 'posts' && data?.posts?.length > 0 ? data?.posts.map((post, i) => {
                                    console.log(post)
                                    return (
                                        <Post postData={post} useLikePost={useLikeSearchPost} postIndex={i} useBookmarkPost={useBookmarkSearchPost} query={paramsRef.current} isSearch={true} userId={user?._id} username={user?.username} profile={user?.images?.profile} />
                                    )
                                }) : type == "posts" &&
                                < div className='flex items-center justify-center pt-32 flex-col gap-2'>

                                    <svg width="440" height="240" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><circle cx="451.426" cy="300" r="262.123" fill="url(#a)" /><path d="M708.475 240.202c-12.627 22.535-40.281 25.631-84.585 21.349-33.32-3.227-63.705-5.724-97.027-23.892-23.323-12.707-41.785-29.899-55.26-46.597-14.602-18.089-34.983-38.734-24.992-59.245 13.73-28.174 93.133-51.904 170.236-13.099 84.698 42.641 103.981 99.459 91.628 121.484z" fill="url(#b)" /><path d="M793.833 287.316c-23.788 11.8-55.36-3.373-55.36-3.373s7.016-34.297 30.817-46.081c23.787-11.8 55.347 3.356 55.347 3.356s-7.017 34.298-30.804 46.098z" fill="url(#c)" /><path d="M118.142 373.556c31.081 18.628 75.673 1.408 75.673 1.408s-5.831-47.416-36.931-66.023c-31.081-18.629-75.654-1.429-75.654-1.429s5.83 47.416 36.912 66.044z" fill="url(#d)" /><circle cx="747.028" cy="208.246" r="12.989" transform="rotate(180 747.028 208.246)" fill="#666AF6" /><circle cx="257.822" cy="281.817" r="14.612" transform="rotate(180 257.822 281.817)" fill="#666AF6" /><circle r="12.177" transform="matrix(-1 0 0 1 159.929 195.932)" fill="#666AF6" /><circle r="5.683" transform="matrix(-1 0 0 1 635.635 259.251)" fill="#666AF6" /><circle r="7.306" transform="matrix(-1 0 0 1 668.43 512.81)" fill="#E1E4E5" /><circle r="10.553" transform="matrix(-1 0 0 1 157.751 436.948)" fill="#E1E4E5" /><circle r="8.032" transform="matrix(-1 0 0 1 279.793 167.303)" fill="#E1E4E5" /><circle r="8.93" transform="matrix(-1 0 0 1 669.743 168.793)" fill="#E1E4E5" /><circle r="8.019" transform="scale(1 -1) rotate(-75 -85.053 -253.614)" fill="#E1E4E5" /><circle r="10.668" transform="matrix(-1 0 0 1 385.553 99.921)" fill="#E1E4E5" /><ellipse rx="8.206" ry="6.565" transform="matrix(-1 0 0 1 725.744 372.599)" fill="#E1E4E5" /><circle r="16.689" transform="scale(1 -1) rotate(-75 220.696 -421.766)" fill="#E1E4E5" /><path d="M787.973 327.261h.214c1.271 18.011 14.666 18.288 14.666 18.288s-14.77.288-14.77 21.1c0-20.812-14.771-21.1-14.771-21.1s13.389-.277 14.661-18.288zM248.445 502.359h.19c1.128 16.301 13.014 16.552 13.014 16.552s-13.106.261-13.106 19.096c0-18.835-13.106-19.096-13.106-19.096s11.88-.251 13.008-16.552z" fill="#E1E4E5" /><rect x="221.128" y="128.304" width="461.792" height="344.342" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M404.574 247.969v23.992m95.978-23.992v23.992m35.801 108.38s-31.442-30.145-83.879-30.145c-52.436 0-83.879 30.145-83.879 30.145" stroke="#666AF6" stroke-width="33.798" stroke-linecap="round" stroke-linejoin="round" /><rect x="221.128" y="128.304" width="461.792" height="40.04" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><rect x="237.144" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="261.168" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="285.191" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><defs><linearGradient id="a" x1="462.603" y1="856.045" x2="446.439" y2="-532.412" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="623.412" y1="386.251" x2="510.865" y2="-119.486" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="c" x1="702.485" y1="324.123" x2="898.687" y2="168.927" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="d" x1="238.418" y1="433.519" x2="-11.673" y2="201.151" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                    <span>No posts found</span>
                                </div>
                                }


                                {type == 'pages' && pages && !isLoading &&
                                    pages?.length > 0 ?

                                    < div className='w-full flex flex-col gap-2'>
                                        <div>Pages</div>
                                        {
                                            pages.map((page, i) => {
                                                if (i >= 3) {
                                                    return null
                                                }
                                                return (
                                                    <Link to={domain + "/page/" + page?.handle}>
                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                            <div className='flex gap-2'>
                                                                <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={page?.images?.profile} alt="Avatar" />
                                                                        <AvatarFallback className='text-2xl'>{page?.name[0]?.toUpperCase() + page?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                                <div className="flex flex-col justify-center">
                                                                    <div className=''>{page?.name}</div>
                                                                    <div className='text-gray-400 text-sm'>@{page?.handle}</div>
                                                                </div>

                                                            </div>
                                                            <div className='flex gap-2'>
                                                                {page && !page.admins?.includes(user?._id) && (page?.followers?.includes(user?._id) ? <Button>Followed</Button> : <Button onClick={() => {
                                                                    followPage(page?._id)
                                                                }}>Follow</Button>)}
                                                                {page && page.admins.includes(user?._id) && <Button>Admin</Button>}

                                                            </div>
                                                        </div>
                                                    </Link>

                                                )
                                            })
                                        }
                                    </div>
                                    :

                                    type == "pages" && !isLoading &&
                                    < div className='flex items-center justify-center pt-32 flex-col gap-2'>

                                        <svg width="440" height="240" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><circle cx="451.426" cy="300" r="262.123" fill="url(#a)" /><path d="M708.475 240.202c-12.627 22.535-40.281 25.631-84.585 21.349-33.32-3.227-63.705-5.724-97.027-23.892-23.323-12.707-41.785-29.899-55.26-46.597-14.602-18.089-34.983-38.734-24.992-59.245 13.73-28.174 93.133-51.904 170.236-13.099 84.698 42.641 103.981 99.459 91.628 121.484z" fill="url(#b)" /><path d="M793.833 287.316c-23.788 11.8-55.36-3.373-55.36-3.373s7.016-34.297 30.817-46.081c23.787-11.8 55.347 3.356 55.347 3.356s-7.017 34.298-30.804 46.098z" fill="url(#c)" /><path d="M118.142 373.556c31.081 18.628 75.673 1.408 75.673 1.408s-5.831-47.416-36.931-66.023c-31.081-18.629-75.654-1.429-75.654-1.429s5.83 47.416 36.912 66.044z" fill="url(#d)" /><circle cx="747.028" cy="208.246" r="12.989" transform="rotate(180 747.028 208.246)" fill="#666AF6" /><circle cx="257.822" cy="281.817" r="14.612" transform="rotate(180 257.822 281.817)" fill="#666AF6" /><circle r="12.177" transform="matrix(-1 0 0 1 159.929 195.932)" fill="#666AF6" /><circle r="5.683" transform="matrix(-1 0 0 1 635.635 259.251)" fill="#666AF6" /><circle r="7.306" transform="matrix(-1 0 0 1 668.43 512.81)" fill="#E1E4E5" /><circle r="10.553" transform="matrix(-1 0 0 1 157.751 436.948)" fill="#E1E4E5" /><circle r="8.032" transform="matrix(-1 0 0 1 279.793 167.303)" fill="#E1E4E5" /><circle r="8.93" transform="matrix(-1 0 0 1 669.743 168.793)" fill="#E1E4E5" /><circle r="8.019" transform="scale(1 -1) rotate(-75 -85.053 -253.614)" fill="#E1E4E5" /><circle r="10.668" transform="matrix(-1 0 0 1 385.553 99.921)" fill="#E1E4E5" /><ellipse rx="8.206" ry="6.565" transform="matrix(-1 0 0 1 725.744 372.599)" fill="#E1E4E5" /><circle r="16.689" transform="scale(1 -1) rotate(-75 220.696 -421.766)" fill="#E1E4E5" /><path d="M787.973 327.261h.214c1.271 18.011 14.666 18.288 14.666 18.288s-14.77.288-14.77 21.1c0-20.812-14.771-21.1-14.771-21.1s13.389-.277 14.661-18.288zM248.445 502.359h.19c1.128 16.301 13.014 16.552 13.014 16.552s-13.106.261-13.106 19.096c0-18.835-13.106-19.096-13.106-19.096s11.88-.251 13.008-16.552z" fill="#E1E4E5" /><rect x="221.128" y="128.304" width="461.792" height="344.342" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M404.574 247.969v23.992m95.978-23.992v23.992m35.801 108.38s-31.442-30.145-83.879-30.145c-52.436 0-83.879 30.145-83.879 30.145" stroke="#666AF6" stroke-width="33.798" stroke-linecap="round" stroke-linejoin="round" /><rect x="221.128" y="128.304" width="461.792" height="40.04" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><rect x="237.144" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="261.168" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="285.191" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><defs><linearGradient id="a" x1="462.603" y1="856.045" x2="446.439" y2="-532.412" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="623.412" y1="386.251" x2="510.865" y2="-119.486" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="c" x1="702.485" y1="324.123" x2="898.687" y2="168.927" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="d" x1="238.418" y1="433.519" x2="-11.673" y2="201.151" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                        <span>No pages found</span>
                                    </div>

                                }


                                {type == 'groups' && groups &&
                                    < div className='w-full flex flex-col gap-2'>
                                        {groups.length > 0 && <div>Groups</div>}
                                        {groups?.length > 0 ?

                                            groups.map((group, i) => {
                                                if (i >= 3) {
                                                    return null
                                                }
                                                console.log(group.handle)
                                                return (
                                                    <Link to={domain + "/group/" + group?.handle}>
                                                        <div className='flex w-full justify-between items-center p-2 gap-2 bg-card rounded-md'>
                                                            <div className='flex gap-2'>
                                                                <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={group?.images?.profile} alt="Avatar" />
                                                                        <AvatarFallback className='text-2xl'>{group?.name[0]?.toUpperCase() + group?.name[1]?.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                                <div className="flex flex-col justify-center">
                                                                    <div className=''>{group?.name}</div>
                                                                    <div className='text-gray-400 text-sm'>@{group?.handle}</div>
                                                                </div>

                                                            </div>
                                                            <div className='flex gap-2'>
                                                                {groupAction == "" && !group?.admins?.includes(user?._id) && !group?.members?.includes(user?._id) ? <Button onClick={() => {
                                                                    joinGroup(group?._id)
                                                                    setGroupAction("join")
                                                                }}>Join</Button> : <Button>Member</Button>}

                                                            </div>
                                                        </div>
                                                    </Link>

                                                )
                                            }) : type == "groups" && !isLoading &&
                                            < div className='flex items-center justify-center pt-32 flex-col gap-2'>

                                                <svg width="440" height="240" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><circle cx="451.426" cy="300" r="262.123" fill="url(#a)" /><path d="M708.475 240.202c-12.627 22.535-40.281 25.631-84.585 21.349-33.32-3.227-63.705-5.724-97.027-23.892-23.323-12.707-41.785-29.899-55.26-46.597-14.602-18.089-34.983-38.734-24.992-59.245 13.73-28.174 93.133-51.904 170.236-13.099 84.698 42.641 103.981 99.459 91.628 121.484z" fill="url(#b)" /><path d="M793.833 287.316c-23.788 11.8-55.36-3.373-55.36-3.373s7.016-34.297 30.817-46.081c23.787-11.8 55.347 3.356 55.347 3.356s-7.017 34.298-30.804 46.098z" fill="url(#c)" /><path d="M118.142 373.556c31.081 18.628 75.673 1.408 75.673 1.408s-5.831-47.416-36.931-66.023c-31.081-18.629-75.654-1.429-75.654-1.429s5.83 47.416 36.912 66.044z" fill="url(#d)" /><circle cx="747.028" cy="208.246" r="12.989" transform="rotate(180 747.028 208.246)" fill="#666AF6" /><circle cx="257.822" cy="281.817" r="14.612" transform="rotate(180 257.822 281.817)" fill="#666AF6" /><circle r="12.177" transform="matrix(-1 0 0 1 159.929 195.932)" fill="#666AF6" /><circle r="5.683" transform="matrix(-1 0 0 1 635.635 259.251)" fill="#666AF6" /><circle r="7.306" transform="matrix(-1 0 0 1 668.43 512.81)" fill="#E1E4E5" /><circle r="10.553" transform="matrix(-1 0 0 1 157.751 436.948)" fill="#E1E4E5" /><circle r="8.032" transform="matrix(-1 0 0 1 279.793 167.303)" fill="#E1E4E5" /><circle r="8.93" transform="matrix(-1 0 0 1 669.743 168.793)" fill="#E1E4E5" /><circle r="8.019" transform="scale(1 -1) rotate(-75 -85.053 -253.614)" fill="#E1E4E5" /><circle r="10.668" transform="matrix(-1 0 0 1 385.553 99.921)" fill="#E1E4E5" /><ellipse rx="8.206" ry="6.565" transform="matrix(-1 0 0 1 725.744 372.599)" fill="#E1E4E5" /><circle r="16.689" transform="scale(1 -1) rotate(-75 220.696 -421.766)" fill="#E1E4E5" /><path d="M787.973 327.261h.214c1.271 18.011 14.666 18.288 14.666 18.288s-14.77.288-14.77 21.1c0-20.812-14.771-21.1-14.771-21.1s13.389-.277 14.661-18.288zM248.445 502.359h.19c1.128 16.301 13.014 16.552 13.014 16.552s-13.106.261-13.106 19.096c0-18.835-13.106-19.096-13.106-19.096s11.88-.251 13.008-16.552z" fill="#E1E4E5" /><rect x="221.128" y="128.304" width="461.792" height="344.342" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M404.574 247.969v23.992m95.978-23.992v23.992m35.801 108.38s-31.442-30.145-83.879-30.145c-52.436 0-83.879 30.145-83.879 30.145" stroke="#666AF6" stroke-width="33.798" stroke-linecap="round" stroke-linejoin="round" /><rect x="221.128" y="128.304" width="461.792" height="40.04" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><rect x="237.144" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="261.168" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="285.191" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><defs><linearGradient id="a" x1="462.603" y1="856.045" x2="446.439" y2="-532.412" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="623.412" y1="386.251" x2="510.865" y2="-119.486" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="c" x1="702.485" y1="324.123" x2="898.687" y2="168.927" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="d" x1="238.418" y1="433.519" x2="-11.673" y2="201.151" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                                <span>No groups found</span>
                                            </div>
                                        }
                                    </div>
                                }

                            </div>
                        </div>
                    </div>
                        :
                        <ScreenLoader />
                    }

                </div >
            </div >

        </div >
    )
}

export default SearchSection