import {
    CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { MdCancel, MdRemove } from "react-icons/md"

function PostCarousel({ postMedia, setPostMedia }) {
    console.log(postMedia, 'carousel')
    return (
        <Carousel>
            <CarouselContent >
                {postMedia.map((media, index) => {
                    if (media.type == 'video') {
                        return (
                            <CarouselItem className="w-full flex items-center justify-center" >
                                <video src={media.url} controls ></video>
                            </CarouselItem>

                        )
                    }

                    if (media.type == 'image', !media?.remove) {
                        return (
                            <CarouselItem className="relative h-64 w-full flex items-center justify-center">
                                <div className="absolute top-0 right-0 p-2 z-10 cursor-pointer" onClick={() => {
                                    let _postMedia = [...postMedia]
                                    _postMedia[index] = { ..._postMedia[index], remove: true }
                                    setPostMedia(_postMedia)
                                }}>
                                    <MdCancel />
                                </div>
                                <img className="h-full object-contain" src={media.url} alt="" />
                            </CarouselItem>
                        )

                    }
                })}

            </CarouselContent>
            {postMedia?.length > 1
                && <CarouselPrevious type="button" className="left-1" />
            }
            {postMedia?.length > 1
                && <CarouselNext type="button" className="right-1" />}
        </Carousel>
    )
}

export default PostCarousel