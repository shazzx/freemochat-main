import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";

@Schema({ timestamps: true })
export class Hashtag {
    @Prop({ type: String, required: true, unique: true, index: true })
    name: string;

    @Prop({ type: String, required: true })
    displayName: string;

    @Prop({ type: Number, default: 0, index: true })
    usageCount: number;

    @Prop({ type: Number, default: 0, index: true })
    postsCount: number;

    @Prop({ type: Date, default: Date.now, index: true })
    lastUsed: Date;

    @Prop({ type: [Types.ObjectId], ref: 'Post' })
    posts: Types.ObjectId[];

    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const HashtagSchema = SchemaFactory.createForClass(Hashtag);

HashtagSchema.index({ name: 'text', displayName: 'text' });

HashtagSchema.index({ usageCount: -1, lastUsed: -1 });