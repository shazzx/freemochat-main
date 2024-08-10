import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from 'mongoose'


class Images {
    @Prop()
    profile: String;

    @Prop()
    cover: String
}

@Schema()
export class Page {
    @Prop()
    name: String;

    @Prop()
    handle: String;

    @Prop()
    images: Images

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