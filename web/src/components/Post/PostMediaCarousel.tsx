import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import AutoPlayVideo from "../AutoPlayVideo"
import { useNavigate } from "react-router-dom";
import { postMedia, PostType } from "@/utils/types/Post";

export function PostMediaCarousel({ postData, media, mobile }: {
  postData?: PostType, media: postMedia, mobile?: boolean
}) {

  const navigate = useNavigate()
  const handleNavigation = () => {
    navigate(`/reels/${postData._id}`, {
      state: {
        sourceMode: 'videosFeed',
        initialReelId: postData._id,
        reelData: {
          ...postData,
          _navigationTimestamp: Date.now()
        }
      }
    });
  }
  return (
    <Carousel className="relative">
      <CarouselContent>
        {media?.length > 0 && media.map(({ type, url }, index) => (
          <CarouselItem key={index} className="flex justify-center items-center">
            <div className="aspect-auto max-w-xl">
              {type == 'video' ?
                <AutoPlayVideo src={url} handleNavigation={handleNavigation} />
                // <video className='w-full max-h-[500px] h-full' autoPlay={true} src={url} controls></video>
                :
                <img src={url} alt="" className="object-contain max-h-[500px]" />
              }
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* hidden hover:flex */}
      {media.length > 1 && !mobile &&
        <>
          <CarouselNext className=" absolute right-1 top-2/4" />
          <CarouselPrevious className=" absolute left-1 top-2/4" />
        </>
      }
    </Carousel>
  )
}
