import {z} from 'zod'
import { Cursor, ValidMongoId } from './global'

export const CreateUser = z.object({
    firstname: z.string(),
    lastname: z.string().optional(),
    username: z.string(),
    email: z.string(),
    phone: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
    address: z.object({
        country: z.string(),
        city: z.string(),
        area: z.string(),
    })
})


export const UpdateUser = z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.object({
        country: z.string().optional(),
        city: z.string().optional(),
        area: z.string().optional(),
    }).optional(),
    images: z.object({
        profile: z.string().optional(),
        cover: z.string().optional(),
    }).optional()
})


export const LoginUser = z.object({
    username: z.string(),
    password: z.string()
})


export const GetUser = z.object({
    username: z.string(),
})

export const FriendGeneral = z.object({
    recepientId: ValidMongoId
})


export const GetFriends = Cursor.extend({
    groupId: ValidMongoId,
    userId: ValidMongoId
})

export type CreateUserDTO = z.infer<typeof CreateUser>
export type UpdateUserDTO = z.infer<typeof UpdateUser>
export type LoginUserDTO = z.infer<typeof LoginUser>
export type GetUserDTO = z.infer<typeof GetUser>
export type FriendGeneralDTO = z.infer<typeof FriendGeneral>
export type GetFriendsDTO = z.infer<typeof GetFriends>