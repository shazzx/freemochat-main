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