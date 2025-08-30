import React, { FC, useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useDeleteReply, useLikeReply } from '@/hooks/Post/useComments'
import AudioPlayer from '@/AudioPlayer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { domain } from '@/config/domain'
import { useAppSelector } from '@/app/hooks'
import { reactions } from '@/lib/utils'
import { toast } from 'react-toastify'
import ContentWithLinksAndMentions from '@/components/ContentWithLinksAndMentions'

const Reply: FC<any> = ({ reply, pageIndex, replyIndex, postId, userId, ref, setEditCommentModelState, editCommentModelState, setCommentDetails }) => {
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [contentExpanded, setContentExpanded] = useState(false);
    const timeoutRef = useRef(null);
    const emojisRef = useRef(null);
    const navigate = useNavigate();

    const { mutate } = useLikeReply(reply?.parentId);
    const { user } = useAppSelector((state) => state.user);
    const deleteReply = useDeleteReply(reply?.parentId, postId);

    let reactionIndex = reply?.reaction ? reactions.findIndex((reaction) => {
        if (reaction.name === reply.reaction) {
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
        if (reply?.isLikedByUser) {
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
            likeReply();
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

    const likeReply = (_reaction?: string) => {
        if (!reply?._id) {
            toast.info("please wait...");
            return;
        }

        let reaction = _reaction !== undefined ? reactions[_reaction]?.name : undefined;
        const replyData = {
            userId: userId,
            commentId: reply.parentId,
            replyId: reply?._id,
            pageIndex,
            replyIndex,
            reaction
        };

        mutate(replyData);
    };

    const handleReactionSelect = (reaction) => {
        setSelectedReaction(reaction);
        likeReply(reaction);
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
        const isLiked = reply?.isLikedByUser;
        const hasReaction = reply?.reaction && reactionIndex !== -1;

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
                            {reactions[reactionIndex]?.name} {reply?.likedBy?.length > 0 && reply?.likedBy?.length}
                        </span>
                    </span>
                ) : (
                    <span className={`text-xs ${isLiked && "text-primary"}`}>
                        Like {reply?.likedBy?.length > 0 && reply?.likedBy?.length}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div>
            {
                reply?.audio ?
                    <div className="flex gap-2 select-none" key={reply._id} ref={ref}>
                        <Link to={`${domain}/user/${reply.user.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-accent w-full flex items-center justify-center overflow-hidden'>
                            <Avatar >
                                <AvatarImage src={reply.user?.profile} alt="Avatar" />
                            </Avatar>
                        </Link>
                        <div className='flex flex-col'>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className="font-medium">{reply?.user?.firstname} {reply?.user?.lastname}</span>
                            </div>
                            <div className="max-w-80 w-full flex items-center gap-3 p-2 border border-muted text-sm rounded-lg ">
                                <AudioPlayer src={reply.audio.src} duration={reply.audio.duration} />
                                {user._id == reply?.user?._id &&
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild className='cursor-pointer'>
                                            <EllipsisVertical size="16px" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                deleteReply.mutate({ replyId: reply._id, pageIndex, replyIndex, audio: reply.audio })
                                            }}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                }
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                {renderLikeButton()}
                            </div>
                        </div>
                    </div> :
                    <div className="flex gap-2 select-none" key={reply._id} ref={ref}>
                        <Link to={`${domain}/user/${reply.user.username}`} className='cursor-pointer max-w-8 max-h-8 rounded-full bg-accent w-full flex items-center justify-center overflow-hidden'>
                            <Avatar >
                                <AvatarImage src={reply.user?.profile} alt="Avatar" />
                            </Avatar>
                        </Link>
                        <div className='flex flex-col'>
                            <div className='flex px-2 gap-4 text-xs'>
                                <span className="font-medium">{reply?.user?.firstname} {reply?.user?.lastname}</span>
                            </div>
                            <div className="max-w-80 w-full flex items-center gap-3 p-2 border border-muted text-sm rounded-lg ">
                                <div className="flex-1">
                                    <ContentWithLinksAndMentions
                                        content={reply?.content || ''}
                                        mentions={reply?.populatedMentions || reply?.mentions || []}
                                        onHashtagPress={handleHashtagPress}
                                        expanded={contentExpanded}
                                        toggleReadMore={toggleReadMore}
                                        maxLength={150}
                                    />
                                </div>
                                {user._id == reply?.user?._id &&
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild className='cursor-pointer'>
                                            <EllipsisVertical size="16px" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className='bg-card p-2 rounded-md'>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                
                                                setEditCommentModelState(!editCommentModelState)
                                                
                                                setCommentDetails({ 
                                                    content: reply.content, 
                                                    replyId: reply._id, 
                                                    pageIndex, 
                                                    replyIndex,
                                                    mentions: reply?.mentions || [], 
                                                    mentionReferences: reply?.mentionReferences || [],
                                                    commentId: reply.parentId 
                                                })
                                            }}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className='cursor-pointer' onClick={async () => {
                                                deleteReply.mutate({ replyId: reply._id, pageIndex, replyIndex, audio: reply.audio })
                                            }}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                }
                            </div>
                            <div className='flex px-2 gap-4 text-xs'>
                                {renderLikeButton()}
                            </div>
                        </div>
                    </div>
            }
        </div>
    )
}

export default Reply