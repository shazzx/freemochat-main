import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Profile } from "./reusable.parts";
import { ObjectId, Types } from "mongoose";
import { User } from "./user";



@Schema({ timestamps: true })
export class Friend {

    @Prop({ type: Types.ObjectId })
    user: ObjectId

    @Prop({ type: Types.ObjectId })
    friend: ObjectId

    @Prop({type: Number})
    interactionScore: Number

}

export const FriendSchema = SchemaFactory.createForClass(Friend)
FriendSchema.index({ user: 1, friend: 1 }, { unique: true })