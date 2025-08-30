import { z } from 'zod'
import { Cursor, ValidMongoId } from './global'
import { Types } from 'mongoose';

export type EnvironmentalContributionType = 'plantation' | 'garbage_collection' | 'water_ponds' | 'rain_water';
export interface ValidationResult {
    isValid: boolean;
    confidence: number;
    detectedLabels: string[];
    reason?: string;
    suggestedCategory?: EnvironmentalContributionType;
}

const LocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(100),
    address: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional()
});

const ProjectDetailsSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    owner: z.string().optional()
});

const MediaSchema = z.object({
    name: z.string().optional(),
    url: z.string().optional(),
    watermarkUrl: z.string().optional(),
    type: z.string().optional(),
    thumbnail: z.string().optional(),
    capturedAt: z.string().optional()
});

const PlantationDataSchema = z.object({
    type: z.string().optional(),
    species: z.string().optional(),
    estimatedHeight: z.number().positive().optional(),
    lastUpdateDate: z.date().optional(),
    nextUpdateDue: z.date().optional(),
    isActive: z.boolean().default(true).optional()
});

const GarbageCollectionDataSchema = z.object({
    type: z.string().optional(),
    capacity: z.string().optional(),
    material: z.string().optional()
});

const WaterPondsDataSchema = z.object({
    type: z.string().optional(),
    capacity: z.string().optional(),
    purpose: z.string().optional(),
    estimatedDepth: z.number().positive().optional()
});

const RainWaterDataSchema = z.object({
    type: z.string().optional(),
    capacity: z.string().optional(),
    storageMethod: z.string().optional(),
    estimatedVolume: z.number().positive().optional()
});

const UpdateHistoryItemSchema = z.object({
    updateDate: z.string().datetime(),
    media: z.array(MediaSchema),
    notes: z.string().optional()
});

export const CreatePost = z.object({
    targetId: ValidMongoId.optional(),
    username: z.string().optional(),
    content: z.string().optional(),
    backgroundColor: z.string().optional(),
    type: z.string(),
    postType: z.enum(['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water']).default('post'),
    visibility: z.string().default('public'),
    mentions: z.array(ValidMongoId).max(50).optional().default([]),
    location: LocationSchema.optional(),
    projectDetails: ProjectDetailsSchema.optional(),
    hashtags: z.array(z.string()).optional().default([])
}).refine((data) => {
    const isEnvironmentalPost = ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'].includes(data.postType);

    if (isEnvironmentalPost && !data.projectDetails) {
        return false;
    }

    return true;
}, {
    message: "Project details are required for environmental contribution posts"
});

export const CreateEnvironmentalContribution = z.object({
    elementId: ValidMongoId.optional(),
    postId: ValidMongoId,
    media: z.array(MediaSchema).optional().default([]),
    location: LocationSchema.optional(),
    plantationData: PlantationDataSchema.optional(),
    garbageCollectionData: GarbageCollectionDataSchema.optional(),
    waterPondsData: WaterPondsDataSchema.optional(),
    rainWaterData: RainWaterDataSchema.optional(),
}).refine((data) => {
    const hasEnvironmentalData = !!(
        data.plantationData ||
        data.garbageCollectionData ||
        data.waterPondsData ||
        data.rainWaterData
    );

    return hasEnvironmentalData;
}, {
    message: "At least one environmental data type must be provided"
});

export const UpdateEnvironmentalContribution = z.object({
    elementId: ValidMongoId,
    postId: ValidMongoId,
    plantationData: PlantationDataSchema.optional(),
    garbageCollectionData: GarbageCollectionDataSchema.optional(),
    waterPondsData: WaterPondsDataSchema.optional(),
    rainWaterData: RainWaterDataSchema.optional(),
    updateHistory: z.array(UpdateHistoryItemSchema).optional().default([])
});

export const CreateSharedPost = z.object({
    sharedPostId: ValidMongoId,
    content: z.string().optional(),
    type: z.string(),
    postType: z.enum(['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water']).optional(),
    visibility: z.string().default('public')
});

export const UpdatePost = z.object({
    postId: ValidMongoId,
    content: z.string().optional(),
    backgroundColor: z.string().optional(),
    type: z.string(),
    mentions: z.array(ValidMongoId).max(50).optional().default([]),
    visibility: z.string(),
    projectDetails: ProjectDetailsSchema.optional(),
    media: z.array(z.object({
        url: z.string(),
        remove: z.boolean().optional(),
        type: z.string(),
    })).optional(),
});

export const UpdateProject = z.object({
    postId: ValidMongoId,
    projectDetails: ProjectDetailsSchema.optional(),
});


export const DeleteProject = z.object({
    postId: ValidMongoId,
});

export const DeleteElement = z.object({
    postId: ValidMongoId,
    elementId: ValidMongoId,
});

export const DeletePost = z.object({
    postDetails: z.object({
        postId: ValidMongoId,
        media: z.array(z.object({ url: z.string(), type: z.string() })).optional(),
    }),
});

export const GetPost = z.object({
    postId: ValidMongoId,
    type: z.string(),
});

export const LikePost = z.object({
    postId: ValidMongoId,
    authorId: ValidMongoId.optional(),
    targetId: ValidMongoId.optional(),
    type: z.string().optional(),
    postType: z.string().optional(),
    reaction: z.string().optional(),
});

export const GetPostLikes = z.object({
    cursor: Cursor.optional(),
    postId: ValidMongoId,
});

