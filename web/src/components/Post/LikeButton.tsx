import { reactions } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'

document.addEventListener('contextmenu', (e) => e.preventDefault());

function LikeButton({ postData, mutate, pageIndex, postIndex }) {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const timeoutRef = useRef(null);
  const emojisRef = useRef(null)

  const likePost = (_reaction?: string) => {
    let reaction = reactions[_reaction]?.name
    mutate({ postId: postData._id, pageIndex, postIndex, authorId: postData.user?._id ? postData.user?._id : postData.user, type: postData?.type, targetId: postData?.targetId, reaction })
  }

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

  const handleMouseDown = (e) => {
    if (postData.isLikedByUser) {
      return
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
      likePost()
      setSelectedReaction(null);
    }
  };

  let reactionIndex = reactions.findIndex((reaction) => {
    if (reaction.name == postData.reaction) {
      return reaction
    }
  })

  const handleReactionSelect = (reaction) => {
    setSelectedReaction(reaction);
    likePost(reaction)
    setShowReactions(false)
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseLeave = (e) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };


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
  }, [showReactions])

  return (

    <div className='relative select-none flex flex-col sm:flex-row sm:gap-1 items-center cursor-pointer'
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
              className="p-2 text-xl hover:bg-accent rounded-full"
              onClick={() => handleReactionSelect(index)}
              onTouchEnd={() => handleReactionSelect(index)}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}
      {((!postData?.isLikedByUser) || (postData?.isLikedByUser && !postData?.reaction)) &&
        <Heart className={`w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] transform scale-x-[-1] ${postData?.isLikedByUser ? 'fill-red-500 stroke-red-500' : 'stroke-foreground dark:stroke-foreground'} `} strokeWidth={1.2} />
      }

      {((!postData?.isLikedByUser) || (postData.isLikedByUser && !postData?.reaction)) &&
        <span className={`text-xs sm:text-sm ${postData?.isLikedByUser && "text-primary"}`}>Like</span>
      }


      {postData?.isLikedByUser && postData?.reaction &&
        <div className='flex flex-col sm:flex-row justfy-center gap-1 text-center items-center  sm:w-[94px]'>
          <span className={`text-xl`}>{reactions[reactionIndex]?.emoji}</span>
          <span className={`text-xs sm:text-sm ${postData?.isLikedByUser && "text-primary"}`}>{reactions[reactionIndex]?.name}</span>
        </div>
      }
    </div>
  )
}

export default LikeButton