import { useDeleteComment, useLikeComment } from '@/hooks/Post/useComments'
import React, { FC, useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import AudioPlayer from '@/AudioPlayer'
import { toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'
import { domain } from '@/config/domain'
import { reactions } from '@/lib/utils'
import ContentWithLinksAndMentions from '@/components/ContentWithLinksAndMentions'

const Comment: FC<any> = ({ fetchNextPage, reply, comment, pageIndex, commentIndex, userId, ref, editCommentModelState, setEditCommentModelState, setCommentDetails, isParent }) => {
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [contentExpanded, setContentExpanded] = useState(false);
    const timeoutRef = useRef(null);
    const emojisRef = useRef(null);
    const { mutate } = useLikeComment(comment?.post);
    const deleteComment = useDeleteComment(comment?.post);
    const navigate = useNavigate();

    let [likeParentComment, setLikeParentComment] = useState(comment?.isLikedByUser);

    let reactionIndex = comment?.reaction ? reactions.findIndex((reaction) => {
        if (reaction.name === comment.reaction) {
            return reaction;
        }
    }) : -1;

    const toggleReadMore = React.useCallback(() => {
        setContentExpanded(prev => !prev);
    }, []);

    const handleHashtagPress = React.useCallback((hashtag: string) => {
        navigate(`/hashtags-feed/${hashtag}`);
    }, [navigate]);

    const handleMouseDown = (e) => {
        if (comment?.isLikedByUser) {
            return;
        }
        timeoutRef.current = setTimeout(() => {
            setShowReactions(true);
        }, 500);
    };

    const handleMouseUp = (e) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (!showReactions) {
            likeComment();
            setSelectedReaction(null);
        }
    };

    const handleMouseLeave = (e) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    const handleTouchStart = (e) => {
        e.preventDefault(); 
        handleMouseDown(e.touches[0]);
    };
    
    const handleTouchEnd = (e) => {
        e.preventDefault(); 
        handleMouseUp(e.changedTouches[0]);
    };
    
    const handleTouchCancel = (e) => {
        e.preventDefault(); 
        handleMouseLeave(e.changedTouches[0]);
    };

    const likeComment = (_reaction?: string) => {
        if (!comment?._id) {
            toast.info("please wait...");
            return;
        }
        
        let reaction = _reaction !== undefined ? reactions[_reaction]?.name : undefined;
        const commentData = { 
            userId: userId, 
            commentId: comment?._id, 
            pageIndex, 
            commentIndex,
            reaction 
        };
        
        if (isParent) {
            setLikeParentComment(!likeParentComment);
        }
        
        mutate(commentData);
    };

    const handleReactionSelect = (reaction) => {
        setSelectedReaction(reaction);
        likeComment(reaction);
        setShowReactions(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojisRef.current && !emojisRef.current.contains(event.target)) {
                setShowReactions(false);
            }
        }

        if (showReactions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showReactions]);

    const renderLikeButton = () => {
        const isLiked = isParent ? likeParentComment : comment?.isLikedByUser;
        const hasReaction = comment?.reaction && reactionIndex !== -1;

        return (
            <div className="relative select-none flex items-center cursor-pointer"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
            >
                {showReactions && (
                    <div ref={emojisRef} className="absolute bottom-full left-0 mb-2 bg-background border border-accent rounded-full shadow-lg flex">
                        {reactions.map((reaction, index) => (
                            <button
                                key={reaction.name}
                                className="p-1 text-sm hover:bg-accent rounded-full"
                                onClick={() => handleReactionSelect(index)}
                                onTouchEnd={() => handleReactionSelect(index)}
                            >
                                {reaction.emoji}
                            </button>
                        ))}
                    </div>
                )}
                
                {hasReaction ? (
                    <span className="flex items-center gap-1">
                        <span className="text-sm">{reactions[reactionIndex]?.emoji}</span>
                        <span className={`text-xs ${isLiked && "text-primary"}`}>
                            {reactions[reactionIndex]?.name} {comment?.likedBy?.length > 0 && comment?.likedBy?.length}
                        </span>
                    </span>
                ) : (
                    <span className={`text-xs ${isLiked && "text-primary"}`}>
                        Like {comment?.likedBy?.length > 0 && comment?.likedBy?.length}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div>
            {
                comment?.audio?.src ?
                    <div className="flex gap-2 select-none" key={comment?._id} ref={ref}>
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
                                {comment.user?._id == userId &&
                                    < DropdownMenu >
                                        <DropdownMenuTrigger asChild className='cursor-pointer'>
                                            <EllipsisVertical size="16px" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                deleteComment.mutate({ commentId: comment?._id, pageIndex, commentIndex, audio: { src: comment.audio.src, }, postId: comment.post })
                                            }}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>}
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                {renderLikeButton()}
                                <span className='cursor-pointer' onClick={() => {
                                    reply({ ...comment, commentIndex })
                                }}>{comment?.repliesCount > 0 ? "Replies " + comment.repliesCount : 'Reply'}</span>
                            </div>
                        </div>
                    </div> :
                    <div className="flex gap-2 select-none" key={comment?._id} ref={ref}>
                        <Link to={`${domain}/user/${comment?.user?.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-card dark:bg-accent  w-full flex items-center justify-center overflow-hidden'>
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
                                <div className="flex-1">
                                    <ContentWithLinksAndMentions
                                        content={comment?.content || ''}
                                        mentions={comment?.populatedMentions || comment?.mentions || []}
                                        onHashtagPress={handleHashtagPress}
                                        expanded={contentExpanded}
                                        toggleReadMore={toggleReadMore}
                                        maxLength={200}
                                    />
                                </div>
                                {comment.user?._id == userId &&
                                    < DropdownMenu >
                                        <DropdownMenuTrigger asChild className='cursor-pointer'>
                                            <EllipsisVertical size="16px" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='bg-card z-40 p-2 rounded-md'>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                setEditCommentModelState(!editCommentModelState)
                                                
                                                setCommentDetails({ 
                                                    content: comment.content, 
                                                    commentId: comment?._id, 
                                                    pageIndex, 
                                                    commentIndex,
                                                    mentions: comment?.mentions || [],
                                                    mentionReferences: comment?.mentionReferences || []
                                                })
                                            }}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                deleteComment.mutate({ postId: comment.post, commentId: comment?._id, pageIndex, commentIndex })
                                            }}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>}
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                {renderLikeButton()}
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