// import SettingsModel from '@/admin/models/SettingsModel'
import { axiosClient } from '@/api/axiosClient'
import { useAppSelector } from '@/app/hooks'
import HelperMessage from '@/components/HelperMessage'
import { MediaOpenModel } from '@/components/MediaOpenModel'
import MediaSection from '@/components/MediaSection'
import Post from '@/components/Post'
import Cover from '@/components/profile/Cover'
import CustomTabList from '@/components/profile/CustomTabList'
import Profile from '@/components/profile/Profile'
import ProfileMedia from '@/components/ProfileMedia'
// import ProfileMedia from '@/components/ProfileMedia'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBookmarkPost, useCreatePost, useLikePost, useUpdatePost, useUserPosts } from '@/hooks/Post/usePost'
import { useMedia } from '@/hooks/useMedia'
import { useAcceptFriendRequest, useFollowUserToggle, useFriendRequestToggle, useRemoveFriend, useUser, useUserFollowers, useUserFriends } from '@/hooks/User/useUser'
import CPostModal from '@/models/CPostModal'
import QuickSettings from '@/models/QuickSettings'
import { setMediaModelDetails } from '@/utils/mediaOpenModel'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Tabs, TabsContent } from '@radix-ui/react-tabs'
import { EllipsisVertical, PencilIcon } from 'lucide-react'
import { FC, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RiUserFollowLine, RiUserUnfollowFill, RiUserUnfollowLine } from "react-icons/ri";
import { FaUserFriends } from 'react-icons/fa'
import { domain } from '@/config/domain'
import { useInView } from 'react-intersection-observer'
import Friends from './tabs/profile/Friends'
import Followers from './tabs/profile/Followers'
const ProfilePage: FC<{ role?: string }> = ({ role }) => {
    const localUserData = useAppSelector(data => data.user)
    const isSelf = role === 'self'
    const params = useParams()
    const query = useUser(params.username, !isSelf)

    const isOwn = localUserData.user._id == query.data?._id
    const acceptFriendRequest = useAcceptFriendRequest()
    // const rejectFriendRequest = useRejectFriendRequest()
    let user = isSelf ? localUserData.user : query.isFetched && query?.data

    const { _id, firstname, lastname, username, email, bio, areFriends, isFollowed, friendRequest, followersCount, friendsCount, address, profile, cover } = user

    const friendRequestToggle = useFriendRequestToggle(username)
    const removeFriend = useRemoveFriend(username, _id && _id)
    const followUserToggle = useFollowUserToggle(username, _id && _id)
    const userFollowers = !query.isLoading ? useUserFollowers(_id && _id) : useUserFollowers()
    const userFriends = !query.isLoading ? useUserFriends(_id && _id) : useUserFriends()
    const createPost = useCreatePost("userPosts", _id && _id)
    const updatePost = useUpdatePost("userPosts", _id && _id)

    const postContent = useRef()
    const [profileSettingsModel, setProfileSettingsModel] = useState(false)
    // console.log(profileSettingsModel)
    const [postModal, setPostModal] = useState(false)

    const [posts, setPosts] = useState([])
    const [newPost, setNewPost] = useState(undefined)
    const tabList = [{ value: "posts", name: "Posts" }, { value: "friends", name: "Friends" }, { value: "followers", name: "Followers" }, { value: "media", name: "Media" }, { value: "about", name: "About" }]
    const navigate = useNavigate()

    const [searchParams, setSearchParams] = useSearchParams()
    // console.log(setSearchParams)
    const { data, isLoading, fetchNextPage } = useUserPosts("user", _id)
    const userMedia = useMedia("userMedia", _id)
    const media = userMedia?.data

    useEffect(() => {
        if (newPost !== undefined) {
            setPosts([newPost, ...posts])
            setNewPost(undefined)
        }
    }, [newPost])

    // profile upload
    const uploadSingle = async (media, type, completeUser) => {
        const formData = new FormData()
        if (media) {
            formData.append("file", media, type)
        }
        if (completeUser) {
            formData.append('userData', JSON.stringify({ ...completeUser }))

        } else {
            formData.append('userData', JSON.stringify({}))
        }

        axiosClient.post("/user/update", formData, { headers: { "Content-Type": 'multipart/form-data' } })
        navigate("")

    }

    // post upload
    const _createPost = async ({ content, selectedMedia, formData }) => {
        let data;
        let postDetails = { content, media: data, type: "user", }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, type: "user", target: user, isUploaded: false })
        setPostModal(false)
    }

    let removePost = (id) => {
        let _postIndex = posts.findIndex((post) => {
            if (post._id == id) {
                return post
            }
        })

        let _post = [...posts]
        _post.splice(_postIndex, 1)

        setPosts(_post)
    }

    const [mediaOpenModel, setMediaOpenModel] = useState(false)
    const [mediaOpenDetails, setMediaOpenDetails] = useState({ type: '', url: '' })

    // post in view
    const { inView, ref } = useInView()
    useEffect(() => {
        fetchNextPage()
        console.log('yes')
    }, [inView])


    return (
        <>
            {query.isError &&
                <div className='w-full h-full flex items-center justify-center'>Something went wrong...</div>
            }
            {query.isLoading &&
                <div className='w-full h-full flex items-center justify-center'>loading...</div>
            }
            {
                query.isSuccess &&
                <div className='w-full flex flex-col overflow-y-auto border-muted bg-background-secondary'>
                    {/* media model (when you click any media in the profile main page this model will open) */}
                    {mediaOpenModel && mediaOpenDetails &&
                        <MediaOpenModel mediaOpenDetails={mediaOpenDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                    }

                    {/* profile settings model */}
                    {searchParams.get("settings") && <QuickSettings user={localUserData.user} setModelTrigger={setProfileSettingsModel} uploadSingle={uploadSingle} />}
                    {searchParams.get("createpost") && <CPostModal setModelTrigger={setPostModal} createPost={_createPost} />}

                    <div className='flex w-full flex-col items-center w-ful'>
                        <div className="flex max-w-5xl w-full flex-col justify-cente relative">
                            {/* cover image component */}
                            <Cover cover={cover} />

                            {/* profile image */}
                            <div className='flex justify-between'>
                                <div className='flex-responsive gap-2 relative pl-4 sm:pl10 left max-w-[90%] sm:w-full bottom-6'>
                                    <Profile image={profile} fallbackName={firstname && firstname[0]?.toUpperCase()} width={'w-24'} smWidth={'w-32'} height={'h-24'} smHeight={'h-32'} />

                                    <div className='flex gap-4'>
                                        <div className='pl-1 lg:pl-0 lg:pt-8'>
                                            <div className='flex flex-col'>
                                                <div className='leading-3'>{firstname} {lastname}</div>
                                                <div className='text-gray-500 text-sm'>@{username}</div>
                                            </div>
                                            <div>
                                                <p className='leading-tight text-sm'>{bio}</p>

                                            </div>
                                            <div className='flex flex-col text-sm'>
                                                {/* address?.area + ", " +  */}
                                                <span>{address?.city + ", " + address?.country}</span>
                                                {/* <span>{friendsCount > 0 && (friendsCount == 1 ? friendsCount + " friend" : friendsCount + " friends")} {friendsCount > 0 && friendsCount && followersCount > 0 && ","} {followersCount && followersCount > 0 && (followersCount == 1 ? followersCount + " follower" : followersCount + " followers")}</span>                                    </div> */}
                                                <span>{friendsCount > 0 && ("Friends " + friendsCount)} {friendsCount > 0 && followersCount > 0 && ", "} {followersCount > 0 && (" Followers " + followersCount)}</span>
                                            </div>

                                        </div>

                                    </div>
                                    <div>
                                    </div>
                                </div>

                                {/* profile edit */}
                                {isSelf && <div className='p-4'>
                                    <PencilIcon size="25" onClick={() => {
                                        navigate("?settings=true")
                                    }} />
                                </div>}
                            </div>
                            <div className='flex justify-end px-4 md:px-10 lg:px-24 gap-2'>
                                {!isSelf && !isOwn && friendRequest && !friendRequest.isRecievedByUser && !areFriends &&
                                    <div>
                                        <Button onClick={() => {
                                            friendRequestToggle.mutate({ recepientId: _id })
                                        }}>{friendRequest.isSentByUser ? "Cancel" : "Add Friend"}</Button>
                                    </div>
                                }
                                {!isSelf && !isOwn && friendRequest && !friendRequest.isSentByUser && friendRequest.isRecievedByUser && !areFriends &&
                                    <div>
                                        <Button onClick={() => {
                                            acceptFriendRequest.mutate({ recepientId: _id, username })
                                        }}>Accept</Button>
                                    </div>
                                }
                                {!isSelf && !isOwn && areFriends &&
                                    <Button className='flex gap-2 *bg-card px-4' onClick={() => {
                                    }}>
                                        <FaUserFriends size={22} /> <span>Friends</span>
                                    </Button>
                                }
                                {!isSelf && !isOwn &&
                                    < DropdownMenu >
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-10 w-8 bg-card p-2 rounded-md">
                                                <EllipsisVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md'>
                                            {areFriends &&
                                                <DropdownMenuItem className=' cursor-pointer hover:bg-accent flex gap-2 p-2 items-center justify-center z-20' onClick={async () => {
                                                    removeFriend.mutate({ recepientId: _id })
                                                }}><RiUserUnfollowFill size={22} /> <span>Unfriend</span></DropdownMenuItem>}

                                            {isFollowed ?
                                                <DropdownMenuItem className=' cursor-pointer hover:bg-accent flex gap-2 p-2 items-center justify-center' onClick={async () => {
                                                    followUserToggle.mutate({ recepientId: _id })
                                                }}>
                                                    <RiUserUnfollowLine size={22} /> <span>Unfollow</span></DropdownMenuItem>
                                                :
                                                <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center justify-center' onClick={async () => {
                                                    followUserToggle.mutate({ recepientId: _id })
                                                }}>
                                                    <RiUserFollowLine size={22} /> <span>Follow</span>
                                                </DropdownMenuItem>}
                                        </DropdownMenuContent>

                                    </DropdownMenu>}
                            </div>

                            {/* tabs container */}
                            <Tabs defaultValue="posts">
                                <CustomTabList list={tabList} minWidth={306} maxWidth={80} />
                                <TabsContent value="posts" className="">
                                    {<div className='flex-responsive w-full items-center md:items-start p-2 flex gap-2  border-muted'>
                                        <div className='max-w-xl w-full flex flex-col gap-2 '>
                                            {isSelf &&
                                                <div className='w-full flex rounded-md items-center justify-center h-fit border border-accent p-3 bg-card'>
                                                    <div className="w-full flex-1">
                                                        <form onSubmit={async (e) => {
                                                            e.preventDefault()
                                                        }}>
                                                            <div className="relative flex gap-2">
                                                                <div className='w-12'>
                                                                    <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                                                        <Avatar >
                                                                            <AvatarImage src={profile} alt="Avatar" />
                                                                            <AvatarFallback>{firstname && firstname[0]?.toUpperCase() + lastname && lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                        </Avatar>
                                                                    </div>
                                                                </div>
                                                                {/* <Input
                                                                    onClick={() => {
                                        navigate("?createpost=true")

                                                                        setPostModal(true)
                                                                    }}
                                                                    ref={postContent}
                                                                    type="text"
                                                                    placeholder="Start writing a post"
                                                                    className="max-w-2xl appearance-none bg-background shadow-none"
                                                                /> */}
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
                                                </div>}
                                            <div className='flex w-full items-center flex-col gap-2 '>
                                                {!isLoading && data.length > 0 ? data?.map((page, pageIndex) => {
                                                    return page.posts.map((post, postIndex) => {
                                                        if (pageIndex == data.length - 1 && postIndex == data[pageIndex].posts.length - 3) {
                                                            return (
                                                                <Post scrollRef={ref} useLikePost={useLikePost} useBookmarkPost={useBookmarkPost} pageIndex={pageIndex} postIndex={postIndex} postData={post} username={username} userId={user?._id} removePost={removePost} type={"user"} key={post?._id} self={isSelf} profile={profile} />
                                                            )
                                                        }
                                                        return <Post useLikePost={useLikePost} useBookmarkPost={useBookmarkPost} pageIndex={pageIndex} postIndex={postIndex} postData={post} username={username} userId={user?._id} removePost={removePost} type={"user"} key={post?._id} self={isSelf} profile={profile} />
                                                    })
                                                })
                                                    :
                                                    <div>
                                                        ...loading
                                                    </div>
                                                }

                                                {!isLoading && data && data?.length > 0 && data[0]?.posts.length == 0 &&
                                                    <HelperMessage message={isSelf ? "you don't have published posts" : "user don't have published posts"} svg={
                                                        <svg width="180" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="M705.499 375.559h-49.367c-12.097 0-22.231-8.232-22.231-18.659 0-5.213 2.615-9.878 6.538-13.171 3.923-3.292 9.481-5.488 15.693-5.488h7.193c6.211 0 11.769-2.195 15.692-5.488 3.924-3.292 6.539-7.957 6.539-13.17 0-10.153-9.808-18.659-22.231-18.659H512.54c-3.939 0-6.471-4.842-6.471-8.781 0-9.878-9.481-17.836-21.251-17.836h-56.112a5.35 5.35 0 1 1 0-10.701h215.003c9.481 0 18.308-3.293 24.52-8.506 6.211-5.214 10.135-12.622 10.135-20.58 0-16.189-15.693-29.086-34.655-29.086H532.662c-17.423 0-34.67-13.445-52.094-13.445h-62c-9.093 0-16.464-7.371-16.464-16.464 0-9.092 7.371-16.463 16.464-16.463h138.83c6.539 0 12.75-2.196 17-5.763 4.251-3.567 6.866-8.506 6.866-14.268 0-10.976-10.789-20.031-23.866-20.031H237.329c-6.538 0-12.75 2.195-17 5.762-4.25 3.567-6.866 8.507-6.866 14.269 0 10.976 10.789 20.031 23.866 20.031h8.174c10.788 0 19.943 7.408 19.943 16.738 0 4.664-2.289 8.78-5.885 11.799-3.596 3.018-8.5 4.939-14.058 4.939h-39.559c-6.866 0-13.405 2.469-17.982 6.311-4.577 3.841-7.519 9.055-7.519 15.092 0 11.799 11.442 21.128 25.174 21.128h40.213c13.077 0 23.866 9.055 23.866 20.031 0 5.488-2.616 10.427-6.866 13.994s-10.135 5.762-16.674 5.762h-35.962c-5.885 0-11.116 1.921-15.039 5.214-3.923 3.292-6.212 7.683-6.212 12.622 0 9.878 9.481 17.836 21.251 17.836h29.097c16.674 0 30.078 11.25 30.078 25.244 0 6.86-3.27 13.445-8.827 17.835-5.558 4.665-13.078 7.409-21.251 7.409h-40.54c-8.173 0-15.693 2.744-20.924 7.409-5.558 4.39-8.827 10.701-8.827 17.561 0 13.72 13.404 24.97 29.751 24.97h125.18c13.825 0 27.405 7.683 41.23 7.683h22.8c8.714 0 15.778 7.064 15.778 15.778 0 8.713-7.064 15.777-15.778 15.777h-55.494c-7.192 0-13.404 2.47-17.981 6.311-4.577 3.842-7.52 9.33-7.52 15.092 0 11.799 11.443 21.403 25.501 21.403h340.012c7.192 0 13.404-2.47 17.981-6.311 4.577-3.842 7.52-9.33 7.52-15.092 0-11.799-11.443-21.403-25.501-21.403h-10.135c-10.462 0-18.635-7.134-18.635-15.64 0-4.39 1.961-8.232 5.557-10.976 3.27-2.744 8.174-4.665 13.405-4.665h42.828c7.193 0 13.404-2.469 17.982-6.311 4.577-3.841 7.519-9.329 7.519-15.091 0-12.348-11.443-21.952-25.501-21.952z" fill="url(#a)" /><path d="M596 169.612v285.435C596 475.869 579.137 493 558.059 493h-12.383c-7.641 0-13.965-4.217-19.234-9.752-8.432-9.224-12.911-21.348-12.911-33.999v-32.945c0-13.178-10.803-23.984-23.977-23.984H337V169.612c0-11.86 9.749-21.612 21.605-21.612h215.79c12.12 0 21.605 9.752 21.605 21.612z" fill="#1b374c" /><path d="M535 512H295.002C267.995 512 246 490.285 246 463.623v-31.61C246 418.27 257.415 407 271.336 407h204.639c13.921 0 25.336 11.27 25.336 25.013v34.359c0 12.919 4.733 25.837 13.643 35.458C520.244 507.602 526.926 512 535 512z" fill="#1b374c" /><circle cx="396.5" cy="224.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="274.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="324.5" r="15.5" fill="#fff" /><rect x="431" y="209" width="123" height="31" rx="15.5" fill="#fff" /><rect x="431" y="259" width="123" height="32" rx="16" fill="#fff" /><rect x="431" y="309" width="123" height="31" rx="15.5" fill="#fff" /><defs><linearGradient id="a" x1="461.983" y1="702.686" x2="454.308" y2="-287.923" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                                    } />
                                                }
                                            </div>
                                        </div>
                                        <ProfileMedia media={media} setMediaModelDetails={setMediaModelDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />

                                    </div>
                                    }
                                </TabsContent>
                                <TabsContent value="friends" className="">
                                    <Friends isSelf={isSelf} userFriends={!isLoading && userFriends} removeFriend={removeFriend} media={media} setMediaModelDetails={setMediaModelDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                                </TabsContent>
                                <TabsContent value="followers" className="">
                                    <Followers isSelf={isSelf} userFollowers={!userFollowers.isLoading && userFollowers} followUserToggle={followUserToggle} recepientId={_id} media={media} setMediaModelDetails={setMediaModelDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                                </TabsContent>
                                <TabsContent value="media" className='flex flex-col gap-2'>
                                    <MediaSection media={media} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                                </TabsContent>
                                <TabsContent value="about">
                                    <div className='p-4  flex-responsive w-full items-center flex gap-2 border-muted'>
                                        <div className="flex gap-4 flex-col w-full justify-center">
                                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                                {firstname &&
                                                    <div className='flex flex-col w-full gap-2'>
                                                        <div>
                                                            Firstname
                                                        </div>
                                                        <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                            {firstname}
                                                        </div>
                                                    </div>
                                                }
                                                {lastname &&
                                                    <div className='flex w-full flex-col gap-2'>
                                                        <div>
                                                            Lastname
                                                        </div>
                                                        <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>{lastname}</div>
                                                    </div>
                                                }

                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                                {username &&
                                                    <div className='flex flex-col w-full gap-2'>
                                                        <div>
                                                            Username
                                                        </div>
                                                        <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                            {username}
                                                        </div>
                                                    </div>
                                                }
                                                {email &&
                                                    <div className='flex w-full flex-col gap-2'>
                                                        <div>
                                                            Email
                                                        </div>
                                                        <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>{email}</div>
                                                    </div>
                                                }

                                            </div>

                                            {bio &&
                                                <div className='flex w-full flex-col gap-2'>
                                                    <div>
                                                        Bio
                                                    </div>
                                                    <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                        <p className='text-sm'>{bio}</p>
                                                    </div>
                                                </div>
                                            }

                                            {address &&
                                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                                    {address.country &&
                                                        <div className='flex flex-col w-full gap-2'>
                                                            <div>
                                                                Country
                                                            </div>
                                                            <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                                {address.country}
                                                            </div>
                                                        </div>
                                                    }
                                                    {address.city &&
                                                        <div className='flex w-full flex-col gap-2'>
                                                            <div>
                                                                City
                                                            </div>
                                                            <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>{address.city}</div>
                                                        </div>
                                                    }

                                                </div>

                                            }
                                            {address &&
                                                <div className='flex w-full flex-col gap-2'>
                                                    <div>
                                                        Area
                                                    </div>
                                                        <div className='bg-gray-100 dark:bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>{address?.area}</div>
                                                </div>
                                            }
                                        </div>
                                    </div>

                                </TabsContent>
                            </Tabs>

                        </div>
                    </div>
                </div >
            }
        </>

    )
}

export default ProfilePage
