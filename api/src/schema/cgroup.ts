import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true })
export class ChatGroup {
    @Prop()
    name: string;

    @Prop()
    profile: string

    @Prop()
    cover: string

    // this property is only for profile images to know about background image processing 
    @Prop({ type: Boolean, default: null })
    isUploaded: Boolean

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId

    @Prop()
    description: string;

    @Prop({ type: [Types.ObjectId], ref: "User" })
    admins: ObjectId[]
}

export const ChatGroupSchema = SchemaFactory.createForClass(ChatGroup)