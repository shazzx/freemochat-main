import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId, Types } from 'mongoose';

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

    @Prop({ type: Types.ObjectId })
    messageId: ObjectId

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

    @Prop({ type: LastMessage, required: true })
    lastMessage: LastMessage;

    @Prop({ type: Types.ObjectId })
    lastSentMessageId: ObjectId

    @Prop({ type: Types.ObjectId })
    lastDeliveredMessageId: ObjectId

    @Prop({ type: Types.ObjectId })
    lastSeenMessageId: ObjectId

    @Prop({ type: Date, default: Date.now() })
    createdAt: Date;

    @Prop({ type: Number, default: 0 })
    unreadCount: number;
}

export const ChatItemSchema = SchemaFactory.createForClass(ChatItem);

ChatItemSchema.index({ 'lastMessage.createdAt': -1 });