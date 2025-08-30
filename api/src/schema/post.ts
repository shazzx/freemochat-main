import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";

export class Location {
    @Prop({ type: Number, required: true })
    latitude: number;

    @Prop({ type: Number, required: true })
    longitude: number;

    @Prop({ type: String })
    address?: string;

    @Prop({ type: Number })
    accuracy?: number;

    @Prop({ type: String })
    country?: string;

    @Prop({ type: String })
    city?: string;
}

class ProjectDetails {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: String })
    owner?: string;
}

class Media {
    @Prop()
    name: string;

    @Prop()
    url: string;

    @Prop()
    watermarkUrl: string;

    @Prop()
    type: string;

    @Prop()
    thumbnail: string;

    @Prop()
    capturedAt?: Date;
}

class PlantationData {
    @Prop({ type: String })
    type?: string;

    @Prop({ type: String })
    species?: string;

    @Prop({ type: Number })
    estimatedHeight?: number;

    @Prop({ type: Date })
    lastUpdateDate?: Date;

    @Prop({ type: Date })
    nextUpdateDue?: Date;

    @Prop({ type: Boolean, default: true })
    isActive?: boolean;
}

class GarbageCollectionData {
    @Prop({ type: String })
    type?: string; 

    @Prop({ type: String })
    capacity?: string;

    @Prop({ type: String })
    material?: string;
}

class WaterPondsData {
    @Prop({ type: String })
    type?: string; 

    @Prop({ type: String })
    capacity?: string;

    @Prop({ type: String })
    purpose?: string;

    @Prop({ type: Number })
    estimatedDepth?: number;
}

class RainWaterData {
    @Prop({ type: String })
    type?: string;

    @Prop({ type: String })
    capacity?: string;

    @Prop({ type: String })
    storageMethod?: string;

    @Prop({ type: Number })
    estimatedVolume?: number;
}

@Schema({ timestamps: true })
export class Post {
    @Prop({ type: Types.ObjectId, refPath: 'type', required: true, index: true })
    targetId: ObjectId

    @Prop({ type: String })
    username: String

    @Prop({ type: Boolean })
    isUploaded: Boolean

    @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
    user: ObjectId

    @Prop({ type: Types.ObjectId })
    sharedPost: ObjectId

    @Prop({ type: String })
    backgroundColor: String;

    @Prop({ type: String, required: true })
    type: String;

    @Prop({
        type: String,
        enum: ['post', 'plantation', 'garbage_collection', 'water_ponds', 'rain_water'],
        default: 'post'
    })
    postType: String;

    @Prop({ type: String })
    content: String;

    @Prop({ type: String, default: "public" })
    visibility: String;

    @Prop({ type: Array<Media> })
    media: Media[]

    @Prop({ type: Location })
    location?: Location;

    @Prop({ type: ProjectDetails })
    projectDetails?: ProjectDetails;


    @Prop([{ type: String }])
    hashtags: string[];

    @Prop([{ type: Types.ObjectId, ref: 'User' }])
    mentions: Types.ObjectId[];


    @Prop()
    createdAt: Date
}

export const PostSchema = SchemaFactory.createForClass(Post)
PostSchema.index({ content: 1 });
PostSchema.index({ location: '2dsphere' });
PostSchema.index({ postType: 1 });
PostSchema.index({ 'plantationData.nextUpdateDue': 1 });
PostSchema.index({ hashtags: 1 });

@Schema({ timestamps: true })
export class EnvironmentalContribution {
    @Prop({ type: Types.ObjectId, ref: "Post", required: true, index: true })
    postId: ObjectId;

    @Prop({ type: Array<Media> })
    media: Media[]

    @Prop({ type: Location })
    location?: Location;

    @Prop({ type: PlantationData })
    plantationData?: PlantationData;

    @Prop({ type: GarbageCollectionData })
    garbageCollectionData?: GarbageCollectionData;

    @Prop({ type: WaterPondsData })
    waterPondsData?: WaterPondsData;

    @Prop({ type: RainWaterData })
    rainWaterData?: RainWaterData;


    @Prop({ type: [{ updateDate: Date, media: Array<Media>, notes: String }] })
    updateHistory?: Array<{
        updateDate: Date;
        media: Media[];
        notes: String;
    }>;

    @Prop()
    createdAt: Date
}

export const EnvironmentalContributionSchema = SchemaFactory.createForClass(EnvironmentalContribution);

EnvironmentalContributionSchema.index({ location: '2dsphere' });