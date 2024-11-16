import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ObjectId, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Member {
    @Prop({ type: Types.ObjectId, ref: "User" })
    member: ObjectId

    @Prop({type: Number, default: 0})
    isAdmin: Number

    @Prop({ type: Number })
    interactionScore: Number
    
    @Prop({ type: Types.ObjectId })
    groupId: ObjectId

    @Prop({ type: String })
    type: String
}

const MemberSchema = SchemaFactory.createForClass(Member)
export default MemberSchema