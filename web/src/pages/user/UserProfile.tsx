// import SettingsModel from '@/admin/models/SettingsModel'
// import { axiosClient } from '@/api/axiosClient'
// import { loginSuccess } from '@/app/features/user/authSlice'
// import { setSearch } from '@/app/features/user/searchSlice'
// import { useAppDispatch, useAppSelector } from '@/app/hooks'
// import HelperMessage from '@/components/HelperMessage'
// import Post from '@/components/Post'
// import Cover from '@/components/profile/Cover'
// import CustomTabList from '@/components/profile/CustomTabList'
// import Profile from '@/components/profile/Profile'
// import ProfileMedia from '@/components/ProfileMedia'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import CPostModal from '@/models/CPostModal'
// import QuickSettings from '@/models/QuickSettings'
// import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
// import { Edit, EllipsisVertical, PencilIcon } from 'lucide-react'
// import { useEffect, useRef, useState } from 'react'
// import { useParams } from 'react-router-dom'

// function UserProfile() {

//     const params = useParams()
//     const [activeTab, setActiveTab] = useState("posts")
//     const postContent = useRef()
//     const [profileSettingsModel, setProfileSettingsModel] = useState(false)
//     const [postModal, setPostModal] = useState(false)
//     const { user } = useAppSelector(state => state.user)
//     const [userData, setUser] = useState({ username: "", firstname: "", lastname: "", email: "", images: {}, _id: "" })
//     const { firstname, lastname, username, email, images, _id, sentRequests, recievedRequests, friends } = userData
//     const [posts, setPosts] = useState([])
//     const [requestState, setRequestState] = useState(false)
//     const [requestStatus, setRequestStatus] = useState()
//     const [followers, setFollowers] = useState([])
//     const dispatch = useAppDispatch()
//     const tabList = [{ value: "posts", name: "Posts" }, { value: "friends", name: "Friends" }, { value: "followers", name: "Followers" }, { value: "media", name: "Media" }, { value: "about", name: "About" }]

//     useEffect(() => {
//         let getUser = async () => {
//             const { data } = await axiosClient.get(`/user?username=${params?.username}`)
//             setUser(data)
//         }

//         getUser()


//         let getPosts = async () => {
//             const { data } = await axiosClient.get("/posts?type=user&&username=" + params?.username)
//             let posts = data.reverse()
//             console.log(posts)
//             setPosts(posts)
//         }

//         getPosts()

//         let getFollowers = async () => {
//             const { data } = await axiosClient.get("user/followers?username=" + params.username)
//             setFollowers(data.followers)
//         }
//         getFollowers()

//     }, [params, requestState])

//     return (
//         <div className='w-full flex flex-col overflow-y-auto border-muted'>
//             {profileSettingsModel && <QuickSettings setModelTrigger={setProfileSettingsModel} />}
//             {postModal && <CPostModal setModelTrigger={setPostModal} />}
//             <div className='flex w-full flex-col items-center w-ful'>
//                 <div className="flex max-w-5xl w-full flex-col justify-cente relative">
//                     <Cover cover={userData?.images?.cover} />
//                     <div className='flex-responsive gap-2 relative pl-4 sm:pl10 left max-w-[90%] sm:w-full bottom-6'>
//                         <Profile image={userData?.images?.profile} fallbackName={userData?.firstname[0]?.toUpperCase() + userData?.lastname[0]?.toUpperCase()} width={'w-24'} smWidth={'w-32'} height={'h-24'} smHeight={'h-32'} />
//                         <div className='flex gap-4'>
//                             <div className='pl-1 lg:pl-0 lg:pt-8'>
//                                 <div className='flex flex-col'>
//                                     <div className='leading-3'>{firstname} {lastname}</div>
//                                     <div className='text-gray-400 text-sm'>@{username}</div>
//                                 </div>
//                                 <div>
//                                     <p className='leading-tight text-sm'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis, sapiente tempore! Voluptatem.</p>
//                                 </div>
//                                 <div className='flex flex-col text-sm'>
//                                     <span>Karachi, Pakistan</span>

//                                     <span>{friends?.length > 0 && (friends?.length == 1 ? friends?.length + " friend" : friends?.length + " friends")} {friends?.length > 0 && followers?.length > 0 && ","} {followers?.length == 1 ? followers?.length + " follower" : followers?.length + " followers"}</span>
//                                 </div>
//                             </div>
                            
