import { z } from 'zod'
import { Cursor, ValidMongoId } from './global'

export const GetMembers = Cursor.extend({
    groupId: ValidMongoId
})

export const JoinGroup = z.object({
    groupDetails: z.object({
        groupId: z.string(),
        userId: z.string().optional()
    })
})

export const ToggleAdmin = z.object({
    groupId: z.string(),
    userId: z.string(),
    // isChatGroup: z.boolean()
})

export const RemoveMember = z.object({
    groupId: z.string(),
    userId: z.string(),
})

export type GetMembersDTO = z.infer<typeof GetMembers>
export type JoinGroupDTO = z.infer<typeof JoinGroup>
export type ToggleAdminDTO = z.infer<typeof ToggleAdmin>
export type RemoveMemberDTO = z.infer<typeof RemoveMember>