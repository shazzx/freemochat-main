import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true, expires: '10m' })
export class Story {
    @Prop()
    url: String;

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId;

    @Prop({ default: Date.now, expires: '24h' })
    date: Date
}

export const StorySchema = SchemaFactory.createForClass(Story)