//                             {user?.friends?.includes(_id) &&
//                                 <Button>Friends</Button>
//                             }
//                             {
//                                 user?.username !== username &&
//                                 <div>


//                                     {user?.sentRequests?.includes(_id) &&

//                                         <Button onClick={async () => {

//                                             const { data } = await axiosClient.post("/user/friendrequest", { friendRequestDetails: { username } })
//                                         }}>Cancel</Button>
//                                     }
//                                     {user?.recievedRequests?.includes(_id) &&
//                                         <Button onClick={async () => {
//                                             const { data } = await axiosClient.post("user/acceptrequest", { requestDetails: { username } })
//                                             if (data.success) {
//                                                 dispatch(loginSuccess(data.user))
//                                             }
//                                         }}>Accept</Button>
//                                     }

//                                     {
//                                         !user?.recievedRequests?.includes(_id) && !user?.sentRequests?.includes(_id) && !user?.friends?.includes(_id) &&
//                                         <Button onClick={async () => {
//                                             const { data } = await axiosClient.post("/user/friendrequest", { friendRequestDetails: { username } })
//                                             if (data.success) {
//                                                 dispatch(loginSuccess(data.user))
//                                             }
//                                         }}>Add Friend</Button>
//                                     }
//                                 </div>

//                             }
//                         </div>
//                         <div>
//                         </div>
//                     </div>
//                     <Tabs defaultValue="posts">
//                         <CustomTabList list={tabList} minWidth={306} maxWidth={80} />
//                         <TabsContent value="posts" className="">
//                             <div className='flex-responsive w-full items-center md:items-start p-2 flex gap-2  border-muted'>
//                                 <div className='max-w-xl w-full flex flex-col gap-2 '>
//                                     <div className='flex w-full items-center z-50 flex-col gap-2 '>
//                                         {posts?.map((post) => (
//                                             <Post postData={post} profile={userData?.images?.profile} username={username} userId={user?._id} />
//                                         ))}


