import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class Location {

    @Prop()
    name: String

    @Prop()
    type: String

    @Prop({type: String, default: null})
    country: String

    @Prop({type: String, default: null})
    city: String
}

export const LocationSchema = SchemaFactory.createForClass(Location)