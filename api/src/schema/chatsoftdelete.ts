import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({timestamps: true})
export class MessageSoftDelete {
    @Prop({ type: Types.ObjectId })
    recepient: ObjectId

    @Prop({ type: Types.ObjectId })
    user: ObjectId

    @Prop({type: Types.ObjectId})
    lastDeletedId: ObjectId
}

export const MessageSoftDeleteSchema = SchemaFactory.createForClass(MessageSoftDelete)