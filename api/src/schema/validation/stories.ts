import { z } from 'zod'
import { ValidMongoId } from './global'

export const DeleteStory = z.object({
    storyId: ValidMongoId,
    url: z.string(),
})

export type DeleteStoryDTO = z.infer<typeof DeleteStory>