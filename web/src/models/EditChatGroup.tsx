import { axiosClient } from "@/api/axiosClient"
import { useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Label } from "@radix-ui/react-dropdown-menu"
import { Camera} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client"

function EditChatGroup({ setModelTrigger, groupDetails }) {
    const { socket } = useAppSelector((data) => data.socket) as { socket: Socket }
    const { user } = useAppSelector((data) => data.user)
    let [imageSrc, setImageSrc] = useState(undefined)
    let [imageType, setImageType] = useState(undefined)
    let [coverImage, SetCoverImage] = useState(undefined)
    let [imageUpload, setImageUpload] = useState(undefined)
    const [members, setMembers] = useState([])
    const [friendsData, setFriendsData] = useState([])
    const [removedMembers, setRemovedMembers] = useState([])

    let uploadImage = async (croppedImage, imageType) => {
        let formData = new FormData();
        formData.append("file", croppedImage)
        formData.append("data", JSON.stringify({ userDetails: { username: user?.username } }))


        let { data } = await axiosClient.post("upload/single", formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        if (imageType == "cover") {
            SetCoverImage(data)
        } else {
            setImageSrc(data)
        }
        return data
    }
    const groupName = useRef<HTMLInputElement>()
    const groupDescription = useRef<HTMLInputElement>()

    useEffect(() => {
        let getFriends = async () => {
            const { data } = await axiosClient.get("user/friends")
            setFriendsData(data.friends.friends)
        }
        getFriends()
        const getGroup = async () => {
            const { data } = await axiosClient.get("chatgroups/group?id=" + groupDetails?.groupId)
            if (data) {
                setMembers(data?.members)
            }
        }
        getGroup()
    }, [])

    const [addMemberState, setAddMemberState] = useState(false)

    const addMember = async (userId) => {
        socket.emit("joingroup", { userId, groupId: groupDetails?.groupId })
    }


    const removeMember = async (userId) => {
        socket.emit("leavegroup", { userId, groupId: groupDetails?.groupId })
    }



    return (
        <div className='absolute top-0 right-0 w-screen z-10 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 opacity-15  bg-foreground w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>
            <div className='relative z-10 w-fit bg-background rounded-lg shadow-xl h-fit overflow-auto'>
                {addMemberState && 
                
                <div className="absolute z-20 w-full h-full bg-background">
                    <div>Add Members</div>
                    {friendsData && friendsData?.map((friend) => {
                        if (members?.includes(friend?._id)) {
                            return null
                        }
                        return (

                            <div className='flex flex-col gap-1 w-full bg-card'>
                                <div className='flex items-center p-2 gap-2 relative w-full '>
                                    <div className='flex w-full gap-2'>
                                        <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
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
                                        <Button type="button" onClick={() => {
                                            addMember(friend?._id)
                                        }}>Add</Button>
                                    </div>

                                </div>
                            </div>
                        )
                    })}


                </div>}
                <div className="flex flex-col gap-2 p-4  overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        <div className='w-28 h-28 rounded-xl border-primary border-2 overflow-hidden'>

                            <form className='image-upload_form'>
                                <label htmlFor="image-profile" className="cursor-pointer">
                                    <div className="flex items-center justify-center w-28 h-28 bg-muted">
                                        {imageSrc && imageType == "profile" ?
                                            <img className='w-full' onClick={() => {
                                            }} src={imageSrc} alt="" />
                                            :
                                            <Camera size={42} />

                                        }
                                    </div>

                                </label>
                                <input className="hidden" type="file" accept='image/*' id='image-profile' onChange={async (e) => {
                                    setImageSrc(URL.createObjectURL(e.target.files[0]))
                                    setImageUpload(e.target.files[0])
                                    setImageType("profile")

                                }} />
                            </form>

                        </div>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault()
                        let profile;
                        if (imageUpload) {
                            let data = await uploadImage(imageUpload, imageType)
                            profile = data

                        }
                        const groupDetails = {
                            name: groupName?.current?.value,
                            profile,
                            description: groupDescription?.current?.value
                        }

                        let { data } = await axiosClient.post("/chatgroups/create", { groupDetails })
                        console.log(data)

                        setModelTrigger(false)
                    }}>
                        <div className="w-full p-2 flex flex-col gap-8 items-center">
                            <div classNgnome-terminalame="flex flex-col w-full justify-center gap-2 mt-10">
                                <div className="flex gap-4">
                                    <div>
                                        <Label >
                                            Name
                                        </Label>
                                        <Input
                                            ref={groupName}
                                            defaultValue={groupDetails?.name}
                                            id="firstname"
                                            className="w-96"
                                            placeholder="write group name"
                                        />
                                    </div>
                                </div>


                                <div >
                                    <div>
                                        <Label >
                                            Description
                                        </Label>
                                        <Input
                                            ref={groupDescription}
                                            defaultValue={groupDetails?.description}
                                            id="bio"
                                            className="w-96"
                                            placeholder="write group description"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='w-full flex items-start'>
                                <Button type="button" onClick={() => {
                                    setAddMemberState(true)
                                }}>Add Members</Button>
                            </div>
                            <div className="w-full">
                                <div>Members</div>
                                {
                                    members?.length > 0 ? members?.map((member) => {
                                        return (

                                            <div className='flex flex-col gap-1 w-full bg-card'>
                                                <div className='flex items-center p-2 gap-2 relative w-full '>
                                                    <div className='flex w-full gap-2'>
                                                        <div className='w-16 h-16  rounded-md flex items-center justify-center  border-primary border-2 overflow-hidden'>
                                                            <Avatar >
                                                                <AvatarImage src={member?.images?.profile} alt="Avatar" />
                                                                <AvatarFallback className='text-2xl'>{member?.firstname[0]?.toUpperCase() + member?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                        <div className="flex flex-col justify-center">
                                                            <div className=''>{member?.firstname + " " + member?.lastname}</div>
                                                            <div className='text-gray-400 text-sm'>@{member?.username}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Button disabled={removedMembers?.includes(member?._id)} type="button" onClick={() => {
                                                            setRemovedMembers([...removedMembers, member?._id])
                                                            removeMember(member?._id)
                                                        }}>{removedMembers?.includes(member?._id)? "Removed": "Remove"}</Button>
                                                    </div>

                                                </div>
                                            </div>
                                        )
                                    }) :
                                        <div>no members</div>
                                }

                            </div>

                            <div className="w-full flex justify-end ">

                                <Button type="submit">Save</Button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}

export default EditChatGroup