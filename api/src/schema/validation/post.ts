import { z } from 'zod'
import { Cursor, ValidMongoId } from './global'


const LocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional()
});

// Type-specific data schemas
const PlantationDataSchema = z.object({
    plantType: z.string().optional(),
    plantSpecies: z.string().optional(),
    estimatedHeight: z.number().positive().optional(),
    updateNotes: z.string().optional() // For updates only
});

const GarbageCollectionDataSchema = z.object({
    binType: z.string().optional(),
    capacity: z.string().optional(),
    material: z.string().optional()
});

const DamDataSchema = z.object({
    damType: z.string().optional(),
    capacity: z.string().optional(),
    purpose: z.string().optional(),
    estimatedDepth: z.number().positive().optional()
});

// Your existing schema extended with location fields
export const CreatePost = z.object({
    targetId: ValidMongoId.optional(),
    content: z.string(),
    type: z.string(),
    visibility: z.string(),
    postType: z.string().optional(),

    // 🔧 NEW: Location fields (optional for backward compatibility)
    location: LocationSchema.optional(),
    mediaLocations: z.array(LocationSchema).optional(),

    // 🔧 NEW: Type-specific data (optional)
    plantationData: PlantationDataSchema.optional(),
    garbageCollectionData: GarbageCollectionDataSchema.optional(),
    damData: DamDataSchema.optional()
}).refine((data) => {
    // Validation: If it's a location post, require location data
    const isLocationPost = data.postType && ['plantation', 'garbage_collection', 'dam'].includes(data.postType);

    if (isLocationPost) {
        // For location posts, require mainLocation and mediaLocations
        if (!data.location) {
            return false; // mainLocation required for location posts
        }
        if (!data.mediaLocations || data.mediaLocations.length === 0) {
            return false; // At least one media location required
        }

        // Dam posts can only have 1 image/location
        if (data.postType === 'dam' && data.mediaLocations.length > 1) {
            return false;
        }
    }

    return true;
}, {
    message: "Location data is required for plantation, garbage collection, and dam posts"
});



export const CreateSharedPost = z.object({
    sharedPostId: ValidMongoId,
    content: z.string().optional(),
    type: z.string(),
    postType: z.string().optional(),
    visibility: z.string()
})

export const UpdatePost = z.object({
    postId: ValidMongoId,
    content: z.string(),
    type: z.string(),
    visibility: z.string(),
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
    postId: ValidMongoId,
    type: z.string(),
})

export const LikePost = z.object({
    postId: ValidMongoId,
    authorId: ValidMongoId.optional(),
    targetId: ValidMongoId.optional(),
    type: z.string().optional(),
    postType: z.string().optional(),
    reaction: z.string().optional(),
})


export const GetPostLikes = z.object({
    cursor: Cursor.optional(),
    postId: ValidMongoId,
})

export const LikeCommentOrReply = z.object({
    targetId: ValidMongoId,
    postType: z.string().optional(),
    authorId: ValidMongoId.optional(),
    reaction: z.string().optional()
})


export const BookmarkPost = z.object({
    postId: ValidMongoId,
    targetId: ValidMongoId,
    postType: z.string().optional(),
    type: z.string(),
})


export const ReportPost = z.object({
    postId: ValidMongoId,
    reportData: z.object({
        userId: ValidMongoId,
        reportMessage: z.string(),
        type: z.string().optional(),
    }),
})

export const GetPromotions = Cursor.extend({
    reverse: z.string(),
})

export const PromotePost = z.object({
    postId: ValidMongoId,
    isApp: z.string(),
    promotionDetails: z.object({
        reachTarget: z.number(),
        targetAddress: z.object({
            country: z.string(),
            city: z.string().nullable().optional(),
            area: z.string().nullable().optional()
        })
    }),
})

export const ViewPost = z.object({
    postId: ValidMongoId,
    type: z.string()
})


export const BulkViewPost = z.object({
    type: z.string(),
    viewedPosts: z.array(z.string()),
})


export const PromotionActivation = z.object({
    postId: ValidMongoId,
})

export type CreatePostDTO = z.infer<typeof CreatePost>
export type CreateSharedPostDTO = z.infer<typeof CreateSharedPost>
export type UpdatePostDTO = z.infer<typeof UpdatePost>
export type DeletePostDTO = z.infer<typeof DeletePost>
export type GetPostDTO = z.infer<typeof GetPost>
export type LikePostDTO = z.infer<typeof LikePost>
export type GetPostLikestDTO = z.infer<typeof GetPostLikes>
export type LikeCommentOrReplyDTO = z.infer<typeof LikeCommentOrReply>
export type BookmarkPostDTO = z.infer<typeof BookmarkPost>
export type GetBookmarkedPostsDTO = z.infer<typeof Cursor>
export type GetPromotionsDTO = z.infer<typeof GetPromotions>
export type ReportPostDTO = z.infer<typeof ReportPost>
export type PromotePostDTO = z.infer<typeof PromotePost>
export type ViewPostDTO = z.infer<typeof ViewPost>
export type BulkViewPostDTO = z.infer<typeof BulkViewPost>
export type PromotionActivationDTO = z.infer<typeof PromotionActivation>


// environmental-contribution

// Add these at the end of your existing validation file (after all the export types)

// 🔧 Server-side types for computed fields (resolves TypeScript errors)
export type ServerPlantationData = NonNullable<CreatePostDTO['plantationData']> & {
    lastUpdateDate?: Date;
    nextUpdateDue?: Date;
    isActive?: boolean;
};

export type ServerGarbageCollectionData = NonNullable<CreatePostDTO['garbageCollectionData']> & {
    // Add any server-computed fields if needed in the future
};

export type ServerDamData = NonNullable<CreatePostDTO['damData']> & {
    // Add any server-computed fields if needed in the future
};

export interface UpdateHistoryItem {
    updateDate: Date;
    imageCount: number;
    notes: string;
}

export interface MediaWithLocation {
    type: string;
    url: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
        country?: string;
        city?: string;
    };
    capturedAt?: Date;
    thumbnail?: string; // For videos
}

// 🔧 FIX: More explicit ServerPostData type to avoid assignment issues
export interface ServerPostData {
    // From CreatePostDTO (required fields)
    content?: string;
    type?: string;
    visibility?: string;

    // Optional fields from CreatePostDTO
    targetId?: any; // Will be set as ObjectId in controller
    postType?: string;
    location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
        country?: string;
        city?: string;
    };
    mediaLocations?: Array<{
        latitude?: number;
        longitude?: number;
        address?: string;
        country?: string;
        city?: string;
    }>;

    // Server-enhanced type-specific data
    plantationData?: ServerPlantationData;
    garbageCollectionData?: ServerGarbageCollectionData;
    damData?: ServerDamData;

    // Server-added fields
    updateHistory?: UpdateHistoryItem[];
    user?: any; // ObjectId
    isUploaded?: boolean | null;
    media?: MediaWithLocation[];
}