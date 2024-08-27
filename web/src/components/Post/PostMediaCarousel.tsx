import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
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
    <Carousel className="relative aspect-auto object-contain max-w-[520px]  ">
      <CarouselContent>
        {media?.length > 0 && media.map(({ type, url }, index) => (
          <CarouselItem key={index} className="flex justify-center items-center">
            <div>
              {type == 'video' ?
                <video className='w-full h-full' autoPlay={false} src={url} controls></video>
                :
                <img className='object-contain' src={url} alt="" />
              }
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* hidden hover:flex */}
      <CarouselNext  className=" absolute right-1 top-2/4"/>
      <CarouselPrevious className=" absolute left-1 top-2/4" />
    </Carousel>
  )
}
