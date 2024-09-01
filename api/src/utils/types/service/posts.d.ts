export type SPostPromotion = {
    userId: string,
    postId: string,
    isApp: string,
    promotionDetails?: {
        reachTarget?: number,
        targetAddress?: {
            country?: string,
            city?: string,
            area?: string,
        }
    }

}

export type SViewPost = {
    userId: string,
    postId: string,
    type: string,
}


export type SBulkViewPost = {
    userId: string,
    postIds: string[],
    type: string,
}