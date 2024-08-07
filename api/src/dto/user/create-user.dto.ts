import {z} from 'zod'

export const CreateUserSchema = z.object({
    firstname: z.string(),
    lastname: z.string().optional(),
    username: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.object({
        country: z.string(),
        city: z.string(),
    })
})

export type CreateUserDTO = z.infer<typeof CreateUserSchema>