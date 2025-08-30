import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Notification {
    @Prop()
    value: String;

    @Prop()
    type: String;

    @Prop()
    targetType: String;

    @Prop()
    postType: String;

    @Prop()
    handle: String;

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId

    @Prop({ type: Types.ObjectId })
    targetId: ObjectId

    @Prop({ type: Types.ObjectId, ref: "User" })
    from: ObjectId

    @Prop({ type: Date })
    time: Date

    @Prop({ type: Boolean, default: false })
    isRead: Boolean
}

export const notificationSchema = SchemaFactory.createForClass(Notification)