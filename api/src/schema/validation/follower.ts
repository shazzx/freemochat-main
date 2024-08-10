import {z} from 'zod'
import { Cursor, ValidMongoId } from './global'

export const GetFollowers = Cursor.extend({
    targetId: ValidMongoId.optional(),
    type: z.string(),
})

export type GetFollowersDTO = z.infer<typeof GetFollowers>