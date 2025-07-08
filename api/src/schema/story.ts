import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Story {
    @Prop()
    url: String;

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId;

    @Prop({ type: [Types.ObjectId] })
    likedBy: ObjectId[]

    @Prop({
        type: Date,
        default: () => Date(),
        expires: '24h'
    })

    createdAt: Date
}

export const StorySchema = SchemaFactory.createForClass(Story)