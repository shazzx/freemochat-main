import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose'
import { isEmail } from 'validator'
import { ObjectId, Types } from 'mongoose'


@Schema({ timestamps: true, expires: "10m" })
export class OTP {
    @Prop({type: Types.ObjectId, ref: "User"})
    user: ObjectId

    @Prop()
    email: string;

    @Prop()
    phone: number;
}

export const OTPSchema = SchemaFactory.createForClass(OTP)