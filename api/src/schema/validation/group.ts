import {z} from 'zod'

export const GroupJoin = z.object({
    groupDetails: z.object({
        groupId: z.string()
    }),
})


export const CreateGroup = z.object({
    groupDetails: z.object({
        name: z.string(),
        handle: z.string(),
        bio: z.string().optional(),
        description: z.string().optional()
    }),
})


export const UpdateGroup = z.object({
    groupDetails: z.object({
        name: z.string(),
        handle: z.string(),
        bio: z.string().optional(),
        description: z.string().optional()
    }),
    groupId: z.string(),
    images: z.object({profile: z.string().optional(), cover: z.string().optional()}).optional(),
})


export const DeleteGroup = z.object({
    groupDetails: z.object({
        images: z.object({profile: z.string().optional(), cover: z.string().optional()}).optional(),
        groupId: z.string(),
    }),
})

export const GroupExists = z.object({
    handle: z.string()
})

export type GroupJoinDTO = z.infer<typeof GroupJoin>
export type CreateGroupDTO = z.infer<typeof CreateGroup>
export type GroupExistsDTO = z.infer<typeof GroupExists>
export type UpdateGroupDTO = z.infer<typeof UpdateGroup>
export type DeleteGroupDTO = z.infer<typeof DeleteGroup>