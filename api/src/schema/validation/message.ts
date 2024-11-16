import {z} from 'zod'
import { Cursor, ValidMongoId } from './global'

export const CreateMessage = z.object({
    sender: ValidMongoId,
    recepient: ValidMongoId,
    content: z.string(),
    type: z.string(),
    localUrl: z.string().optional(),
    messageType: z.string(),
    mediaDetails: z.object({
        type: z.string(),
        duration: z.number().optional(),
    })
})

export const GetMessages = Cursor.extend({
    recepientId: ValidMongoId.optional(),
    type: z.string().optional(),
    isChatGroup: z.string(),
})

export const RemoveMessage = z.object({
    messageId: ValidMongoId.optional(),
})

export type CreateMessageDTO = z.infer<typeof CreateMessage>
export type GetMessagesDTO = z.infer<typeof GetMessages>
export type RemoveMessageDTO = z.infer<typeof RemoveMessage>