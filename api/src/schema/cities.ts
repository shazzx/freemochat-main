import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({timestamps: true})
export class Cities {
    @Prop({type: String})
    name: string

    @Prop({type: String})
    country: string
}

export const CitiesSchema = SchemaFactory.createForClass(Cities)