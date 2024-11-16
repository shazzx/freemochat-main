import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from 'mongoose'

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
}

const counterSchema = SchemaFactory.createForClass(Counter)
export default counterSchema