import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";

@Schema({timestamps: true})
export class Report {
    @Prop({ type: Types.ObjectId, ref: "User" })
    reportedBy: ObjectId

    @Prop()
    type: String;

    @Prop()
    reportMessage: String;

    @Prop({ type: Types.ObjectId, ref: "Post" })
    postId: ObjectId
}

export const ReportSchema = SchemaFactory.createForClass(Report)
ReportSchema.index({ reportedBy: 1, postId: 1 }, { unique: true })
