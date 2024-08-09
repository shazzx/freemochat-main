import {z} from 'zod'

export const PageFollow = z.object({
    pageDetails: z.object({
        pageId: z.string()
    }),
})


export const CreatePage = z.object({
    pageDetails: z.object({
        name: z.string(),
        handle: z.string(),
        about: z.string()
    }),
})


export const UpdatePage = z.object({
    pageDetails: z.object({
        name: z.string(),
        handle: z.string(),
        about: z.string()
    }),
    pageId: z.string(),
    images: z.array(z.object({
        url: z.string(),
        fileName: z.string().optional()
    })).optional(),
})


export const DeletePage = z.object({
    pageDetails: z.object({
        images: z.array(z.string()).optional(),
        pageId: z.string(),
    }),
})

export const PageExists = z.object({
    handle: z.string()
})

export type PageFollowDTO = z.infer<typeof PageFollow>
export type CreatePageDTO = z.infer<typeof CreatePage>
export type PageExistsDTO = z.infer<typeof PageExists>
export type UpdatePageDTO = z.infer<typeof UpdatePage>
export type DeletePageDTO = z.infer<typeof DeletePage>
