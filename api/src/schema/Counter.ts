import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from 'mongoose'
import { Location } from "./post";

@Schema({ timestamps: true })
export class Counter {
    @Prop({ type: Types.ObjectId })
    targetId: String;

    @Prop({ type: String })
    type: String

    @Prop()
    name: String;

    @Prop()
    count: Number

    @Prop({ type: Location })
    location?: Location;
}

const counterSchema = SchemaFactory.createForClass(Counter)
export default counterSchema