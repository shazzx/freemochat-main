import { reactions } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react'
document.addEventListener('contextmenu', (e) => e.preventDefault());

function LikeButton({ postData, mutate, pageIndex, postIndex }) {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const timeoutRef = useRef(null);
  const emojisRef = useRef(null)

  const likePost = (_reaction?: string) => {
    let reaction = reactions[_reaction]?.name
    mutate({ postId: postData._id, pageIndex, postIndex, authorId: postData.user?._id ? postData.user?._id  : postData.user, type: postData?.type, targetId: postData?.targetId, reaction })
  }

  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent mouse events from firing
    handleMouseDown(e.touches[0]);
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent mouse events from firing
    handleMouseUp(e.changedTouches[0]);
  };
  
  const handleTouchCancel = (e) => {
    e.preventDefault(); // Prevent mouse events from firing
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

  useEffect(() => {
    // console.log(showReactions)
  }, [showReactions])


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
    // setShowReactions(false);
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
  // console.log(postData)

  return (

    <div className='relative select-none flex flex-col sm:flex-row sm:gap-1 items-center cursor-pointer'
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    onMouseLeave={handleMouseLeave}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    onTouchCancel={handleTouchCancel}
      >
      {/* <svg width="40" height="40" className={`${postData?.isLikedByUser ? 'fill-red-500 stroke-red-500' : 'stroke-foreground dark:stroke-foreground'} `} viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.4994 30.0692L14.8713 25.3192L10.2796 20.5692C7.79547 17.944 7.79547 13.8353 10.2796 11.2101C11.496 10.0411 13.1435 9.4302 14.828 9.52358C16.5125 9.61696 18.0824 10.4062 19.1621 11.7026L19.4994 12.0335L19.8334 11.6883C20.9132 10.392 22.4831 9.60271 24.1675 9.50933C25.852 9.41595 27.4996 10.0269 28.7159 11.1959C31.2001 13.8211 31.2001 17.9298 28.7159 20.555L24.1243 25.305L19.4994 30.0692Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg> */}
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
      {((!postData?.isLikedByUser) || (postData?.isLikedByUser && !postData?.reaction)) && <img className='w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] transform scale-x-[-1]' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABZJJREFUWEftVm1Mk1cUPue+fSmEj4KAIMgAO2EylUWKLFuiMxkxMyAYZvdjGre44SYuRtgHYWiHH+g+1GRzm9mWaTLjMn8Y67I/Swg/XFwEdZn6Y0lVBMYKXUtLW/r53vfM21ECWhDZon+8SdO8955zz3Oe83URHvLCh2wfHgF4IAxYLJYUWZYNqqqWDQwM2K1W62mj0Tgiwh8TwFZTSRJR4vqRUODMyQNXnULutZaKuQkyyJ+1XfhzYt6cOnVK0mq1KzjnS4jIXFdX1xs97+zs1BQWFm4BgM0AkOfz+RIGBwfP2u32RqPRODglgC3vLzdIEh4loh1f7uk6t7W1/HVg2A6Ex7/Yc+GdqAGTyaQpLS09whirBwArADTW1tb+IM77+/uXcs6/B4AS8R0Oh8Fms/ncbneDx+M5aTQaQ5MAvGWqmK8S36YQN6ugcccBfg2ktANJC4jhHgD4RVF401f7L/0hFM1mc7KqqscQsU58E9E1IqrX6/VXdDrdS0R0ABEzOefg8/nA7XZDQkIC+P3+M3a7vaGmpuavSQC2t1RkhTV0EIA0KtIhpuJeAvgdEapQhQ4EPHhkb1ePUBLUut3uZiJqBQDtGCM98fHxHxQXF+cCwA5hXOwLw6Ojo6DT6SAYDPocDsdOv99/tLq62jcJwPr1IGUWl1cCQrNK8KOEsFoFXMwAOgHJCsAcnPOOo/sudpvN5qeISNBbFM0jSZKC2dnZlszMzHQAmBcNk2BA/AQQh8NxORAIbKmpqbkYPZ+UhPXvlenkONZIACsFeCIMMCROgPEIGEfEzyo2+nbNmp0mItqOiEkRLxAhLS0NsrOzIS4ubjxHhWGv1xuJv9/vJ4/HczwcDrdG6Y+ZhA0thkrSsE+ASAuA3jm6eeGczEXXkhNTfurt+637sYLqcDImf4eIlVHvBb05OTmg1UajEckJGBoaiuxJkgQej+e6y+Vq7urqMre1tSkxGRCbb7QankPEFVlzCq+sLN/wri454+kEbYonXptoRcRzAwMDHTab7W1ELBPyt+MOhYWFEc8FE9ElAAjPxb/dbrc6nc6PfD7fN0aj0TuxjO/qA/s/XvT8siznxmVFy4t9c/eVDo8o8aqqQnp6OgGA4vV6+/r6+lJDoVA6YwyKiooiXk40HjXg8XjAarWOhEKhxu7u7hNtbW2R0psSAP0MOaoWdqmAmxTtYo0985h06MgJVBQOTU1NEb0xj0RNQ25uLqSmpt55ZyTrBf2yLMPIyMj5qqqqZ+8SGtu4i4HDh/PnMYzfZViQvyD3yUPLXB4lIxgMQlZW1qQ7FEWJxDaW54J6ce50OoeHhoa2rVu3TlRMzBWzFb/ZYniBSVL55hcPPzNHl7N6KuVY+6FQSGQ8DA8PC+8/rK2tbZ5OPyaA+voyWc7GNS9XHajMmft4w/0AEF0vEAiAy+Xyer3elWvXrr183wAiCiZgPa/0bETE4/cDYIz6UYfDcTAjI2OvwWAIzw7AvwNlCef8ykwBiFxxuVwi+VxJSUmnZVm2AIBTVdVLer1+vPtNW4YTD8fGqQCwaCYgRLmKH2NMZYwFAYADgO/2XPg8Pz9/d6w77vkguXnzZjVj7OxMAEwhYwOA2oKCgl9nBUAo3bp1a/dY70+e6hEzDcDr4XC4bOHChe5ZA+jv709QVXUDEW0aC4foPmwGrIju2V5QUCDG9sz7QCxJItLcuHHjCUmSxBBaKuY9IiYTURwRISJmAIB+gq5KRB0ajebVvLy8gf8MIHqBMCZmAWMsnXOeIkmSrCiKyKUKRDQBQBoA/C0eTZzzT/V6/dVZl+EMKB4XsVgs82VZbgeARM75yWAweL6kpES8E6dd96yCe10wgRnW29ubFQgE0Gq12latWjU+8x8IAzMFeqfc/8bAIwCzZeAfB5Z+P+kq0XIAAAAASUVORK5CYII=" alt="" />}

      {((!postData?.isLikedByUser) || (postData.isLikedByUser && !postData?.reaction)) && 
      <span className={`text-xs sm:text-sm ${postData?.isLikedByUser && "text-primary"}`}>Freedom</span>
      }
      

      {postData?.isLikedByUser && postData?.reaction &&
        <div className='flex flex-col sm:flex-row justfy-center gap-1 text-center items-center  sm:w-[94px]'>
          <span className={`text-xl`}>{reactions[reactionIndex]?.emoji}</span>
          <span className={`text-xs sm:text-sm ${postData?.isLikedByUser && "text-primary"}`}>{reactions[reactionIndex]?.name}</span>
        </div>
      }
{/* 
      {postData?.likesCount && postData?.likesCount > 0 ?
        <span className='text-sm sm:hidden'>{postData?.likesCount}</span> : <span></span>
      } */}
    </div>
  )
}

export default LikeButton