import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'


class Images {
    @Prop()
    profile: string;

    @Prop()
    cover: string
}

@Schema()
export class ChatGroup {
    @Prop()
    name: string;

    @Prop()
    images: Images

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId

    @Prop()
    description: string;

    @Prop({ type: [Types.ObjectId], ref: "User" })
    admins: ObjectId[]
}

export const ChatGroupSchema = SchemaFactory.createForClass(ChatGroup)