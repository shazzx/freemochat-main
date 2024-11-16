import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true })
export class FriendRequest {
    @Prop({ type: Types.ObjectId, ref: "User", unique: false })
    sender: ObjectId

    @Prop({ type: Types.ObjectId, ref: "User", unique: false })
    reciever: ObjectId
}

const FriendRequestsSchema = SchemaFactory.createForClass(FriendRequest)

export default FriendRequestsSchema