export const LikeCommentOrReply = z.object({
    targetId: ValidMongoId,
    postType: z.string().optional(),
    authorId: ValidMongoId.optional(),
    reaction: z.string().optional()
});

export const BookmarkPost = z.object({
    postId: ValidMongoId,
    targetId: ValidMongoId,
    postType: z.string().optional(),
    type: z.string(),
});

export const ReportPost = z.object({
    postId: ValidMongoId,
    reportData: z.object({
        userId: ValidMongoId,
        reportMessage: z.string(),
        type: z.string().optional(),
    }),
});

export const GetPromotions = Cursor.extend({
    reverse: z.string(),
});

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
});

export const ViewPost = z.object({
    postId: ValidMongoId,
    type: z.string()
});

export const BulkViewPost = z.object({
    type: z.string(),
    viewedPosts: z.array(z.string()),
});

export const PromotionActivation = z.object({
    postId: ValidMongoId,
});

const BoundingBoxSchema = z.object({
    northEast: z.object({
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180)
    }),
    southWest: z.object({
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180)
    })
});

export const GetGlobalMapData = z.object({
    bounds: BoundingBoxSchema,
    category: z.enum(['plantation', 'garbage_collection', 'water_ponds', 'rain_water', 'all']).default('all'),
    limit: z.coerce.number().min(1).max(1000).default(500),
    clustering: z.coerce.boolean().default(true),
    clusterRadius: z.coerce.number().min(10).max(100).default(50)
});

export const GetGlobalMapCounts = z.object({
    bounds: BoundingBoxSchema.optional(),
    country: z.string().optional(),
    city: z.string().optional()
});

export const SearchGlobalMapLocations = z.object({
    query: z.string().min(1).max(100),
    category: z.enum(['plantation', 'garbage_collection', 'water_ponds', 'rain_water', 'all']).default('all'),
    limit: z.coerce.number().min(1).max(50).default(20)
});

export type CreatePostDTO = z.infer<typeof CreatePost>;
export type CreateEnvironmentalContributionDTO = z.infer<typeof CreateEnvironmentalContribution>;
export type UpdateEnvironmentalContributionDTO = z.infer<typeof UpdateEnvironmentalContribution>;
export type CreateSharedPostDTO = z.infer<typeof CreateSharedPost>;
export type UpdatePostDTO = z.infer<typeof UpdatePost>;
export type UpdateProjectDTO = z.infer<typeof UpdateProject>;
export type DeleteProjectDTO = z.infer<typeof DeleteProject>;
export type DeleteElementDTO = z.infer<typeof DeleteElement>;
export type DeletePostDTO = z.infer<typeof DeletePost>;
export type GetPostDTO = z.infer<typeof GetPost>;
export type LikePostDTO = z.infer<typeof LikePost>;
export type GetPostLikestDTO = z.infer<typeof GetPostLikes>;
export type LikeCommentOrReplyDTO = z.infer<typeof LikeCommentOrReply>;
export type BookmarkPostDTO = z.infer<typeof BookmarkPost>;
export type GetBookmarkedPostsDTO = z.infer<typeof Cursor>;
export type GetPromotionsDTO = z.infer<typeof GetPromotions>;
export type ReportPostDTO = z.infer<typeof ReportPost>;
export type PromotePostDTO = z.infer<typeof PromotePost>;
export type ViewPostDTO = z.infer<typeof ViewPost>;
export type BulkViewPostDTO = z.infer<typeof BulkViewPost>;
export type PromotionActivationDTO = z.infer<typeof PromotionActivation>;
export type GetGlobalMapDataDTO = z.infer<typeof GetGlobalMapData>;
export type GetGlobalMapCountsDTO = z.infer<typeof GetGlobalMapCounts>;
export type SearchGlobalMapLocationsDTO = z.infer<typeof SearchGlobalMapLocations>;

export interface MediaWithLocation {
    name?: string;
    url: string;
    watermarkUrl?: string;
    type: string;
    thumbnail?: string;
    capturedAt?: Date;
}

export interface UpdateHistoryItem {
    updateDate: Date;
    media: MediaWithLocation[];
    notes?: string;
}

export interface ServerPostData {
    targetId?: Types.ObjectId;
    username?: string;
    isUploaded?: boolean;
    user: Types.ObjectId;
    sharedPost?: Types.ObjectId;
    type: string;
    postType?: string;
    content?: string;
    visibility: string;
    media?: MediaWithLocation[];
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
        country?: string;
        city?: string;
    };
    projectDetails?: {
        name: string;
        description: string;
        owner?: string;
    };
    hashtags?: string[];
    mentions?: Types.ObjectId[];
    createdAt?: Date;
}

export interface ServerEnvironmentalContributionData {
    postId: Types.ObjectId;
    media?: MediaWithLocation[];
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
        country?: string;
        city?: string;
    };
    plantationData?: {
        type?: string;
        species?: string;
        estimatedHeight?: number;
        lastUpdateDate?: Date;
        nextUpdateDue?: Date;
        isActive?: boolean;
    };
    garbageCollectionData?: {
        type?: string;
        capacity?: string;
        material?: string;
    };
    waterPondsData?: {
        type?: string;
        capacity?: string;
        purpose?: string;
        estimatedDepth?: number;
    };
    rainWaterData?: {
        type?: string;
        capacity?: string;
        storageMethod?: string;
        estimatedVolume?: number;
    };
    updateHistory?: UpdateHistoryItem[];
    createdAt?: Date;
}