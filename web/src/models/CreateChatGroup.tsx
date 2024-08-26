import { useAppSelector } from "@/app/hooks"
import ImageCropper from "@/components/ImageCropper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useChatGroup, useGroupMemberToggle } from "@/hooks/Chat/main"
import { useGroupMembers, useToggleAdmin } from "@/hooks/useGroup"
import { useUserFriends } from "@/hooks/User/useUser"
import { ChatGroupCreate } from "@/utils/schemas/auth"
import { yupResolver } from "@hookform/resolvers/yup"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Label } from "@radix-ui/react-dropdown-menu"
import { Camera, ChevronLeft, EllipsisVertical } from "lucide-react"
import { FC, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { RiAdminLine, RiUserUnfollowLine } from "react-icons/ri"


const CreateChatGroup: FC<any> = ({ currentTab, setCurrentTab, setModelTrigger, createGroup, editGroup, editState, groupDetails }) => {

    let [imageSrc, setImageSrc] = useState(null)
    let [coverImage, SetCoverImage] = useState(null)
    let [imageUpload, setImageUpload] = useState(null)
    let [coverImageUpload, setCoverImageUpload] = useState(null)
    let [cropperModel, setCropperModel] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(ChatGroupCreate),
        mode: 'onChange',
    });

    console.log(groupDetails)
    const groupName = useRef<HTMLInputElement>()
    const groupDescription = useRef<HTMLTextAreaElement>()

    const onSubmit = async (groupData) => {
        console.log(groupData)
        if (editState) {
            editGroup({ groupData, imageUpload, coverImageUpload })
            return
        }
        createGroup(groupData, imageUpload, coverImageUpload)
    }
    const { user } = useAppSelector(state => state.user)

    const userFriends = useUserFriends(user._id, groupDetails?.groupId)
    console.log(groupDetails)
    
    const [addMemberState, setAddMemberState] = useState(false)
    const { data, isLoading } = useGroupMembers(groupDetails?.groupId)
    const groupMemberToggle = useGroupMemberToggle(user._id, groupDetails?.groupId)
    const groupAdminToggle = useToggleAdmin()
    const chatGroup = editState ? useChatGroup(groupDetails?.groupId) : {}

    return (
        <div className='absolute top-0 right-0 w-screen z-10 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
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
                                    setCurrentTab("groups")
                                }
                            }}>
                                <Button type="submit">{editState ? "Update" : "Create"}</Button>
                            </div>
                        </div>

                    </form>
                    <div>
                        {editState &&
                            !chatGroup.isLoading && chatGroup?.data?.admins?.map((admin) => {
                                console.log(admin._id, chatGroup.data.user)
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
                                                        console.log('admin remove')
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
                                    console.log('yes')
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
                                                        <DropdownMenuItem className='cursor-pointer hover:bg-accent flex gap-2 p-2 items-center' >
                                                            <RiUserUnfollowLine size={22} onClick={() => {
                                                                groupMemberToggle.mutate({ userId: memberData.user._id, pageIndex, userIndex, type: "chatgroup" })
                                                                console.log('user remove')

                                                            }} />
                                                            <span>Remove</span>
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

                    {editState && addMemberState && <div className="absolute top-0 w-full h-full bg-background">
                        <div className="flex gap-2 p-2 py-4">
                            <ChevronLeft cursor="pointer" onClick={() => setAddMemberState(false)} />
                            <span>Add Friends</span>
                        </div>
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
                                                        groupMemberToggle.mutate({ userId: friend._id, pageIndex, userIndex, type: "chatgroup" })
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

export default CreateChatGroup