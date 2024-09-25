import {z} from 'zod'

export const GroupJoin = z.object({
    groupDetails: z.object({
        groupId: z.string()
    }),
})

export const CreateChatGroup = z.object({
    groupDetails: z.object({
        name: z.string(),
        description: z.string()
    }),
})

export const UpdateChatGroup = z.object({
    groupDetails: z.object({
        name: z.string(),
        handle: z.string(),
        description: z.string()
    }),
    groupId: z.string(),
    images: z.array(z.object({
        url: z.string(),
        fileName: z.string().optional()
    })).optional(),
})


export const DeleteGroup = z.object({
    groupDetails: z.object({
        images: z.array(z.string()).optional(),
        groupId: z.string(),
    }),
})

export const GetChatGroup = z.object({
    id: z.string()
})


export const JoinGroup = z.object({
    groupDetails: z.object({
        groupId: z.string(),
        userId: z.string().optional(),
        type: z.string()
    }),
})

export type GroupJoinDTO = z.infer<typeof GroupJoin>
export type CreateChatGroupDTO = z.infer<typeof CreateChatGroup>
export type GetChatGroupDTO = z.infer<typeof GetChatGroup>
export type UpdateChatGroupDTO = z.infer<typeof UpdateChatGroup>
export type DeleteGroupDTO = z.infer<typeof DeleteGroup>
export type JoinGroupDTO = z.infer<typeof JoinGroup>