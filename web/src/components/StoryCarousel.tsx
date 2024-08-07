import {
    CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { useState } from "react"

function StoryCarousel({ users, storyViewIndex, setOpenStory }) {
    const [nestStories, setNestStories] = useState(0)
    return (
        <Carousel className="max-w-xl h-screen flex items-center justify-center bg-card">
            <CarouselContent  className="flex items-center justify-center">
                {users.map((user, i) => {
                    if (storyViewIndex >= 0 && storyViewIndex == i) {
                        setNestStories(user.stories.length - 1)
                        return user.stories.map((story) => {

                            return (
                                <CarouselItem>
                                    <div className="h-screen flex items-center justify-center">
                                        <img className="h-full" src={story.url} onClick={() => {
                                            setOpenStory(false)
                                        }} alt="" />
                                    </div>
                                </CarouselItem>
                            )
                        })
                    }
                })}
            </CarouselContent>
            <CarouselPrevious type="button" />
            <CarouselNext type="button" onClick={() => {
            }} />
        </Carousel>
    )
}

export default StoryCarousel