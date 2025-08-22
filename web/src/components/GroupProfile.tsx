import { useAppSelector } from '@/app/hooks'
import Post from '@/components/Post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBookmarkPost, useCreatePost, useGroupPosts, useLikePost } from '@/hooks/Post/usePost'
import { useGroup, useGroupMembers, useJoinGroup, useToggleAdmin } from '@/hooks/useGroup'
import CPostModal from '@/models/CPostModal'
import QuickSettings from '@/models/QuickSettings'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Tabs, TabsContent } from '@radix-ui/react-tabs'
import { EllipsisVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Profile from './profile/Profile'
import Cover from './profile/Cover'
import { useMedia } from '@/hooks/useMedia'
import ProfileMedia from './ProfileMedia'
import { MediaOpenModel } from './MediaOpenModel'
import { setMediaModelDetails } from '@/utils/mediaOpenModel'
import MediaSection from './MediaSection'
import CustomTabList from './profile/CustomTabList'
import { format } from 'date-fns'
import BottomCreatePost from '@/models/BottomCreatePost'

function GroupProfile() {

    const postContent = useRef()
    const [profileSettingsModel, setProfileSettingsModel] = useState(false)
    const [postModal, setPostModal] = useState(false)
    const { user } = useAppSelector(data => data.user)
    const { firstname, lastname, username } = user
    const [posts, setPosts] = useState([])
    const [newPost, setNewPost] = useState(undefined)
    const tabList = [{ value: "posts", name: "Posts" }, { value: "members", name: "Members" }, { value: "media", name: "Media" }, { value: "about", name: "About" }]

    const { handle } = useParams()

    const { data, isLoading, isSuccess, isError } = useGroup(handle)

    const groupPosts = useGroupPosts("group", data?._id)
    const _joinGroup = useJoinGroup()
    const groupMembers = useGroupMembers(data._id)
    const groupMedia = useMedia("groupMedia", data?._id)
    const groupAdminToggle = useToggleAdmin()
    let media = groupMedia.data
    console.log(groupPosts)

    useEffect(() => {
        if (newPost !== undefined) {
            setPosts([newPost, ...posts])
            setNewPost(undefined)
        }
    }, [newPost])

    const createPost = useCreatePost('groupPosts', data?._id)

    // const _createPost = async ({ content, selectedMedia, formData, visibility }) => {
    //     let postDetails = { content, media: data, type: "group", targetId: data?._id, visibility }
    //     formData.append("postData", JSON.stringify(postDetails))
    //     let response = createPost.mutate({ content, formData, selectedMedia, type: "group", target: data })
    //     console.log(response, 'uploaded')
    //     setPostModal(false)
    // }

    const _createPost = async ({ visibility, content, selectedMedia, backgroundColor, mentions, mentionReferences, formData }) => {
        let postDetails = { content, type: "group", postType: 'post', backgroundColor, mentions, targetId: data?._id, visibility }
        formData.append("postData", JSON.stringify(postDetails))
        createPost.mutate({ content, formData, selectedMedia, mentions, mentionReferences, backgroundColor, postType: 'post', type: "group", target: data })
        setPostModal(false)
    }

    const joinGroup = async () => {
        _joinGroup.mutate({ groupDetails: { groupId: data?._id, type: "group" } })
    }

    const [mediaOpenModel, setMediaOpenModel] = useState(false)
    const [mediaOpenDetails, setMediaOpenDetails] = useState({ type: '', url: '' })
    console.log(groupMembers?.data)

    const [searchParams] = useSearchParams()
    const [width, setWidth] = useState(window.innerWidth)

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth)
            console.log(window.innerWidth)
        })
    }, [])

    const navigate = useNavigate()


    return (
        <>
            {isError &&
                <div className='w-full h-full flex items-center justify-center pt-32 flex-col gap-2'>

                    <svg width="440" height="240" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><circle cx="451.426" cy="300" r="262.123" fill="url(#a)" /><path d="M708.475 240.202c-12.627 22.535-40.281 25.631-84.585 21.349-33.32-3.227-63.705-5.724-97.027-23.892-23.323-12.707-41.785-29.899-55.26-46.597-14.602-18.089-34.983-38.734-24.992-59.245 13.73-28.174 93.133-51.904 170.236-13.099 84.698 42.641 103.981 99.459 91.628 121.484z" fill="url(#b)" /><path d="M793.833 287.316c-23.788 11.8-55.36-3.373-55.36-3.373s7.016-34.297 30.817-46.081c23.787-11.8 55.347 3.356 55.347 3.356s-7.017 34.298-30.804 46.098z" fill="url(#c)" /><path d="M118.142 373.556c31.081 18.628 75.673 1.408 75.673 1.408s-5.831-47.416-36.931-66.023c-31.081-18.629-75.654-1.429-75.654-1.429s5.83 47.416 36.912 66.044z" fill="url(#d)" /><circle cx="747.028" cy="208.246" r="12.989" transform="rotate(180 747.028 208.246)" fill="#666AF6" /><circle cx="257.822" cy="281.817" r="14.612" transform="rotate(180 257.822 281.817)" fill="#666AF6" /><circle r="12.177" transform="matrix(-1 0 0 1 159.929 195.932)" fill="#666AF6" /><circle r="5.683" transform="matrix(-1 0 0 1 635.635 259.251)" fill="#666AF6" /><circle r="7.306" transform="matrix(-1 0 0 1 668.43 512.81)" fill="#E1E4E5" /><circle r="10.553" transform="matrix(-1 0 0 1 157.751 436.948)" fill="#E1E4E5" /><circle r="8.032" transform="matrix(-1 0 0 1 279.793 167.303)" fill="#E1E4E5" /><circle r="8.93" transform="matrix(-1 0 0 1 669.743 168.793)" fill="#E1E4E5" /><circle r="8.019" transform="scale(1 -1) rotate(-75 -85.053 -253.614)" fill="#E1E4E5" /><circle r="10.668" transform="matrix(-1 0 0 1 385.553 99.921)" fill="#E1E4E5" /><ellipse rx="8.206" ry="6.565" transform="matrix(-1 0 0 1 725.744 372.599)" fill="#E1E4E5" /><circle r="16.689" transform="scale(1 -1) rotate(-75 220.696 -421.766)" fill="#E1E4E5" /><path d="M787.973 327.261h.214c1.271 18.011 14.666 18.288 14.666 18.288s-14.77.288-14.77 21.1c0-20.812-14.771-21.1-14.771-21.1s13.389-.277 14.661-18.288zM248.445 502.359h.19c1.128 16.301 13.014 16.552 13.014 16.552s-13.106.261-13.106 19.096c0-18.835-13.106-19.096-13.106-19.096s11.88-.251 13.008-16.552z" fill="#E1E4E5" /><rect x="221.128" y="128.304" width="461.792" height="344.342" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><path d="M404.574 247.969v23.992m95.978-23.992v23.992m35.801 108.38s-31.442-30.145-83.879-30.145c-52.436 0-83.879 30.145-83.879 30.145" stroke="#666AF6" stroke-width="33.798" stroke-linecap="round" stroke-linejoin="round" /><rect x="221.128" y="128.304" width="461.792" height="40.04" rx="4.194" fill="#fff" stroke="#E1E4E5" stroke-width="4" /><rect x="237.144" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="261.168" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><rect x="285.191" y="141.65" width="13.347" height="13.347" rx="6.673" fill="#fff" stroke="#E1E4E5" stroke-width="4.194" /><defs><linearGradient id="a" x1="462.603" y1="856.045" x2="446.439" y2="-532.412" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="623.412" y1="386.251" x2="510.865" y2="-119.486" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="c" x1="702.485" y1="324.123" x2="898.687" y2="168.927" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="d" x1="238.418" y1="433.519" x2="-11.673" y2="201.151" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                    <span>Not found</span>
                </div>
            }
            {isLoading &&
                <div className='w-full h-full flex items-center justify-center'>loading...</div>
            }
            {isSuccess &&
                <div className='w-full flex flex-col overflow-y-auto border-muted bg-background-secondary'>

                    {/* media model (when you click any media in the profile main page this model will open) */}
                    {mediaOpenModel && mediaOpenDetails &&
                        <MediaOpenModel mediaOpenDetails={mediaOpenDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                    }
                    {profileSettingsModel && <QuickSettings user={user} setModelTrigger={setProfileSettingsModel} />}
                    {searchParams.get("createpost") && (width < 540) ? <BottomCreatePost setModelTrigger={setPostModal} createPost={_createPost} /> : searchParams.get("createpost") && <CPostModal setModelTrigger={setPostModal} createPost={_createPost} />}

                    <div className='flex w-full flex-col items-center'>
                        <div className="flex max-w-5xl w-full flex-col justify-cente relative">
                            <Cover cover={data?.cover} />
                            <div className='flex w-full'>
                                <div className='flex flex-col justify-center items-center relative sm:pl10 left max-w-[90%] w-full bottom-16'>
                                    <Profile image={!isLoading && data?.profile} fallbackName={!isLoading && (data?.name[0].toUpperCase() + data?.name[1].toUpperCase())} width={'w-24'} smWidth={'w-32'} height={'h-24'} smHeight={'h-32'} />
                                    <div className='flex ga-2 mt-2 flex-col'>
                                        <div className='flex flex-col text-lg text-md text-center'>
                                            <div className=''>{data?.name}</div>
                                        </div>
                                        <div className='text-center'>
                                            <p className='text-sm'>{data?.bio}</p>
                                        </div>
                                        <div className='flex flex-col text-sm text-center'>
                                            <span>{!isLoading && (data?.membersCount == 1 ? data?.membersCount + " member" : data?.membersCount > 1 ? data?.membersCount + " members" : "no members")}</span>
                                        </div>

                                    </div>
                                    {!isLoading && !data.isAdmin && !data.isSuperAdmin && (data.isMember ? <Button onClick={joinGroup}>Leave</Button> :
                                        <Button onClick={joinGroup}>Join</Button>)}
                                </div>
                                {data?.isUploaded == false &&
                                    <div className='relative bottom-6 min-w-fit z-10 flex right-4  justify-center items-center gap-2' >
                                        <svg className="text-foreground animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                                            width="20" height="20">
                                            <path
                                                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                                                stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path
                                                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                                                stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" className="text-foreground">
                                            </path>
                                        </svg>
                                        <div>In progress...</div>
                                    </div>
                                }
                            </div>
                            <Tabs defaultValue="posts" className='relative bottom-8'>
                                <CustomTabList list={tabList} minWidth={306} maxWidth={80} />

                                <TabsContent value="posts" className="">
                                    <div className='flex-responsive w-full items-center md:items-start sm:p-2 flex gap-2  border-muted'>
                                        <div className='max-w-xl w-full flex flex-col gap-2 '>
                                            {(data.isMember || user?._id == data?.user) && <div className='w-full flex items-center justify-center h-fit border border-muted p-3 bg-card'>
                                                <div className="w-full flex-1">
                                                    <form onSubmit={async (e) => {
                                                        e.preventDefault()
                                                    }}>
                                                        <div className="relative flex gap-2">
                                                            <div className='w-12'>
                                                                <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                                                    <Avatar >
                                                                        <AvatarImage src={!isLoading && data?.profile} alt="Avatar" />
                                                                        <AvatarFallback>{firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                            </div>
                                                            <Input
                                                                onClick={() => {
                                                                    navigate("?createpost=true")
                                                                }}
                                                                ref={postContent}
                                                                type="text"
                                                                placeholder="Start writing a post"
                                                                className="max-w-2xl appearance-none bg-background shadow-none"
                                                            />
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>}
                                            {/* <div className="w-full flex-1">
                                            <form onSubmit={async (e) => {
                                                e.preventDefault()
                                                // mutation.mutate({ title: 'shazz', content: postContent.current.value })
                                                // console.log(mutation.data)
                                            }}>
                                                <div className="relative flex gap-2">
                                                    <div className='w-12'>
                                                        <div className='w-10 h-10 rounded-full overflow-hidden'>
                                                            <Avatar className="hidden  sm:flex">
                                                                <AvatarImage src={images?.profile} alt="Avatar" />
                                                                <AvatarFallback>{firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                    </div>
                                                    <Input
                                                        onClick={() => {
                                                            setPostModal(true)
                                                        }}
                                                        ref={postContent}
                                                        type="text"
                                                        placeholder="Start writing a post"
                                                        className="max-w-2xl appearance-none bg-background shadow-none"
                                                    />
                                                </div>
                                            </form>
                                        </div> */}
                                            <div className='flex w-full items-center flex-col gap-2 '>
                                                {!isLoading && groupPosts.data.length > 0 ? groupPosts.data?.map((page, pageIndex) => {
                                                    return page.posts.map((post, postIndex) => (
                                                        <Post useLikePost={useLikePost} useBookmarkPost={useBookmarkPost} pageIndex={pageIndex} postIndex={postIndex} postData={post} username={username} userId={user?._id} key={post?._id} type="group" isAdmin={!isLoading && data?.isAdmin} />
                                                    ))
                                                })
                                                    :
                                                    <div>
                                                        ...loading
                                                    </div>
                                                }

                                            </div>
                                        </div>
                                        <ProfileMedia media={media} setMediaModelDetails={setMediaModelDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="members" className="">
                                    <div className='flex-responsive w-full items-center md:items-start p-2 flex gap-2 border-muted'>
                                        <div className='max-w-xl w-full flex flex-col gap-2 '>
                                            <div className='flex w-full items-center  flex-col gap-2 '>
                                                {
                                                    !isLoading && data?.admins?.map((admin) => {
                                                        console.log(admin._id, data.user)
                                                        if (admin?._id == data.user) {
                                                            return (
                                                                <div className='flex flex-col gap-1 w-full bg-card' key={admin?._id}>
                                                                    <div className='flex-responsive items-center p-2 gap-2 relative w-full '>
                                                                        <div className='flex w-full gap-2'>
                                                                            <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                                <Avatar >
                                                                                    <AvatarImage src={admin?.images?.profile} alt="Avatar" />
                                                                                    <AvatarFallback className='text-2xl'>{admin?.firstname[0]?.toUpperCase() + admin?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                            </div>
                                                                            <div className="flex flex-col justify-center">
                                                                                <div className='flex gap-2'>{admin?.firstname + " " + admin?.lastname}{data?.user == admin._id &&
                                                                                    <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>owner</div>}{admin?.isAdmin && admin._id !== data?.user &&
                                                                                        <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>admin</div>}</div>
                                                                                <div className='text-gray-400 text-sm'>@{admin?.username}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                    })
                                                }
                                                {
                                                    !isLoading && data?.admins?.map((admin, i) => {
                                                        if (admin?._id == data.user) {
                                                            return null
                                                        }
                                                        return (<div className='flex flex-col gap-1 w-full bg-card' key={admin?._id}>
                                                            <div className='flex-responsive items-center p-2 gap-2 relative w-full '>
                                                                <div className='flex w-full gap-2'>
                                                                    <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                        <Avatar >
                                                                            <AvatarImage src={admin?.images?.profile} alt="Avatar" />
                                                                            <AvatarFallback className='text-2xl'>{admin?.firstname[0]?.toUpperCase() + admin?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                        </Avatar>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center">
                                                                        <div className='flex gap-2'>{admin?.firstname + " " + admin?.lastname}{data?.user == admin._id &&
                                                                            <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>owner</div>}{admin?.isAdmin && admin._id !== data?.user &&
                                                                                <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>admin</div>}</div>
                                                                        <div className='text-gray-400 text-sm'>@{admin?.username}</div>
                                                                    </div>
                                                                </div>
                                                                {/* 
                                                        {data?.isSuperAdmin && admin?._id !== data?.user &&
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 bg-card p-2 rounded-md">
                                                                        <span className="sr-only">Open menu</span>
                                                                        <EllipsisVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md' >
                                                                    <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center'>
                                                                        <RiUserUnfollowLine size={22} />
                                                                        <span>Remove</span>
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' onClick={() => {

                                                                        groupAdminToggle.mutate({ user: admin, groupId: data?._id, isAdmin: true, index: i })
                                                                    }}>
                                                                        <RiUserUnfollowLine size={22} />
                                                                        <span>Remove as admin</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        } */}
                                                            </div>
                                                        </div>
                                                        )
                                                    })
                                                }

                                                {!groupMembers.isLoading && groupMembers.data.map((page) => {
                                                    return page.members.map((memberData) => {
                                                        return (
                                                            <div className='flex flex-col gap-1 w-full bg-card' key={memberData?.user?._id}>
                                                                <div className='flex items-center p-2 gap-2 relative w-full '>
                                                                    <div className='flex w-full gap-2'>
                                                                        <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                                            <Avatar >
                                                                                <AvatarImage src={memberData?.user?.images?.profile} alt="Avatar" />
                                                                                <AvatarFallback className='text-2xl'>{memberData?.user?.firstname[0]?.toUpperCase() + memberData?.user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                        <div className="flex flex-col justify-center">
                                                                            <div className='flex gap-2'>{memberData?.user?.firstname + " " + memberData?.user?.lastname}{data?.isAdmin &&
                                                                                <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>admin</div>}</div>
                                                                            <div className='text-gray-400 text-sm'>@{memberData?.user?.username}</div>

                                                                        </div>
                                                                    </div>
                                                                    {/* 
                                                            {data?.isSuperAdmin &&
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 bg-card p-2 rounded-md">
                                                                            <span className="sr-only">Open menu</span>
                                                                            <EllipsisVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md'>
                                                                        <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' >
                                                                            <RiUserUnfollowLine size={22} />
                                                                            <span>Remove</span>
                                                                        </DropdownMenuItem>
                                                                        {data?.isSuperAdmin
                                                                            &&
                                                                            <DropdownMenuItem onClickCapture={() => {
                                                                                groupAdminToggle.mutate({ user: memberData?.user, groupId: data?._id })
                                                                            }} className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' >
                                                                                <RiAdminLine size={22} />
                                                                                <span>{data?.isAdmin ? "Remove as admin" : "Appoint as admin"}</span></DropdownMenuItem>
                                                                        }
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            } */}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                                )}

                                                {!isLoading && data?.membersCount == 0 && <div className='w-full bg-card p-4'> no group members</div>}
                                            </div>
                                        </div>
                                        <ProfileMedia media={media} setMediaModelDetails={setMediaModelDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="media" className='flex flex-col gap-2'>
                                    <MediaSection type='group' targetId={data?._id} media={media} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                                </TabsContent>
                                <TabsContent value="about" className="">
                                    <div className='px-8 flex-responsive w-full items-center md:items-start  flex gap-2 border-muted'>
                                        <div className="flex flex-col w-full justify-center gap-4 mt-10">
                                            <div className="flex  flex-col sm:flex-row gap-4 w-full">
                                                <div className='flex flex-col w-full gap-2'>
                                                    <div>
                                                        Group Name
                                                    </div>
                                                    <div className='bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                        {data?.name}
                                                    </div>
                                                </div>
                                                <div className='flex w-full flex-col gap-2'>
                                                    <div>
                                                        Group Handle
                                                    </div>
                                                    <div className='bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>{data?.handle}</div>
                                                </div>

                                            </div>


                                            <div className='flex'>
                                                <div className='flex flex-col gap-2 w-full'>
                                                    <div>
                                                        Bio
                                                    </div>
                                                    <div className='bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                        <p className='text-sm w-full'>
                                                            {data?.bio}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {data?.createdAt &&
                                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                                    <div className='flex w-full flex-col gap-2'>
                                                        <div>
                                                            Creation Date
                                                        </div>
                                                        <div className='bg-card p-2 px-3 rounded-md w-full sm:max-w-64'>
                                                            {format(data?.createdAt, 'MMM d, yyy h:mm a')}</div>
                                                    </div>

                                                </div>}

                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                        </div>
                    </div>
                </div>}
        </>
    )
}

export default GroupProfile
