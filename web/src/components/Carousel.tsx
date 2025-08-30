import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { MdCancel } from "react-icons/md"

function PostCarousel({ postMedia, setPostMedia, selectedMedia, setSelectedMedia }) {
    const visibleMedia = postMedia.filter(media => !media?.remove);

    const handleRemoveMedia = (index) => {
        let actualIndex = 0;
        let visibleIndex = 0;
        
        for (let i = 0; i < postMedia.length; i++) {
            if (!postMedia[i]?.remove) {
                if (visibleIndex === index) {
                    actualIndex = i;
                    break;
                }
                visibleIndex++;
            }
        }

        let _postMedia = [...postMedia];
        _postMedia[actualIndex] = { ..._postMedia[actualIndex], remove: true };
        setPostMedia(_postMedia);

        if (selectedMedia && setSelectedMedia) {
            const mediaToRemove = _postMedia[actualIndex];
            const updatedSelectedMedia = selectedMedia.filter(media => 
                media.url !== mediaToRemove.url
            );
            setSelectedMedia(updatedSelectedMedia);
        }

        const imageInput = document.getElementById('post-image');
        const videoInput = document.getElementById('post-video');
        if (imageInput) imageInput['value'] = '';
        if (videoInput) videoInput['value'] = '';
    };

    if (visibleMedia.length === 0) {
        return null;
    }

    return (
        <Carousel>
            <CarouselContent>
                {visibleMedia.map((media, index) => {
                    if (media.type === 'video') {
                        return (
                            <CarouselItem key={`video-${index}`} className="w-full flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute top-2 right-2 p-1 z-10 cursor-pointer bg-black bg-opacity-50 rounded-full" 
                                         onClick={() => handleRemoveMedia(index)}>
                                        <MdCancel className="text-white" size={20} />
                                    </div>
                                    <video src={media.url} controls className="max-h-64 w-full object-contain"></video>
                                </div>
                            </CarouselItem>
                        )
                    }

                    if (media.type === 'image') {
                        return (
                            <CarouselItem key={`image-${index}`} className="relative h-64 w-full flex items-center justify-center">
                                <div className="absolute top-2 right-2 p-1 z-10 cursor-pointer bg-black bg-opacity-50 rounded-full" 
                                     onClick={() => handleRemoveMedia(index)}>
                                    <MdCancel className="text-white" size={20} />
                                </div>
                                <img className="h-full object-contain" src={media.url} alt="" />
                            </CarouselItem>
                        )
                    }

                    return null;
                })}
            </CarouselContent>
            {visibleMedia.length > 1 && (
                <CarouselPrevious type="button" className="left-1" />
            )}
            {visibleMedia.length > 1 && (
                <CarouselNext type="button" className="right-1" />
            )}
        </Carousel>
    )
}

export default PostCarousel