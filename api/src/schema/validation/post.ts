import {z} from 'zod'

export const GetPost = z.object({
    postId: z.string(),
})

export const LikePost = z.object({
    postId: z.string(),
    authorId: z.string(),
    targetId: z.string(),
    type: z.string(),
})

export const LikeCommentOrReply = z.object({
    targetId: z.string(),
})


export const BookmarkPost = z.object({
    postId: z.string(),
    targetId: z.string(),
    type: z.string(),
})

export type GetPostDTO = z.infer<typeof GetPost>
export type LikePostDTO = z.infer<typeof LikePost>
export type LikeCommentOrReplyDTO = z.infer<typeof LikeCommentOrReply>
export type BookmarkPostDTO = z.infer<typeof BookmarkPost>