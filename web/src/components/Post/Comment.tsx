import { useDeleteComment, useLikeComment } from '@/hooks/Post/useComments'
import { FC, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import AudioPlayer from '@/AudioPlayer'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { domain } from '@/config/domain'

const Comment: FC<any> = ({ fetchNextPage, reply, comment, pageIndex, commentIndex, userId, ref, editCommentModelState, setEditCommentModelState, setCommentDetails, isParent }) => {
    const { mutate } = useLikeComment(comment?.post)
    const deleteComment = useDeleteComment(comment?.post)


    let [likeParentComment, setLikeParentComment] = useState(comment?.isLikedByUser)
    // if (inView) {
    //     console.log('fetching')
    //     fetchNextPage()
    // }
    console.log(comment)
    return (
        <div>
            {
                comment?.audio?.src ?

                    <div className="flex gap-2 select-none" key={comment._id} ref={ref}>

                        <Link to={`${domain}/user/${comment.user.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-accent w-full flex items-center justify-center overflow-hidden'>
                            <Avatar >
                                <AvatarImage src={comment.user?.profile} alt="Avatar" />
                                <AvatarFallback>{comment.user.firstname && comment.user.firstname[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className='flex flex-col'>
                            <Link to={`${domain}/user/${comment.user.username}`} className='flex px-2 gap-4 text-xs'>
                                <span className="font-medium">{comment?.user?.firstname} {comment?.user?.lastname}</span>
                            </Link>
                            <div className="max-w-80 w-full flex items-center gap-3 p-2 border border-muted text-sm rounded-lg ">
                                <AudioPlayer src={comment.audio.src} duration={comment.audio.duration} />
                                {comment.user._id == userId &&
                                    < DropdownMenu >
                                        <DropdownMenuTrigger asChild className='cursor-pointer'>
                                            <EllipsisVertical size="16px" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                deleteComment.mutate({ commentId: comment._id, pageIndex, commentIndex, audio: { src: comment.audio.src, }, postId: comment.post })
                                            }}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>}
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className={`cursor-pointer ${(isParent ? likeParentComment : comment?.isLikedByUser) && "text-primary"}`} onClick={async () => {
                                    if (isParent) {
                                        setLikeParentComment(!likeParentComment)
                                    }
                                    if (!comment?._id) {
                                        toast.info("please wait...")
                                        return
                                    }

                                    const commentData = { userId: userId, commentId: comment?._id, pageIndex, commentIndex }
                                    mutate(commentData)
                                }}>Like {comment?.likedBy?.length}</span>
                                <span className='cursor-pointer' onClick={() => {
                                    reply({ ...comment, commentIndex })
                                }}>{comment?.repliesCount > 0 ? "Replies " + comment.repliesCount : 'Reply'}</span>


                            </div>
                        </div>
                    </div> :
                    <div className="flex gap-2 select-none" key={comment._id} ref={ref}>

                        <Link to={`${domain}/user/${comment?.user?.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-accent w-full flex items-center justify-center overflow-hidden'>
                            <Avatar >
                                <AvatarImage src={comment?.user?.profile} alt="Avatar" />
                                <AvatarFallback>{comment?.user?.firstname && comment?.user?.firstname[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className='flex flex-col '>
                            <Link to={`${domain}/user/${comment?.user?.username}`} className='flex px-2 gap-4 text-xs'>
                                <span className="font-medium">{comment?.user?.firstname} {comment?.user?.lastname}</span>
                            </Link>
                            <div className="max-w-80 w-full flex items-center gap-3 p-2 border border-accent bg-card dark:bg-transparent text-sm rounded-lg ">
                                <p >{comment?.content}</p>
                                {comment.user._id == userId &&
                                    < DropdownMenu >
                                        <DropdownMenuTrigger asChild className='cursor-pointer'>
                                            <EllipsisVertical size="16px" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                setEditCommentModelState(!editCommentModelState)
                                                setCommentDetails({ content: comment.content, commentId: comment._id, pageIndex, commentIndex })
                                            }}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                deleteComment.mutate({ postId: comment.post, commentId: comment._id, pageIndex, commentIndex })
                                            }}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>}
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className={`cursor-pointer ${comment?.isLikedByUser && "text-primary"}`} onClick={async () => {
                                    if (!comment?._id) {
                                        toast.info("please wait...")
                                        return
                                    }
                                    const commentData = { userId: userId, commentId: comment?._id, pageIndex, commentIndex }
                                    mutate(commentData)
                                }}>Like {comment?.likedBy?.length}</span>
                                <span className='cursor-pointer' onClick={() => {
                                    reply({ ...comment, commentIndex })
                                }}>{comment?.repliesCount > 0 ? "Replies " + comment.repliesCount : 'Reply'}</span>


                            </div>
                        </div>
                    </div>
            }
        </div>
    )
}

export default Comment