import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';
import { User } from './user';
import { ChatGroup } from './cgroup';

export enum MessageType {
    User = 'User',
    Group = 'ChatGroup',
    Page = 'Page'
}

class LastMessage {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sender: ObjectId;

    @Prop({ type: Buffer, required: true })
    encryptedContent: Buffer;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
}

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})
export class ChatItem {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: ObjectId

    @Prop({
        type: Types.ObjectId,
        refPath: 'type',
        required: true,
    })
    recepient: ObjectId

    @Prop({ type: String, enum: ["User", "Page", "ChatGroup"], required: true })
    type: string;

    @Prop({ type: String, enum: ["Text", "Voice", "File", "Image", "Video", "Audio Call", "Video Call", "Info"] })
    messageType: string;

    @Prop({ type: Date, default: null })
    removedAt: Date

    @Prop({ type: Date, default: null })
    chatRemovedAt: Date

    @Prop({ type: LastMessage, required: true })
    lastMessage: LastMessage;

    @Prop({ type: Number, default: 0 })
    unreadCount: number;

    @Prop({ type: Date, default: Date.now() })
    createdAt: Date;

}


// export class UserChatList extends Document {
//     @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
//     user: User | Types.ObjectId;

//     @Prop({ type: [ChatItem], default: [] })
//     chats: ChatItem[];
// }


export const ChatItemSchema = SchemaFactory.createForClass(ChatItem);

// Create a compound index for efficient sorting and querying
ChatItemSchema.index({ 'lastMessage.createdAt': -1 });