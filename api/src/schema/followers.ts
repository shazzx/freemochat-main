import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Follower {
    @Prop({ type: Types.ObjectId, ref: "User" })
    follower: ObjectId

    @Prop({ type: Types.ObjectId })
    targetId: ObjectId

    @Prop({ type: Number })
    interactionScore: Number

    @Prop({ type: String })
    type: String
}

const FollowerSchema = SchemaFactory.createForClass(Follower)
export default FollowerSchema