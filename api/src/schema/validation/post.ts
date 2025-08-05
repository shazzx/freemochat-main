// Add these indexes to your Post schema for better performance:
// PostSchema.index({ "location.country": 1, postType: 1 });
// PostSchema.index({ "location.city": 1, postType: 1 });
// PostSchema.index({ postType: 1, visibility: 1, createdAt: -1 });
// PostSchema.index({ "location.latitude": 1, "location.longitude": 1, postType: 1 });

import { z } from 'zod'
import { Cursor, ValidMongoId } from './global'
import { Types } from 'mongoose';

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

// Environmental Contribution Data Schemas (for separate EnvironmentalContribution document)
const PlantationDataSchema = z.object({
    type: z.string().optional(), // matches schema field name
    species: z.string().optional(), // matches schema field name
    estimatedHeight: z.number().positive().optional(),
    lastUpdateDate: z.date().optional(),
    nextUpdateDue: z.date().optional(),
    isActive: z.boolean().default(true).optional()
});

const GarbageCollectionDataSchema = z.object({
    type: z.string().optional(), // Recycling, Organic, General, etc.
    capacity: z.string().optional(),
    material: z.string().optional()
});

const WaterPondsDataSchema = z.object({
    type: z.string().optional(), // Storage, Decorative, Irrigation, etc.
    capacity: z.string().optional(),
    purpose: z.string().optional(),
    estimatedDepth: z.number().positive().optional()
});

const RainWaterDataSchema = z.object({
    type: z.string().optional(), // Rooftop, Ground catchment, etc.
    capacity: z.string().optional(),
    storageMethod: z.string().optional(),
    estimatedVolume: z.number().positive().optional()
});

const UpdateHistoryItemSchema = z.object({
    updateDate: z.string().datetime(),
    media: z.array(MediaSchema),
    notes: z.string().optional()
});

// Updated Post Schema - simplified, no environmental data
export const CreatePost = z.object({
    targetId: ValidMongoId.optional(),
    username: z.string().optional(),
    content: z.string().optional(),
    type: z.string(),
    postType: z.enum(['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water']).default('post'),
    visibility: z.string().default('public'),
    mentions: z.array(ValidMongoId).max(50).optional().default([]),
    location: LocationSchema.optional(),
    projectDetails: ProjectDetailsSchema.optional(),
    hashtags: z.array(z.string()).optional().default([])
}).refine((data) => {
    // If it's an environmental post type, require projectDetails
    const isEnvironmentalPost = ['plantation', 'garbage_collection', 'water_ponds', 'rain_water'].includes(data.postType);

    if (isEnvironmentalPost && !data.projectDetails) {
        return false;
    }

    return true;
}, {
    message: "Project details are required for environmental contribution posts"
});

// Separate Environmental Contribution Schema
export const CreateEnvironmentalContribution = z.object({
    elementId: ValidMongoId.optional(),
    postId: ValidMongoId,
    media: z.array(MediaSchema).optional().default([]),
    location: LocationSchema.optional(),
    plantationData: PlantationDataSchema.optional(),
    garbageCollectionData: GarbageCollectionDataSchema.optional(),
    waterPondsData: WaterPondsDataSchema.optional(),
    rainWaterData: RainWaterDataSchema.optional(),
    // updateHistory: z.array(UpdateHistoryItemSchema).optional().default([])
}).refine((data) => {
    // Ensure at least one environmental data type is provided
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

// Update Environmental Contribution Schema
export const UpdateEnvironmentalContribution = z.object({
    elementId: ValidMongoId,
    postId: ValidMongoId,
    // media: z.array(MediaSchema).optional(),
    // location: LocationSchema.optional(),
    plantationData: PlantationDataSchema.optional(),
    garbageCollectionData: GarbageCollectionDataSchema.optional(),
    waterPondsData: WaterPondsDataSchema.optional(),
    rainWaterData: RainWaterDataSchema.optional(),
    updateHistory: z.array(UpdateHistoryItemSchema).optional().default([])
});

// Existing schemas (updated where necessary)
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

// Map-related schemas
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

// Type exports
export type CreatePostDTO = z.infer<typeof CreatePost>;
export type CreateEnvironmentalContributionDTO = z.infer<typeof CreateEnvironmentalContribution>;
export type UpdateEnvironmentalContributionDTO = z.infer<typeof UpdateEnvironmentalContribution>;
export type CreateSharedPostDTO = z.infer<typeof CreateSharedPost>;
export type UpdatePostDTO = z.infer<typeof UpdatePost>;
export type UpdateProjectDTO = z.infer<typeof UpdateProject>;
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

// Server-side interfaces for enhanced data
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

// Server-enhanced Post data type
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

// Server-enhanced Environmental Contribution data type
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