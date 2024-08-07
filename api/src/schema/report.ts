import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";

@Schema()
export class Report {
    @Prop({ type: Types.ObjectId, ref: "User" })
    reportedBy: ObjectId

    @Prop()
    type: String;

    @Prop()
    reportMessage: String;

    @Prop({ type: Types.ObjectId })
    postId: ObjectId

    @Prop()
    date: Date
}

export const ReportSchema = SchemaFactory.createForClass(Report)