import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { ObjectId, Types } from "mongoose"

class TargetAddress {
    country: string
    city: string
    area: string
}

class PaymentDetails {
    totalAmount: string
    status: string
    refunded: string
    paymentProvider: string
    paymentIntentId: string
}

@Schema({ timestamps: true })
export class Promotion {
    @Prop({ type: Types.ObjectId, ref: "Post" })
    postId: ObjectId

    @Prop({ type: Types.ObjectId, ref: "User" })
    user: ObjectId

    @Prop()
    reachTarget: String

    @Prop()
    targetAdress: TargetAddress

    @Prop({ type: Number })
    reach: Number

    @Prop()
    likes: Number

    @Prop()
    active: Number;

    @Prop()
    paymentDetails: PaymentDetails
}

export const promotionSchema = SchemaFactory.createForClass(Promotion) 