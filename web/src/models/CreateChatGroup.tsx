import { useAppSelector } from "@/app/hooks"
import ImageCropper from "@/components/ImageCropper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useChatGroup, useGroupMemberToggle } from "@/hooks/Chat/main"
import { useGroupMembers, useToggleAdmin } from "@/hooks/useGroup"
import { useUserFriends } from "@/hooks/User/useUser"
import { useSocket } from "@/hooks/useSocket"
import { ChatGroupCreate } from "@/utils/schemas/auth"
import { yupResolver } from "@hookform/resolvers/yup"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Label } from "@radix-ui/react-dropdown-menu"
import { QueryClient } from "@tanstack/react-query"
import { Camera, ChevronLeft, EllipsisVertical } from "lucide-react"
import { FC, memo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { MdClose } from "react-icons/md"
import { RiAdminLine, RiUserUnfollowLine } from "react-icons/ri"
import { useNavigate } from "react-router-dom"


const CreateChatGroup: FC<any> = ({ currentTab, createGroup, editGroup, editState, groupDetails, setChatOpen }) => {

    const {socket} = useAppSelector(state => state.socket)

    const queryClient = new QueryClient()

    let [imageSrc, setImageSrc] = useState(null)
    let [coverImage, SetCoverImage] = useState(null)
    let [imageUpload, setImageUpload] = useState(null)
    let [coverImageUpload, setCoverImageUpload] = useState(null)
    let [cropperModel, setCropperModel] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(ChatGroupCreate),
        mode: 'onChange',
    });
    const navigate = useNavigate()

    // console.log(groupDetails)
    const groupName = useRef<HTMLInputElement>()
    const groupDescription = useRef<HTMLTextAreaElement>()

    const onSubmit = async (groupData) => {
        // console.log(editState, 'editstate')
        if (editState) {
            editGroup({ groupData, imageUpload, coverImageUpload })
            return
        }
        createGroup(groupData, imageUpload, coverImageUpload)
        navigate('', { replace: true })
    }
    const { user } = useAppSelector(state => state.user)

    const userFriends = useUserFriends(user._id, groupDetails?.groupId)
    // console.log(groupDetails)

    const [addMemberState, setAddMemberState] = useState(false)
    const { data, isLoading } = useGroupMembers(groupDetails?.groupId)
    const groupMemberToggle = useGroupMemberToggle(user._id, groupDetails?.groupId)
    const groupAdminToggle = useToggleAdmin()
    const chatGroup: any = editState ? useChatGroup(groupDetails?.groupId) : {}


    return (
        <div className='absolute top-0 right-0 w-screen z-10 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                navigate('', { replace: true })
                // setModelTrigger(false)
            }}></div>
            {
                imageUpload && cropperModel &&
                <ImageCropper image={imageUpload} aspect={4 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    setImageSrc(imageUrl)
                    setImageUpload(croppedImage)
                }} />
            }
            {
                coverImageUpload && cropperModel &&
                <ImageCropper image={coverImageUpload} aspect={9 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    SetCoverImage(imageUrl)
                    setCoverImageUpload(croppedImage)
                }} />

            }
            <div className='z-10 max-w-[460px] w-full bg-background rounded-lg h-full  border-2 border-accent overflow-auto'>
                <div className="grid gap-8 p-1  overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        {/* cover image */}
                        <div className='relative w-full max-h-72 roundd-md  overflow-hidden'>
                            <MdClose className="absolute right-1 top-1" size={24} cursor="pointer" onClick={() => {
                                navigate('', { replace: true })
                            }} />
                            <div className="w-full">
                                <label htmlFor="image-cover" className="cursor-pointer">
                                    <div className="flex items-center justify-center w-full h-56 bg-muted">
                                        {coverImage ?
                                            <img onClick={() => {
                                            }} src={coverImage} alt="" />
                                            :
                                            editState && groupDetails?.images?.cover ? <img className='w-full' onClick={() => {
                                            }} src={groupDetails?.images?.cover} alt="" />

                                                :
                                                <Camera size={42} />

                                        }
                                    </div>

                                </label>

                                <input className="hidden" type="file" accept='image/*' id='image-cover' onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.addEventListener('load', () => {
                                            setCoverImageUpload(reader.result as string);
                                        });
                                        reader.readAsDataURL(file);
                                        setCropperModel(true)
                                    }
                                }} />
                            </div>

                        </div>
                        {/* profile image */}
                        <div className='w-28 h-28 rounded-xl absolute -bottom-16 border-primary border-2 overflow-hidden'>
                            <div >
                                <label htmlFor="image-profile" className="cursor-pointer">
                                    <div className="flex items-center justify-center w-28 h-28 bg-muted">
                                        {imageSrc ?
                                            <img className='w-full' onClick={() => {
                                            }} src={imageSrc} alt="" />
                                            :
                                            editState && groupDetails?.images?.profile ? <img className='w-full' onClick={() => {
                                            }} src={groupDetails?.images?.profile} alt="" />

                                                :
                                                <Camera size={42} />
                                        }
                                    </div>

                                </label>
                                <input className="hidden" type="file" accept='image/*' id='image-profile' onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.addEventListener('load', () => {
                                            setImageUpload(reader.result as string);
                                        });
                                        reader.readAsDataURL(file);
                                    }
                                    setCropperModel(true)
                                }} />
                            </div>

                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="w-full p-4 flex justify-center flex-col gap-8 items-center">
                            <div className="flex flex-col w-full items-center justify-center gap-2 mt-10">
                                <div className="max-w-96 w-full">
                                    <Label >
                                        Name
                                    </Label>
                                    <Input
                                        name="name"
                                        ref={groupName}
                                        defaultValue={groupDetails?.name}
                                        id="name"
                                        className="w-full"
                                        placeholder="group name"
                                        {...register('name')}
                                    />
                                    {errors.name && <p>{errors.name.message}</p>}
                                </div>

                                <div className="max-w-96 w-full">
                                    <Label >
                                        Description
                                    </Label>
                                    <Textarea
                                        ref={groupDescription}
                                        defaultValue={groupDetails?.description}
                                        id="description"
                                        name="description"
                                        className="w-full"
                                        placeholder="group description"
                                        maxLength={150}
                                        {...register('description')}
                                    />
                                    {errors.description && <p>{errors.description.message}</p>}
                                </div>
                            </div>
                            <div className="w-full flex justify-end" onClick={() => {
                                if (currentTab !== "groups") {
                                    // setCurrentTab("groups")
                                }
                            }}>

                                {!editState && <Button type="submit" >Create</Button>}
                                {editState && chatGroup?.data?.user == user._id &&
                                    <Button type="submit" >Update</Button>}
                            </div>
                        </div>

                    </form>
                    <div>
                        {editState &&
                            !chatGroup.isLoading && chatGroup?.data?.admins?.map((admin) => {
                                // console.log(admin._id, chatGroup.data.user)
                                if (admin?._id == chatGroup.data.user) {
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
                            !chatGroup.isLoading && chatGroup?.data?.admins?.map((admin, i) => {
                                if (admin?._id == chatGroup.data.user) {
                                    return null
                                }
                                return (<div className='flex flex-col gap-1 w-full bg-card' key={admin?._id}>
                                    <div className='flex items-center p-2 gap-2 relative w-full '>
                                        <div className='flex w-full gap-2'>
                                            <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                <Avatar >
                                                    <AvatarImage src={admin?.images?.profile} alt="Avatar" />
                                                    <AvatarFallback className='text-2xl'>{admin?.firstname[0]?.toUpperCase() + admin?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <div className='flex gap-2'>{admin?.firstname + " " + admin?.lastname}{chatGroup?.data?.user == admin._id &&
                                                    <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>owner</div>}{admin?.isAdmin && admin._id !== chatGroup?.data?.user &&
                                                        <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>admin</div>}</div>
                                                <div className='text-gray-400 text-sm'>@{admin?.username}</div>
                                            </div>
                                        </div>

                                        {chatGroup?.data?.isSuperAdmin && admin?._id !== chatGroup?.data?.user &&
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 bg-card p-2 rounded-md">
                                                        <span className="sr-only">Open menu</span>
                                                        <EllipsisVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md' >
                                                    <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' onClick={() => {
                                                        // console.log('admin remove')
                                                        groupMemberToggle.mutate({ userId: admin._id, type: "chatgroup" })

                                                    }}>
                                                        <RiUserUnfollowLine size={22} />
                                                        <span>Remove</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' onClick={() => {

                                                        groupAdminToggle.mutate({ user: admin, groupId: chatGroup.data?._id, isAdmin: true, index: i, isChatGroup: true })

                                                    }}>
                                                        <RiUserUnfollowLine size={22} />
                                                        <span>Remove as admin</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        }
                                    </div>
                                </div>
                                )
                            })
                        }

                        {!isLoading && data.map((page, pageIndex) => {
                            return page.members.map((memberData, userIndex) => {
                                if (memberData?.isAdmin) {
                                    // console.log('yes')
                                    return null
                                }
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
                                                    <div className='flex gap-2'>{memberData?.user?.firstname + " " + memberData?.user?.lastname}{chatGroup?.data?.isAdmin &&
                                                        <div className='p-0 flex items-center justify-center px-1 rounded-md text-xs bg-primary'>admin</div>}</div>
                                                    <div className='text-gray-400 text-sm'>@{memberData?.user?.username}</div>

                                                </div>
                                            </div>

                                            {chatGroup?.data?.isSuperAdmin &&
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 bg-card p-2 rounded-md">
                                                            <span className="sr-only">Open menu</span>
                                                            <EllipsisVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md'>
                                                        <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' onClick={() => {
                                                            groupMemberToggle.mutate({ userId: memberData.user._id, pageIndex, userIndex, type: "chatgroup", toggleState: 'remove' })
                                                            // socket.emit("toggleJoin", { userId: memberData.user._id, groupId: chatGroup.data._id, memberUsername: memberData.user.username, adminUsername: user.username })
                                                            // console.log('user remove')
                                                        }}  >
                                                            <RiUserUnfollowLine size={22} />
                                                            <span>Remove User</span>
                                                        </DropdownMenuItem>
                                                        {chatGroup?.data?.isSuperAdmin
                                                            &&
                                                            <DropdownMenuItem onClickCapture={() => {
                                                                groupAdminToggle.mutate({ user: memberData?.user, groupId: chatGroup?.data?._id, isChatGroup: true })
                                                            }} className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' >
                                                                <RiAdminLine size={22} />
                                                                <span>{data?.isAdmin ? "Remove as admin" : "Appoint as admin"}</span></DropdownMenuItem>
                                                        }
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }
                        )}

                    </div>
                    {editState && <div>
                        <Button onClick={() => setAddMemberState(true)}>
                            Add Friends
                        </Button>
                    </div>
                    }
                    {chatGroup?.data?.user !== user._id
                        &&
                        <div onClick={() => {
                            // socket.emit("toggleJoin", { userId: user._id, groupId: chatGroup.data._id, memberUsername: user.username, type: "leave" })
                                
                            setChatOpen(false)
                            navigate('', { replace: true })
                        }}>
                            <Button>Leave</Button>
                        </div>
                    }

                    {editState && addMemberState && <div className="absolute top-0 w-full h-full bg-background">
                        <div className="flex gap-2 p-2 py-4">
                            <ChevronLeft cursor="pointer" onClick={() => setAddMemberState(false)} />
                            <span>Add Friends</span>
                        </div>
                        {(userFriends?.data?.length == 0 || userFriends.data[0]?.friends?.length == 0) &&
                            <div className="flex items-center flex-col">

                                <svg width="340" height="240" viewBox="0 0 900 380" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path fill-rule="evenodd" clip-rule="evenodd" d="M285.12 141.988c-37.13 0-67.505 30.348-67.505 67.446s30.375 67.446 67.505 67.446c7.448 0 13.549 6.095 13.549 13.537 0 7.442-6.101 13.537-13.549 13.537h-35.323c-18.113 0-32.935 14.81-32.935 32.907 0 18.098 14.822 32.907 32.935 32.907 15.666 0 28.484 12.807 28.484 28.459 0 28.557 23.386 51.922 51.967 51.922h305.063c37.13 0 67.505-30.348 67.505-67.446s-30.375-67.446-67.505-67.446h-6.53c-7.448 0-13.549-6.088-13.549-13.537 0-7.443 6.093-13.538 13.549-13.538h43.954c18.113 0 32.935-14.809 32.935-32.906 0-18.075-14.784-32.869-32.867-32.907h-35.368c-15.666 0-28.484-12.807-28.484-28.459 0-28.557-23.385-51.922-51.967-51.922H285.12z" fill="url(#a)" /><rect x="196.575" y="233.005" width="167.656" height="163.739" rx="33.551" fill="#666AF6" /><rect x="279.738" y="365.259" width="35.446" height="35.446" rx="11.743" transform="rotate(45 279.738 365.259)" fill="#666AF6" /><path fill-rule="evenodd" clip-rule="evenodd" d="M324.276 351.096v6.372c0 3.517-2.833 6.372-6.324 6.372h-75.881c-3.491 0-6.324-2.855-6.324-6.372v-6.474c0-19.282 21.867-31.81 44.265-31.81 22.397 0 44.264 12.534 44.264 31.81m-29.145-78.43c8.567 8.873 8.567 23.258 0 32.131-8.566 8.873-22.456 8.873-31.022 0-8.567-8.873-8.567-23.258 0-32.131 8.566-8.872 22.456-8.872 31.022 0z" fill="#fff" /><rect x="371.96" y="113.956" width="167.656" height="163.739" rx="33.551" fill="#666AF6" /><rect x="455.122" y="246.21" width="35.446" height="35.446" rx="11.743" transform="rotate(45 455.122 246.21)" fill="#666AF6" /><path fill-rule="evenodd" clip-rule="evenodd" d="M499.66 232.046v6.373c0 3.517-2.833 6.372-6.323 6.372h-75.882c-3.49 0-6.323-2.855-6.323-6.372v-6.475c0-19.282 21.866-31.809 44.264-31.809 22.398 0 44.264 12.534 44.264 31.809m-29.145-78.429c8.567 8.873 8.567 23.258 0 32.131-8.566 8.872-22.455 8.872-31.022 0-8.567-8.873-8.567-23.258 0-32.131 8.567-8.872 22.456-8.872 31.022 0z" fill="#fff" /><rect x="371.96" y="311.254" width="167.656" height="163.739" rx="33.551" fill="#666AF6" /><rect x="455.122" y="443.507" width="35.446" height="35.446" rx="11.743" transform="rotate(45 455.122 443.507)" fill="#666AF6" /><path fill-rule="evenodd" clip-rule="evenodd" d="M499.66 429.344v6.372c0 3.517-2.833 6.372-6.323 6.372h-75.882c-3.49 0-6.323-2.855-6.323-6.372v-6.474c0-19.282 21.866-31.81 44.264-31.81 22.398 0 44.264 12.534 44.264 31.81m-29.145-78.43c8.567 8.873 8.567 23.258 0 32.131-8.566 8.873-22.455 8.873-31.022 0s-8.567-23.258 0-32.131c8.567-8.872 22.456-8.872 31.022 0z" fill="#fff" /><rect x="547.344" y="193.398" width="167.656" height="163.739" rx="33.551" fill="#666AF6" /><rect x="630.506" y="325.653" width="35.446" height="35.446" rx="11.743" transform="rotate(45 630.506 325.653)" fill="#666AF6" /><path fill-rule="evenodd" clip-rule="evenodd" d="M675.045 311.489v6.372c0 3.517-2.833 6.372-6.324 6.372H592.84c-3.491 0-6.324-2.855-6.324-6.372v-6.474c0-19.282 21.867-31.81 44.264-31.81 22.398 0 44.265 12.534 44.265 31.81M645.9 232.958c8.567 8.872 8.567 23.258 0 32.13-8.567 8.873-22.456 8.873-31.023 0-8.566-8.872-8.566-23.258 0-32.13 8.567-8.873 22.456-8.873 31.023 0z" fill="#fff" /><path fill-rule="evenodd" clip-rule="evenodd" d="M255.594 168.461v-32.18c0-3.334 2.695-6.034 6.021-6.034h36.127c3.327 0 6.022 2.7 6.022 6.034v32.18a6.035 6.035 0 0 1-3.098 5.274l-18.064 10.055a6.003 6.003 0 0 1-5.849 0l-18.064-10.055a6.04 6.04 0 0 1-3.095-5.274z" fill="#E1E4E5" /><path d="M269.667 156.857h20.025m-20.025-9.381h20.025m-20.025 18.492h20.025" stroke="#fff" stroke-width="3.094" stroke-linecap="round" stroke-linejoin="round" /><circle cx="324.753" cy="431.824" r="5.922" transform="rotate(105 324.753 431.824)" fill="#E1E4E5" /><circle cx="331.27" cy="209.181" r="5.922" transform="rotate(105 331.27 209.181)" fill="#E1E4E5" /><circle cx="192.253" cy="221.128" r="5.922" transform="rotate(105 192.253 221.128)" fill="#E1E4E5" /><circle cx="571.29" cy="175.513" r="5.922" transform="rotate(105 571.29 175.513)" fill="#E1E4E5" /><circle cx="575.635" cy="393.812" r="5.922" transform="rotate(105 575.635 393.812)" fill="#E1E4E5" /><path fill-rule="evenodd" clip-rule="evenodd" d="M651.83 413.803h-2.897c-.701 0-1.265-.57-1.265-1.264v-2.897c0-.701.57-1.265 1.265-1.265h2.897c.694 0 1.264.57 1.264 1.265v2.897a1.262 1.262 0 0 1-1.264 1.264zm-10.044 0h-2.897a1.27 1.27 0 0 1-1.265-1.264v-2.897c0-.701.57-1.265 1.265-1.265h2.897c.694 0 1.264.57 1.264 1.265v2.897a1.27 1.27 0 0 1-1.264 1.264zm-10.051 0h-2.897a1.27 1.27 0 0 1-1.264-1.264v-2.897c0-.701.57-1.265 1.264-1.265h2.897c.695 0 1.265.57 1.265 1.265v2.897a1.262 1.262 0 0 1-1.265 1.264zm-10.044 0h-2.897a1.27 1.27 0 0 1-1.264-1.264v-2.897c0-.701.57-1.265 1.264-1.265h2.897c.701 0 1.271.57 1.271 1.265v2.897a1.279 1.279 0 0 1-1.271 1.264zm-10.044 0h-2.897a1.27 1.27 0 0 1-1.271-1.264v-2.897c0-.701.57-1.265 1.271-1.265h2.897c.694 0 1.264.57 1.264 1.265v2.897a1.27 1.27 0 0 1-1.264 1.264zm29.77-10.952h-2.896a1.27 1.27 0 0 1-1.265-1.265v-2.903c0-.694.57-1.264 1.265-1.264h2.896c.701 0 1.265.57 1.265 1.264v2.897a1.263 1.263 0 0 1-1.265 1.271zm-10.044 0h-2.897a1.27 1.27 0 0 1-1.264-1.265v-2.903c0-.694.57-1.264 1.264-1.264h2.897c.695 0 1.265.57 1.265 1.264v2.897a1.263 1.263 0 0 1-1.265 1.271zm-10.044 0h-2.897c-.7 0-1.27-.57-1.27-1.265v-2.903c0-.694.57-1.264 1.27-1.264h2.897c.694 0 1.264.57 1.264 1.264v2.897a1.27 1.27 0 0 1-1.264 1.271zm10.406 22.718h-2.897a1.27 1.27 0 0 1-1.264-1.265v-2.896c0-.701.57-1.265 1.264-1.265h2.897c.695 0 1.265.57 1.265 1.265v2.896a1.262 1.262 0 0 1-1.265 1.265zm-10.044 0h-2.897a1.27 1.27 0 0 1-1.264-1.265v-2.896c0-.701.57-1.265 1.264-1.265h2.897c.701 0 1.271.57 1.271 1.265v2.896a1.279 1.279 0 0 1-1.271 1.265z" fill="#E1E4E5" /><rect x="325.103" y="179.782" width="31.655" height="3.688" rx="1.844" transform="rotate(-45 325.103 179.782)" fill="#E1E4E5" /><rect x="337.239" y="179.869" width="11.754" height="3.688" rx="1.844" transform="rotate(-45 337.239 179.869)" fill="#E1E4E5" /><rect x="276.241" y="431.61" width="31.655" height="3.688" rx="1.844" transform="rotate(135 276.241 431.61)" fill="#E1E4E5" /><rect x="264.104" y="431.523" width="11.754" height="3.688" rx="1.844" transform="rotate(135 264.104 431.523)" fill="#E1E4E5" /><rect x="650.934
" y="153.578" width="31.655" height="3.688" rx="1.844" transform="rotate(135 650.934 153.578)" fill="#E1E4E5" /><rect x="638.797" y="153.491" width="11.754" height="3.688" rx="1.844" transform="rotate(135 638.797 153.491)" fill="#E1E4E5" /><defs><linearGradient id="a" x1="471.688" y1="622.922" x2="465.697" y2="-193.306" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                                <span>No Friends</span>
                            </div>

                        }

                        {!userFriends.isLoading && userFriends.data?.map((page, pageIndex) => {
                            return page.friends.map((friend, userIndex) => {
                                friend = friend.friend
                                return (
                                    <div className='flex flex-col gap-1 w-full bg-card'>
                                        <div className='flex items-center p-2 gap-2 relative w-full '>
                                            <div className='flex w-full gap-2'>
                                                <div className='w-16 h-16  rounded-lg flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                    <Avatar >
                                                        <AvatarImage src={friend?.images?.profile} alt="Avatar" />
                                                        <AvatarFallback className='text-2xl'>{friend?.firstname[0]?.toUpperCase() + friend?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <div className=''>{friend?.firstname + " " + friend?.lastname}</div>
                                                    <div className='text-gray-400 text-sm'>@{friend?.username}</div>

                                                </div>
                                            </div>
                                            <div>
                                                {friend.isGroupMember ? <span className="p-3 bg-card border border-accent">Member</span> :
                                                    <Button onClick={() => {

                                                        groupMemberToggle.mutate({ userId: friend._id, pageIndex, userIndex, type: "chatgroup", toggleState: 'add' })
                                                        // socket.emit("toggleJoin", { userId: friend._id, groupId: chatGroup.data._id, memberUsername: friend.username, adminUsername: user.username })
                                                        // console.log('adding')
                                                    }}>
                                                        Add
                                                    </Button>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        })}
                    </div>
                    }

                </div>
            </div>
        </div>
    )
}

export default memo(CreateChatGroup)