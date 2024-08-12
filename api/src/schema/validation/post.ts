import { z } from 'zod'
import { Cursor, ValidMongoId } from './global'


export const CreatePost = z.object({
    targetId: ValidMongoId.optional(),
    content: z.string(),
    type: z.string(),
})

export const UpdatePost = z.object({
    postId: ValidMongoId,
    content: z.string(),
    type: z.string(),
    media: z.array(z.object({
        url: z.string(),
        remove: z.boolean().optional(),
        type: z.string(),
    })),
})

export const DeletePost = z.object({
    postDetails: z.object({
        postId: ValidMongoId,
        media: z.array(z.object({ url: z.string(), type: z.string() })).optional(),
    }),
})

export const GetPost = z.object({
    postId: z.string(),
})

export const LikePost = z.object({
    postId: ValidMongoId,
    authorId: z.string(),
    targetId: z.string(),
    type: z.string(),
})

export const LikeCommentOrReply = z.object({
    targetId: ValidMongoId,
})


export const BookmarkPost = z.object({
    postId: ValidMongoId,
    targetId: ValidMongoId,
    type: z.string(),
})

export const ReportPost = z.object({
    postId: ValidMongoId,
    reportData: z.object({
        userId: ValidMongoId,
        reportMessage: z.string(),
        type: z.string(),

    }),
})

export const GetPromotions = Cursor.extend({
    reverse: z.string(),
})


export const PromotePost = z.object({
    postId: ValidMongoId,
    promotionDetails: z.object({
        reachTarget: z.number(),
    }),
})

export const ViewPost = z.object({
    postId: ValidMongoId,
    type: z.string()
})


export const PromotionActivation = z.object({
    postId: ValidMongoId,
})



export type CreatePostDTO = z.infer<typeof CreatePost>
export type UpdatePostDTO = z.infer<typeof UpdatePost>
export type DeletePostDTO = z.infer<typeof DeletePost>
export type GetPostDTO = z.infer<typeof GetPost>
export type LikePostDTO = z.infer<typeof LikePost>
export type LikeCommentOrReplyDTO = z.infer<typeof LikeCommentOrReply>
export type BookmarkPostDTO = z.infer<typeof BookmarkPost>
export type GetPromotionsDTO = z.infer<typeof GetPromotions>
export type ReportPostDTO = z.infer<typeof ReportPost>
export type PromotePostDTO = z.infer<typeof PromotePost>
export type ViewPostDTO = z.infer<typeof ViewPost>
export type PromotionActivationDTO = z.infer<typeof PromotionActivation>