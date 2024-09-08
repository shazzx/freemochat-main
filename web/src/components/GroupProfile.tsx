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
import { useParams } from 'react-router-dom'
import Profile from './profile/Profile'
import Cover from './profile/Cover'
import { useMedia } from '@/hooks/useMedia'
import ProfileMedia from './ProfileMedia'
import { MediaOpenModel } from './MediaOpenModel'
import { setMediaModelDetails } from '@/utils/mediaOpenModel'
import MediaSection from './MediaSection'
import { RiAdminLine, RiUserUnfollowLine } from 'react-icons/ri'
import CustomTabList from './profile/CustomTabList'

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

    const { data, isLoading } = useGroup(handle)
    const groupPosts = useGroupPosts("group", data?._id)
    const _joinGroup = useJoinGroup()
    const groupMembers = useGroupMembers(data._id)
    const groupMedia = useMedia("groupMedia", data?._id)
    const groupAdminToggle = useToggleAdmin()
    let media = groupMedia.data
    console.log(data)

    useEffect(() => {
        if (newPost !== undefined) {
            setPosts([newPost, ...posts])
            setNewPost(undefined)
        }
    }, [newPost])

    const createPost = useCreatePost('groupPosts', data?._id)

    const _createPost = async ({ content, selectedMedia, formData }) => {
        let postDetails = { content, media: data, type: "group", targetId: data?._id }
        formData.append("postData", JSON.stringify(postDetails))
        let response = createPost.mutate({ content, formData, selectedMedia, type: "group", target: data })
        console.log(response, 'uploaded')
        setPostModal(false)
    }

    const joinGroup = async () => {
        _joinGroup.mutate({ groupDetails: { groupId: data?._id, type: "group" } })
    }

    const [mediaOpenModel, setMediaOpenModel] = useState(false)
    const [mediaOpenDetails, setMediaOpenDetails] = useState({ type: '', url: '' })
    console.log(groupMembers?.data)

    return (
        <div className='w-full flex flex-col overflow-y-auto border-muted'>
            {/* media model (when you click any media in the profile main page this model will open) */}
            {mediaOpenModel && mediaOpenDetails &&
                <MediaOpenModel mediaOpenDetails={mediaOpenDetails} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
            }
            {profileSettingsModel && <QuickSettings user={user} setModelTrigger={setProfileSettingsModel} />}
            {postModal && <CPostModal setModelTrigger={setPostModal} createPost={_createPost} />}
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
                            <div className='flex-responsive w-full items-center md:items-start p-2 flex gap-2  border-muted'>
                                <div className='max-w-xl w-full flex flex-col gap-2 '>
                                    <div className='w-full flex items-center justify-center h-fit border border-muted p-3 bg-card'>
                                        <div className="w-full flex-1">
                                            <form onSubmit={async (e) => {
                                                e.preventDefault()
                                            }}>
                                                <div className="relative flex gap-2">
                                                    <div className='w-12'>
                                                        <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                                            <Avatar >
                                                                <AvatarImage src={!isLoading && data?.images?.profile} alt="Avatar" />
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
                                        </div>
                                    </div>
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
                            <MediaSection media={media} setMediaOpenDetails={setMediaOpenDetails} setMediaOpenModel={setMediaOpenModel} />
                        </TabsContent>
                        <TabsContent value="about" className="">
                            <div className='px-8 flex-responsive w-full items-center md:items-start  flex gap-2 border-muted'>
                                <div className="flex flex-col w-full justify-center gap-4 mt-10">
                                    <div className="flex gap-4 w-full">
                                        <div className='flex flex-col w-full gap-2'>
                                            <div>
                                                Group Name
                                            </div>
                                            <div className='bg-card p-2 px-3 rounded-md w-full max-w-64'>
                                                {data?.name}
                                            </div>
                                        </div>
                                        <div className='flex w-full flex-col gap-2'>
                                            <div>
                                                Group Handle
                                            </div>
                                            <div className='bg-card p-2 px-3 rounded-md w-full max-w-64'>{data?.handle}</div>
                                        </div>

                                    </div>


                                    <div className='flex'>
                                        <div className='flex flex-col gap-2'>
                                            <div>
                                                Moto
                                            </div>
                                            <div className='bg-card p-2 px-3 rounded-md w-full max-w-64'>
                                                <p className='text-sm'>Freedom is the sure possession of those alone who have the courage to defend it.</p>
                                            </div>
                                        </div>
                                    </div>
                                    {data?.createdAt &&
                                        <div className="flex gap-4 w-full">
                                            <div className='flex w-full flex-col gap-2'>
                                                <div>
                                                    Creation Date
                                                </div>
                                                <div className='bg-card p-2 px-3 rounded-md w-full max-w-64'>{data?.createdAt}</div>
                                            </div>

                                        </div>}

                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </div>
    )
}

export default GroupProfile
