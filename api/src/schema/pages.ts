import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'

@Schema({timestamps: true})
export class Page {
    @Prop()
    name: String;

    @Prop({type: String, unique: true})
    handle: String;

    @Prop({type: String})
    profile: string

    @Prop({type: String})
    cover: string

    // this property is only for profile images to know about background image processing 
    @Prop({type: Boolean, default: null})
    isUploaded: Boolean

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId

    @Prop()
    about: String;

    @Prop({ type: [Types.ObjectId], ref: "User" })
    admins: ObjectId[]
}

export const PageSchema = SchemaFactory.createForClass(Page)