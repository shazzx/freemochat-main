import { axiosClient } from '@/api/axiosClient'
import { domain } from '@/config/domain'
import { usePostLikes } from '@/hooks/Post/usePost'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect } from 'react'
import { MdClose } from 'react-icons/md'
import { Link } from 'react-router-dom'

function LikesModel({ setLikesModelState, postId }) {

  const { data, isLoading, isSuccess, isError, refetch } = usePostLikes(postId)
  console.log(data)


  const reactions = {
    "Love": '❤️',
    'Haha': '😆',
    'Angry': '😠',
    'Sad': '😢',
}


  return (
    <div className='fixed inset-0 z-50 w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
      <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
        setLikesModelState(false)
      }}></div>
      <div className='flex flex-col items-center border border-accent shadow-lg p-2 bg-card max-w-md w-full min-h-[400px] sm:max-h-[600px] rounded-lg h-full overflow-auto  z-10'>
        <MdClose size={20} className='ml-auto cursor-pointer' onClick={() => {
          setLikesModelState(false)
        }} />
        {isSuccess
        &&
        <div className='flex w-full justify-between items-center p-2 px-3'>
          <span>User</span>
          <span>Reaction</span>
        </div>
        }
        {isError &&
          <div className='flex w-full items-center justify-center flex-col gap-2 '>
            <span>something went wrong...</span>
            <button onClick={() => {
              refetch()
            }}>Reload</button>
          </div>}
        {isLoading && 
        <div className='flex w-full items-center justify-center' >
          loading...
        </div>
        }
        {isSuccess &&
        data.map((page) => {
          return page.likedBy.map(({user, reaction}) => {
            const fullname = user.firstname + ' ' + user?.lastname
            return(
              <div className='flex items-center justify-center p-2 gap-1 w-full bg-card hover:bg-accent' key={user._id}>
              <div className='flex items-center gap-2 relative w-full '>
                  <Link to={domain + "/user/" + user.username} className='cursor-pointer flex w-full gap-2'>
                      <div className='w-16 h-16  rounded-lg flex items-center justify-center  border-primary border-2 overflow-hidden'>
                          <Avatar >
                              <AvatarImage src={user?.profile} alt="Avatar" />
                              <AvatarFallback className='text-2xl'>{fullname && fullname[0]}</AvatarFallback>
                          </Avatar>
                      </div>
                      <div className="flex flex-col justify-center">
                          <div className=''>{fullname}</div>
                          <div className='text-gray-400 text-sm'>@{user.username}</div>
                      </div>
                  </Link>
              </div>
              <div className='p-2 flex flex-col items-end justify-end'>
                <span className='text-sm'>{reaction}</span>
                {reactions[reaction] 
                || 
                <>
                <span className='text-sm'>Freedom</span>
              <img className='w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] transform scale-x-[-1]' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABZJJREFUWEftVm1Mk1cUPue+fSmEj4KAIMgAO2EylUWKLFuiMxkxMyAYZvdjGre44SYuRtgHYWiHH+g+1GRzm9mWaTLjMn8Y67I/Swg/XFwEdZn6Y0lVBMYKXUtLW/r53vfM21ECWhDZon+8SdO8955zz3Oe83URHvLCh2wfHgF4IAxYLJYUWZYNqqqWDQwM2K1W62mj0Tgiwh8TwFZTSRJR4vqRUODMyQNXnULutZaKuQkyyJ+1XfhzYt6cOnVK0mq1KzjnS4jIXFdX1xs97+zs1BQWFm4BgM0AkOfz+RIGBwfP2u32RqPRODglgC3vLzdIEh4loh1f7uk6t7W1/HVg2A6Ex7/Yc+GdqAGTyaQpLS09whirBwArADTW1tb+IM77+/uXcs6/B4AS8R0Oh8Fms/ncbneDx+M5aTQaQ5MAvGWqmK8S36YQN6ugcccBfg2ktANJC4jhHgD4RVF401f7L/0hFM1mc7KqqscQsU58E9E1IqrX6/VXdDrdS0R0ABEzOefg8/nA7XZDQkIC+P3+M3a7vaGmpuavSQC2t1RkhTV0EIA0KtIhpuJeAvgdEapQhQ4EPHhkb1ePUBLUut3uZiJqBQDtGCM98fHxHxQXF+cCwA5hXOwLw6Ojo6DT6SAYDPocDsdOv99/tLq62jcJwPr1IGUWl1cCQrNK8KOEsFoFXMwAOgHJCsAcnPOOo/sudpvN5qeISNBbFM0jSZKC2dnZlszMzHQAmBcNk2BA/AQQh8NxORAIbKmpqbkYPZ+UhPXvlenkONZIACsFeCIMMCROgPEIGEfEzyo2+nbNmp0mItqOiEkRLxAhLS0NsrOzIS4ubjxHhWGv1xuJv9/vJ4/HczwcDrdG6Y+ZhA0thkrSsE+ASAuA3jm6eeGczEXXkhNTfurt+637sYLqcDImf4eIlVHvBb05OTmg1UajEckJGBoaiuxJkgQej+e6y+Vq7urqMre1tSkxGRCbb7QankPEFVlzCq+sLN/wri454+kEbYonXptoRcRzAwMDHTab7W1ELBPyt+MOhYWFEc8FE9ElAAjPxb/dbrc6nc6PfD7fN0aj0TuxjO/qA/s/XvT8siznxmVFy4t9c/eVDo8o8aqqQnp6OgGA4vV6+/r6+lJDoVA6YwyKiooiXk40HjXg8XjAarWOhEKhxu7u7hNtbW2R0psSAP0MOaoWdqmAmxTtYo0985h06MgJVBQOTU1NEb0xj0RNQ25uLqSmpt55ZyTrBf2yLMPIyMj5qqqqZ+8SGtu4i4HDh/PnMYzfZViQvyD3yUPLXB4lIxgMQlZW1qQ7FEWJxDaW54J6ce50OoeHhoa2rVu3TlRMzBWzFb/ZYniBSVL55hcPPzNHl7N6KuVY+6FQSGQ8DA8PC+8/rK2tbZ5OPyaA+voyWc7GNS9XHajMmft4w/0AEF0vEAiAy+Xyer3elWvXrr183wAiCiZgPa/0bETE4/cDYIz6UYfDcTAjI2OvwWAIzw7AvwNlCef8ykwBiFxxuVwi+VxJSUmnZVm2AIBTVdVLer1+vPtNW4YTD8fGqQCwaCYgRLmKH2NMZYwFAYADgO/2XPg8Pz9/d6w77vkguXnzZjVj7OxMAEwhYwOA2oKCgl9nBUAo3bp1a/dY70+e6hEzDcDr4XC4bOHChe5ZA+jv709QVXUDEW0aC4foPmwGrIju2V5QUCDG9sz7QCxJItLcuHHjCUmSxBBaKuY9IiYTURwRISJmAIB+gq5KRB0ajebVvLy8gf8MIHqBMCZmAWMsnXOeIkmSrCiKyKUKRDQBQBoA/C0eTZzzT/V6/dVZl+EMKB4XsVgs82VZbgeARM75yWAweL6kpES8E6dd96yCe10wgRnW29ubFQgE0Gq12latWjU+8x8IAzMFeqfc/8bAIwCzZeAfB5Z+P+kq0XIAAAAASUVORK5CYII=" alt="" />
                </>
              } 
              </div>
          </div>
        )
          })
        })
}
      </div>
    </div>
  )
}

export default LikesModel