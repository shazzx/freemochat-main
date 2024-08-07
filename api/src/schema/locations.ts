import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";

@Schema({ timestamps: true })
export class Location {

    @Prop()
    name: String

    @Prop()
    type: String
    // type can be country, city, area
}

export const LocationSchema = SchemaFactory.createForClass(Location)
// FriendSchema.index({ user: 1, friend: 1 }, { unique: true })