//                                         {posts?.length == 0 &&
//                                             <HelperMessage message={username + " does not have any public posts"} svg={
//                                                 <svg width="180" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="M705.499 375.559h-49.367c-12.097 0-22.231-8.232-22.231-18.659 0-5.213 2.615-9.878 6.538-13.171 3.923-3.292 9.481-5.488 15.693-5.488h7.193c6.211 0 11.769-2.195 15.692-5.488 3.924-3.292 6.539-7.957 6.539-13.17 0-10.153-9.808-18.659-22.231-18.659H512.54c-3.939 0-6.471-4.842-6.471-8.781 0-9.878-9.481-17.836-21.251-17.836h-56.112a5.35 5.35 0 1 1 0-10.701h215.003c9.481 0 18.308-3.293 24.52-8.506 6.211-5.214 10.135-12.622 10.135-20.58 0-16.189-15.693-29.086-34.655-29.086H532.662c-17.423 0-34.67-13.445-52.094-13.445h-62c-9.093 0-16.464-7.371-16.464-16.464 0-9.092 7.371-16.463 16.464-16.463h138.83c6.539 0 12.75-2.196 17-5.763 4.251-3.567 6.866-8.506 6.866-14.268 0-10.976-10.789-20.031-23.866-20.031H237.329c-6.538 0-12.75 2.195-17 5.762-4.25 3.567-6.866 8.507-6.866 14.269 0 10.976 10.789 20.031 23.866 20.031h8.174c10.788 0 19.943 7.408 19.943 16.738 0 4.664-2.289 8.78-5.885 11.799-3.596 3.018-8.5 4.939-14.058 4.939h-39.559c-6.866 0-13.405 2.469-17.982 6.311-4.577 3.841-7.519 9.055-7.519 15.092 0 11.799 11.442 21.128 25.174 21.128h40.213c13.077 0 23.866 9.055 23.866 20.031 0 5.488-2.616 10.427-6.866 13.994s-10.135 5.762-16.674 5.762h-35.962c-5.885 0-11.116 1.921-15.039 5.214-3.923 3.292-6.212 7.683-6.212 12.622 0 9.878 9.481 17.836 21.251 17.836h29.097c16.674 0 30.078 11.25 30.078 25.244 0 6.86-3.27 13.445-8.827 17.835-5.558 4.665-13.078 7.409-21.251 7.409h-40.54c-8.173 0-15.693 2.744-20.924 7.409-5.558 4.39-8.827 10.701-8.827 17.561 0 13.72 13.404 24.97 29.751 24.97h125.18c13.825 0 27.405 7.683 41.23 7.683h22.8c8.714 0 15.778 7.064 15.778 15.778 0 8.713-7.064 15.777-15.778 15.777h-55.494c-7.192 0-13.404 2.47-17.981 6.311-4.577 3.842-7.52 9.33-7.52 15.092 0 11.799 11.443 21.403 25.501 21.403h340.012c7.192 0 13.404-2.47 17.981-6.311 4.577-3.842 7.52-9.33 7.52-15.092 0-11.799-11.443-21.403-25.501-21.403h-10.135c-10.462 0-18.635-7.134-18.635-15.64 0-4.39 1.961-8.232 5.557-10.976 3.27-2.744 8.174-4.665 13.405-4.665h42.828c7.193 0 13.404-2.469 17.982-6.311 4.577-3.841 7.519-9.329 7.519-15.091 0-12.348-11.443-21.952-25.501-21.952z" fill="url(#a)" /><path d="M596 169.612v285.435C596 475.869 579.137 493 558.059 493h-12.383c-7.641 0-13.965-4.217-19.234-9.752-8.432-9.224-12.911-21.348-12.911-33.999v-32.945c0-13.178-10.803-23.984-23.977-23.984H337V169.612c0-11.86 9.749-21.612 21.605-21.612h215.79c12.12 0 21.605 9.752 21.605 21.612z" fill="#1b374c" /><path d="M535 512H295.002C267.995 512 246 490.285 246 463.623v-31.61C246 418.27 257.415 407 271.336 407h204.639c13.921 0 25.336 11.27 25.336 25.013v34.359c0 12.919 4.733 25.837 13.643 35.458C520.244 507.602 526.926 512 535 512z" fill="#1b374c" /><circle cx="396.5" cy="224.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="274.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="324.5" r="15.5" fill="#fff" /><rect x="431" y="209" width="123" height="31" rx="15.5" fill="#fff" /><rect x="431" y="259" width="123" height="32" rx="16" fill="#fff" /><rect x="431" y="309" width="123" height="31" rx="15.5" fill="#fff" /><defs><linearGradient id="a" x1="461.983" y1="702.686" x2="454.308" y2="-287.923" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
//                                             } />
//                                         }
//                                     </div>
//                                 </div>
//                                 <Card className='flex sticky top-2 flex-col h-fit gap-1 p-3'>
//                                     <div>Media</div>
//                                     <div className='flex flex-col gap-2'>
//                                         <div className='flex gap-2'>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                         </div>
//                                         <div className='flex gap-2'>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                         </div>
//                                         <div className='flex gap-2'>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                             <div className='max-w-24 max-h-24 rounded-md  overflow-hidden'>
//                                                 <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </Card>

//                             </div>
//                         </TabsContent>
//                         <TabsContent value="friends" className="">
//                         <div className='flex-responsive w-full items-center md:items-start p-2 flex gap-2 border-muted'>
//                                 <div className='max-w-xl w-full flex flex-col gap-2 '>
//                                     <div className='flex w-full items-center  flex-col gap-2 '>
//                                         {!friends && friends?.map((friend) => {
//                                             return (

//                                                 <div className='flex flex-col gap-1 w-full bg-card'>
//                                                     <div className='flex-responsive items-center p-2 gap-2 relative w-full '>
//                                                         <div className='flex w-full gap-2'>
//                                                             <div className='w-16 h-16  rounded-lg flex items-center justify-center  border-primary border-2 overflow-hidden'>
//                                                                 <Avatar >
//                                                                     <AvatarImage src={friend?.images?.profile} alt="Avatar" />
//                                                                     <AvatarFallback className='text-2xl'>{friend?.firstname[0]?.toUpperCase() + friend?.lastname[0]?.toUpperCase()}</AvatarFallback>
//                                                                 </Avatar>
//                                                             </div>
//                                                             <div className="flex flex-col justify-center">
//                                                                 <div className=''>{friend?.firstname + " " + friend?.lastname}</div>
//                                                                 <div className='text-gray-400 text-sm'>@{friend?.username}</div>

