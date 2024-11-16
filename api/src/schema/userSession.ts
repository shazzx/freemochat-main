import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose'
import { isEmail } from 'validator'
import { Friend } from './friends';
import { ObjectId, Types } from 'mongoose'

class Address {
    @Prop()
    country: string;

    @Prop()
    city: string;

    @Prop()
    area: string;
}

class Images {
    @Prop()
    profile: string;

    @Prop()
    cover: string
}

@Schema({ timestamps: true })
export class User {
    @Prop()
    firstname: string;

    @Prop()
    lastname: string;

    @Prop({ unique: true })
    username: string;

    @Prop({type: String, default: null})
    profile: string

    @Prop({type: String, default: null})
    cover: string

    @Prop({ unique: true, validate: { validator: (email: string) => isEmail(email) } })
    email: string;

    @Prop()
    password: string;

    @Prop()
    phone: number;

    @Prop()
    bio: string;

    @Prop({ required: true })
    address: Address

    @Prop({ type: Object })
    media: {
        images: string[];
        videos: string[];
    };

    @Prop({type: String, default: null})
    refreshToken: string
}

export const UserSchema = SchemaFactory.createForClass(User)
UserSchema.index({ username: "text", firstname: "text", bio: "text", email: "text" })