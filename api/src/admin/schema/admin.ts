import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import isEmail from "validator/lib/isEmail";

@Schema()
export class Admin {
    @Prop({unique: true})
    username: String;

    @Prop()
    firstname: String;

    @Prop()
    lastname: String;

    @Prop()
    fullname: String;

    @Prop()
    profile: String

    @Prop()
    password: String;

    @Prop({ unique: true, validate: { validator: (email: string) => isEmail(email) } })
    email: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin)