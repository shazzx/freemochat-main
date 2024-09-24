import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum LikeType {
  POST = 'post',
    COMMENT = 'comment'
}

@Schema({
  timestamps: true
})
export class Like extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String })
  reaction: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  postId: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ userId: 1, type: 1, targetId: 1 }, { unique: true });
LikeSchema.index({ type: 1, targetId: 1 });
LikeSchema.index({ postId: 1 });