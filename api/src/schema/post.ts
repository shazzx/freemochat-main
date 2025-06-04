import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";

class Location {
    @Prop({ type: Number, required: true })
    latitude: number;

    @Prop({ type: Number, required: true })
    longitude: number;

    @Prop({ type: String })
    address?: string;

    @Prop({ type: String })
    country?: string;

    @Prop({ type: String })
    city?: string;
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

    // Location where this specific media was captured
    @Prop({ type: Location })
    location?: Location;

    @Prop()
    capturedAt?: Date;
}

class PlantationData {
    @Prop({ type: String })
    plantType?: string;

    @Prop({ type: String })
    plantSpecies?: string;

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
    binType?: string;

    @Prop({ type: String })
    capacity?: string;

    @Prop({ type: String })
    material?: string;
}

class DamData {
    @Prop({ type: String })
    damType?: string;

    @Prop({ type: String })
    capacity?: string;

    @Prop({ type: String })
    purpose?: string;

    @Prop({ type: Number })
    estimatedDepth?: number;
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

    @Prop({ type: String, required: true })
    type: String;

    @Prop({
        type: String,
        enum: ['post', 'reel', 'plantation', 'garbage_collection', 'dam'],
        default: 'post'
    })
    postType: String;

    @Prop({ type: String })
    content: String;

    @Prop({ type: String, default: "public" })
    visibility: String;

    @Prop({ type: Array<Media> })
    media: Media[]

    // Main location for the post (can be average of media locations)
    @Prop({ type: Location })
    location?: Location;

    // Specific data based on post type
    @Prop({ type: PlantationData })
    plantationData?: PlantationData;

    @Prop({ type: GarbageCollectionData })
    garbageCollectionData?: GarbageCollectionData;

    @Prop({ type: DamData })
    damData?: DamData;

    // For plantation posts - tracks update history
    @Prop({ type: [{ updateDate: Date, imageCount: Number, notes: String }] })
    updateHistory?: Array<{
        updateDate: Date;
        imageCount: Number;
        notes: String;
    }>;

    @Prop()
    createdAt: Date
}

export const PostSchema = SchemaFactory.createForClass(Post)
PostSchema.index({ content: 1 });
PostSchema.index({ location: '2dsphere' }); // For geospatial queries
PostSchema.index({ postType: 1 });
PostSchema.index({ 'plantationData.nextUpdateDue': 1 }); // For notification queries