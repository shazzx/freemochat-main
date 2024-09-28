import { axiosClient } from '@/api/axiosClient'
import { FC } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useDeleteReply, useLikeReply } from '@/hooks/Post/useComments'
import AudioPlayer from '@/AudioPlayer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { domain } from '@/config/domain'

const Reply: FC<any> = ({ reply, pageIndex, replyIndex, postId, userId, ref, setEditCommentModelState, editCommentModelState, setCommentDetails }) => {
    const { mutate } = useLikeReply(reply?.parentId)
    const deleteReply = useDeleteReply(reply?.parentId)
    return (
        <div>
            {
                reply?.audio ?
                    <div className="flex gap-2 select-none" key={reply._id} ref={ref}>


                        <Link to={`${domain}/user/${reply.user.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-accent w-full flex items-center justify-center overflow-hidden'>
                            <Avatar >
                                <AvatarImage src={reply.user?.profile} alt="Avatar" />
                                <AvatarFallback>{reply.user.firstname && reply.user.firstname[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className='flex flex-col'>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className="font-medium">{reply?.user?.firstname} {reply?.user?.lastname}</span>
                            </div>
                            <div className="max-w-80 w-full flex items-center gap-3 p-2 border border-muted text-sm rounded-lg ">
                                <AudioPlayer src={reply.audio.src} duration={reply.audio.duration} />

                                < DropdownMenu >
                                    <DropdownMenuTrigger asChild className='cursor-pointer'>
                                        <EllipsisVertical size="16px" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                        <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                            deleteReply.mutate({ replyId: reply._id, pageIndex, replyIndex, audio: reply.audio })
                                        }}>Remove</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className={`cursor-pointer ${reply?.isLikedByUser && "text-primary"}`} onClick={async () => {
                                    const replyData = { userId: userId, commentId: reply.parentId, replyId: reply?._id, pageIndex, replyIndex }
                                    mutate(replyData)
                                }}>Like {reply?.likedBy?.length}</span>
                                <span className='cursor-pointer' onClick={() => {
                                    reply({ ...reply, replyIndex })
                                }}>Reply</span>

                            </div>
                        </div>
                    </div> :
                    <div className="flex gap-2 select-none" key={reply._id} ref={ref}>

                        <Link to={`${domain}/user/${reply.user.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-accent w-full flex items-center justify-center overflow-hidden'>
                            <Avatar >
                                <AvatarImage src={reply.user?.profile} alt="Avatar" />
                                <AvatarFallback>{reply.user.firstname && reply.user.firstname[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className='flex flex-col'>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className="font-medium">{reply?.user?.firstname} {reply?.user?.lastname}</span>
                            </div>
                            <div className="max-w-80 w-full flex items-center gap-3 p-2 border border-muted text-sm rounded-lg ">
                                <p >{reply?.content}</p>

                                < DropdownMenu >
                                    <DropdownMenuTrigger asChild className='cursor-pointer'>
                                        <EllipsisVertical size="16px" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                        <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                            // same comment model is used for reply
                                            setEditCommentModelState(!editCommentModelState)
                                            setCommentDetails({ content: reply.content, replyId: reply._id, pageIndex, replyIndex })
                                        }}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                            deleteReply.mutate({ replyId: reply._id, pageIndex, replyIndex, audio: reply.audio })

                                        }}>Remove</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className={`cursor-pointer ${reply?.isLikedByUser && "text-primary"}`} onClick={async () => {
                                    const replyData = { userId: userId, commentId: reply.parentId, replyId: reply?._id, pageIndex, replyIndex }
                                    mutate(replyData)
                                }}>Like {reply?.likedBy?.length}</span>
                                <span className='cursor-pointer' onClick={() => {
                                    reply({ ...reply, replyIndex })
                                }}>Reply</span>

                            </div>
                        </div>
                    </div>
            }
        </div >
    )
}

export default Reply