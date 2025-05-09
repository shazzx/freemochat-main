import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'
import { User } from "./user";
import { ChatGroup } from "./cgroup";

class Media {
    url: String;
    type: String;
    duration: String;
    isUploaded: String;
}

@Schema({ timestamps: true })
export class Message {
    @Prop()
    type: String;

    @Prop({ type: Types.ObjectId, ref: "User" })
    sender: ObjectId

    @Prop({ type: String, enum: ["Text", "Voice", "File", "Image", "Video", "Audio Call", "Video Call", "Group", "Info"] })
    messageType: string;

    @Prop({ type: Types.ObjectId })
    recepient: (User | ChatGroup)

    @Prop({ type: Media })
    media: Media

    @Prop()
    content: String

    @Prop({ type: [{ userId: Types.ObjectId, deletedAt: Date }] })
    deletedFor: Array<{ userId: ObjectId, deletedAt: Date }>
    // @Prop({ type: Date, default: Date.now })
    // createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message)