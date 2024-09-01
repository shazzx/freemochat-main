import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { ObjectId, Types } from "mongoose"


@Schema({ timestamps: true })
export class ViewedPosts {
    @Prop({ type: Types.ObjectId, ref: "Post" })
    postId: ObjectId

    @Prop({ type: Types.ObjectId, ref: "User" })
    userId: ObjectId

    @Prop({ type: String })
    type: String
}

export const ViewedPostsSchema = SchemaFactory.createForClass(ViewedPosts)
ViewedPostsSchema.index({ userId: 1, postId: 1, type: 1 }, { unique: true })