//                                                             </div>
//                                                         </div>
//                                                         <DropdownMenu>
//                                                             <DropdownMenuTrigger asChild>
//                                                                 <Button variant="ghost" className="h-8 w-8 bg-card p-2 rounded-md">
//                                                                     <span className="sr-only">Open menu</span>
//                                                                     <EllipsisVertical className="h-4 w-4" />
//                                                                 </Button>
//                                                             </DropdownMenuTrigger>
//                                                             <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
//                                                                 <DropdownMenuItem onClick={async () => {
//                                                                     const { data } = await axiosClient.post("user/removefriend", { friendDetails: { username: friend?.username } })
//                                                                     console.log(data)
//                                                                 }}>Remove</DropdownMenuItem>
//                                                             </DropdownMenuContent>
//                                                         </DropdownMenu>
//                                                     </div>
//                                                 </div>
//                                             )
//                                         })}

//                                         {friends?.length == 0 &&
//                                             <HelperMessage message={"you don't have friends"} svg={
//                                                 <svg width="180" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="M705.499 375.559h-49.367c-12.097 0-22.231-8.232-22.231-18.659 0-5.213 2.615-9.878 6.538-13.171 3.923-3.292 9.481-5.488 15.693-5.488h7.193c6.211 0 11.769-2.195 15.692-5.488 3.924-3.292 6.539-7.957 6.539-13.17 0-10.153-9.808-18.659-22.231-18.659H512.54c-3.939 0-6.471-4.842-6.471-8.781 0-9.878-9.481-17.836-21.251-17.836h-56.112a5.35 5.35 0 1 1 0-10.701h215.003c9.481 0 18.308-3.293 24.52-8.506 6.211-5.214 10.135-12.622 10.135-20.58 0-16.189-15.693-29.086-34.655-29.086H532.662c-17.423 0-34.67-13.445-52.094-13.445h-62c-9.093 0-16.464-7.371-16.464-16.464 0-9.092 7.371-16.463 16.464-16.463h138.83c6.539 0 12.75-2.196 17-5.763 4.251-3.567 6.866-8.506 6.866-14.268 0-10.976-10.789-20.031-23.866-20.031H237.329c-6.538 0-12.75 2.195-17 5.762-4.25 3.567-6.866 8.507-6.866 14.269 0 10.976 10.789 20.031 23.866 20.031h8.174c10.788 0 19.943 7.408 19.943 16.738 0 4.664-2.289 8.78-5.885 11.799-3.596 3.018-8.5 4.939-14.058 4.939h-39.559c-6.866 0-13.405 2.469-17.982 6.311-4.577 3.841-7.519 9.055-7.519 15.092 0 11.799 11.442 21.128 25.174 21.128h40.213c13.077 0 23.866 9.055 23.866 20.031 0 5.488-2.616 10.427-6.866 13.994s-10.135 5.762-16.674 5.762h-35.962c-5.885 0-11.116 1.921-15.039 5.214-3.923 3.292-6.212 7.683-6.212 12.622 0 9.878 9.481 17.836 21.251 17.836h29.097c16.674 0 30.078 11.25 30.078 25.244 0 6.86-3.27 13.445-8.827 17.835-5.558 4.665-13.078 7.409-21.251 7.409h-40.54c-8.173 0-15.693 2.744-20.924 7.409-5.558 4.39-8.827 10.701-8.827 17.561 0 13.72 13.404 24.97 29.751 24.97h125.18c13.825 0 27.405 7.683 41.23 7.683h22.8c8.714 0 15.778 7.064 15.778 15.778 0 8.713-7.064 15.777-15.778 15.777h-55.494c-7.192 0-13.404 2.47-17.981 6.311-4.577 3.842-7.52 9.33-7.52 15.092 0 11.799 11.443 21.403 25.501 21.403h340.012c7.192 0 13.404-2.47 17.981-6.311 4.577-3.842 7.52-9.33 7.52-15.092 0-11.799-11.443-21.403-25.501-21.403h-10.135c-10.462 0-18.635-7.134-18.635-15.64 0-4.39 1.961-8.232 5.557-10.976 3.27-2.744 8.174-4.665 13.405-4.665h42.828c7.193 0 13.404-2.469 17.982-6.311 4.577-3.841 7.519-9.329 7.519-15.091 0-12.348-11.443-21.952-25.501-21.952z" fill="url(#a)" /><path d="M596 169.612v285.435C596 475.869 579.137 493 558.059 493h-12.383c-7.641 0-13.965-4.217-19.234-9.752-8.432-9.224-12.911-21.348-12.911-33.999v-32.945c0-13.178-10.803-23.984-23.977-23.984H337V169.612c0-11.86 9.749-21.612 21.605-21.612h215.79c12.12 0 21.605 9.752 21.605 21.612z" fill="#1b374c" /><path d="M535 512H295.002C267.995 512 246 490.285 246 463.623v-31.61C246 418.27 257.415 407 271.336 407h204.639c13.921 0 25.336 11.27 25.336 25.013v34.359c0 12.919 4.733 25.837 13.643 35.458C520.244 507.602 526.926 512 535 512z" fill="#1b374c" /><circle cx="396.5" cy="224.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="274.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="324.5" r="15.5" fill="#fff" /><rect x="431" y="209" width="123" height="31" rx="15.5" fill="#fff" /><rect x="431" y="259" width="123" height="32" rx="16" fill="#fff" /><rect x="431" y="309" width="123" height="31" rx="15.5" fill="#fff" /><defs><linearGradient id="a" x1="461.983" y1="702.686" x2="454.308" y2="-287.923" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
//                                             } />
//                                         }
//                                     </div>
//                                 </div>
//                                 {/* <ProfileMedia media={media} setMediaModelDetails={setMediaModelDetails} /> */}
//                             </div>
//                         </TabsContent>
//                         <TabsContent value="followers" className="">
//                             <div className='flex-responsive w-full items-center md:items-start p-2 flex gap-2 border-muted'>
//                                 <div className='max-w-xl w-full flex flex-col gap-2 '>
//                                     <div className='flex w-full items-center  flex-col gap-2 '>
//                                         {followers && followers?.map((follower) => {
//                                             console.log(follower.images)
//                                             return (

