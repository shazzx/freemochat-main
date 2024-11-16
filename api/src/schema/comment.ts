import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";

@Schema({ timestamps: true })
export class Comment extends Document {
    @Prop({ type: Types.ObjectId, ref: "Post" })
    post: ObjectId

    @Prop({ type: Object })
    audio: {
        src: String,
        duration: String,
    }

    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    user: ObjectId

    @Prop({ type: String})
    content: String;

    @Prop({ type: String, required: true })
    type: String;

    @Prop({ type: Types.ObjectId, ref: "Comment" })
    parentId: ObjectId

    @Prop({ type: Date, default: Date.now() })
    createdAt: Date

    @Prop({ type: Number, default: 0 })
    likesCount: Number
}

export const CommentSchema = SchemaFactory.createForClass(Comment)
