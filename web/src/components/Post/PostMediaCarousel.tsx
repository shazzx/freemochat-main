import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function PostMediaCarousel({ media }) {
  console.log(media)
  return (
    <Carousel className="relative">
      <CarouselContent>
        {media?.length > 0 && media.map(({ type, url }, index) => (
          <CarouselItem key={index} className="flex justify-center items-center">
            <div className="aspect-auto max-w-xl">
              {type == 'video' ?
                <video className='w-full max-h-[500px] h-full' autoPlay={true} src={url} controls></video>
                :
                <img src={url} alt="" />
              }
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* hidden hover:flex */}
      {media.length > 1 &&
        <>
          <CarouselNext className=" absolute right-1 top-2/4" />
          <CarouselPrevious className=" absolute left-1 top-2/4" />
        </>
      }
    </Carousel>
  )
}