//                                                 <div className='flex flex-col gap-1 w-full bg-card'>
//                                                     <div className='flex-responsive items-center p-2 gap-2 relative w-full '>
//                                                         <div className='flex w-full gap-2'>
//                                                             <div className='w-16 h-16  rounded-lg flex items-center justify-center  border-primary border-2 overflow-hidden'>
//                                                                 <Avatar >
//                                                                     <AvatarImage src={follower?.images?.profile} alt="Avatar" />
//                                                                     <AvatarFallback className='text-2xl'>{follower?.firstname[0]?.toUpperCase() + follower?.lastname[0]?.toUpperCase()}</AvatarFallback>
//                                                                 </Avatar>
//                                                             </div>
//                                                             <div className="flex flex-col justify-center">
//                                                                 <div className=''>{follower?.firstname + " " + follower?.lastname}</div>
//                                                                 <div className='text-gray-400 text-sm'>@{follower?.username}</div>

//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             )
//                                         })}

//                                         {followers?.length == 0 &&
//                                             <HelperMessage message={"you don't have followers"} svg={
//                                                 <svg width="180" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="M705.499 375.559h-49.367c-12.097 0-22.231-8.232-22.231-18.659 0-5.213 2.615-9.878 6.538-13.171 3.923-3.292 9.481-5.488 15.693-5.488h7.193c6.211 0 11.769-2.195 15.692-5.488 3.924-3.292 6.539-7.957 6.539-13.17 0-10.153-9.808-18.659-22.231-18.659H512.54c-3.939 0-6.471-4.842-6.471-8.781 0-9.878-9.481-17.836-21.251-17.836h-56.112a5.35 5.35 0 1 1 0-10.701h215.003c9.481 0 18.308-3.293 24.52-8.506 6.211-5.214 10.135-12.622 10.135-20.58 0-16.189-15.693-29.086-34.655-29.086H532.662c-17.423 0-34.67-13.445-52.094-13.445h-62c-9.093 0-16.464-7.371-16.464-16.464 0-9.092 7.371-16.463 16.464-16.463h138.83c6.539 0 12.75-2.196 17-5.763 4.251-3.567 6.866-8.506 6.866-14.268 0-10.976-10.789-20.031-23.866-20.031H237.329c-6.538 0-12.75 2.195-17 5.762-4.25 3.567-6.866 8.507-6.866 14.269 0 10.976 10.789 20.031 23.866 20.031h8.174c10.788 0 19.943 7.408 19.943 16.738 0 4.664-2.289 8.78-5.885 11.799-3.596 3.018-8.5 4.939-14.058 4.939h-39.559c-6.866 0-13.405 2.469-17.982 6.311-4.577 3.841-7.519 9.055-7.519 15.092 0 11.799 11.442 21.128 25.174 21.128h40.213c13.077 0 23.866 9.055 23.866 20.031 0 5.488-2.616 10.427-6.866 13.994s-10.135 5.762-16.674 5.762h-35.962c-5.885 0-11.116 1.921-15.039 5.214-3.923 3.292-6.212 7.683-6.212 12.622 0 9.878 9.481 17.836 21.251 17.836h29.097c16.674 0 30.078 11.25 30.078 25.244 0 6.86-3.27 13.445-8.827 17.835-5.558 4.665-13.078 7.409-21.251 7.409h-40.54c-8.173 0-15.693 2.744-20.924 7.409-5.558 4.39-8.827 10.701-8.827 17.561 0 13.72 13.404 24.97 29.751 24.97h125.18c13.825 0 27.405 7.683 41.23 7.683h22.8c8.714 0 15.778 7.064 15.778 15.778 0 8.713-7.064 15.777-15.778 15.777h-55.494c-7.192 0-13.404 2.47-17.981 6.311-4.577 3.842-7.52 9.33-7.52 15.092 0 11.799 11.443 21.403 25.501 21.403h340.012c7.192 0 13.404-2.47 17.981-6.311 4.577-3.842 7.52-9.33 7.52-15.092 0-11.799-11.443-21.403-25.501-21.403h-10.135c-10.462 0-18.635-7.134-18.635-15.64 0-4.39 1.961-8.232 5.557-10.976 3.27-2.744 8.174-4.665 13.405-4.665h42.828c7.193 0 13.404-2.469 17.982-6.311 4.577-3.841 7.519-9.329 7.519-15.091 0-12.348-11.443-21.952-25.501-21.952z" fill="url(#a)" /><path d="M596 169.612v285.435C596 475.869 579.137 493 558.059 493h-12.383c-7.641 0-13.965-4.217-19.234-9.752-8.432-9.224-12.911-21.348-12.911-33.999v-32.945c0-13.178-10.803-23.984-23.977-23.984H337V169.612c0-11.86 9.749-21.612 21.605-21.612h215.79c12.12 0 21.605 9.752 21.605 21.612z" fill="#1b374c" /><path d="M535 512H295.002C267.995 512 246 490.285 246 463.623v-31.61C246 418.27 257.415 407 271.336 407h204.639c13.921 0 25.336 11.27 25.336 25.013v34.359c0 12.919 4.733 25.837 13.643 35.458C520.244 507.602 526.926 512 535 512z" fill="#1b374c" /><circle cx="396.5" cy="224.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="274.5" r="15.5" fill="#fff" /><circle cx="396.5" cy="324.5" r="15.5" fill="#fff" /><rect x="431" y="209" width="123" height="31" rx="15.5" fill="#fff" /><rect x="431" y="259" width="123" height="32" rx="16" fill="#fff" /><rect x="431" y="309" width="123" height="31" rx="15.5" fill="#fff" /><defs><linearGradient id="a" x1="461.983" y1="702.686" x2="454.308" y2="-287.923" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
//                                             } />}
//                                     </div>
//                                 </div>
//                                 <ProfileMedia />

