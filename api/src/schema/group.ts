import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({timestamps: true})
export class Group {
    @Prop()
    name: string;

    @Prop()
    profile: string;

    @Prop()
    cover: string;

    @Prop()
    bio: string;

    @Prop({type: String, unique: true})
    handle: String;

    @Prop({type: Boolean, default: null})
    isUploaded: Boolean

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId

    @Prop()
    description: string;

    @Prop({ type: [Types.ObjectId], ref: "User" })
    admins: ObjectId[]
}

export const GroupSchema = SchemaFactory.createForClass(Group)
GroupSchema.index({ handle: 1 });