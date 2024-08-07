import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Date } from "./reusable.parts";
import { ObjectId, Types } from "mongoose";
import { Promotion } from "./promotion";


@Schema({timestamps: true})
export class Media {
    @Prop({ type: Types.ObjectId })
    targetId: ObjectId

    @Prop()
    videos: String[];

    @Prop()
    images: String[]
}

export const MediaSchema = SchemaFactory.createForClass(Media)