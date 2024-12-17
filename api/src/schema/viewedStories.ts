import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { ObjectId, Types } from "mongoose"


@Schema({ timestamps: true, expires: '24h' })
export class ViewedStories {
    @Prop({ type: Types.ObjectId, ref: "Post" })
    storyId: ObjectId

    @Prop({ type: Types.ObjectId, ref: "User" })
    userId: ObjectId
}

export const ViewedStoriesSchema = SchemaFactory.createForClass(ViewedStories)