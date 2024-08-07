import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum LikeType {
  POST = 'post',
    COMMENT = 'comment'
}

@Schema({
  timestamps: true
})
export class Suspension extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String })
  reason: string;
}

export const SuspensionSchema = SchemaFactory.createForClass(Suspension);

SuspensionSchema.index({ userId: 1 }, { unique: true });