//                             </div>

//                         </TabsContent>
//                         {/* <TabsContent value="media" className='flex flex-col gap-2'>
//                             <Card className='flex flex-col w-full h-fit gap-1 p-4'>
//                                 <div>Photos</div>
//                                 <div className='flex flex-wrap gap-2'>
//                                     {media && media?.images?.length > 0 && media?.images?.map((image) => {
//                                         if (!image) {
//                                             return null
//                                         }
//                                         return (
//                                             <div className='relative h-24 w-24 rounded-lg  overflow-hidden' onClick={() => {
//                                                 setMediaOpenDetails({ type: 'image', url: image })
//                                                 setMediaOpenModel(true)
//                                             }}>
//                                                 <img className='absolute inset-0 w-full h-full object-cover' src={image} alt="" />
//                                             </div>
//                                         )
//                                     })}

//                                 </div>
//                             </Card>
//                             <Card className='flex flex-col w-full h-fit gap-1 p-4'>
//                                 <div>Videos</div>
//                                 <div className='flex flex-col gap-2'>

//                                     {media && media?.videos?.length > 0 && media?.videos?.map((video) => {
//                                         return (
//                                             <div className='relative h-24 w-24 rounded-lg  overflow-hidden' onClick={() => {
//                                                 setMediaOpenDetails({ type: 'video', url: video })
//                                                 setMediaOpenModel(true)
//                                             }}>
//                                                 <video src={video} className='absolute inset-0 w-full h-full object-cover' ></video>
//                                             </div>
//                                         )
//                                     })}
//                                 </div>
//                             </Card>
//                         </TabsContent> */}
//                     </Tabs>
//                 </div>
//             </div>
//         </div >
//     )
// }

// export default UserProfile
