import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({timestamps: true})
export class Countries {
    @Prop({type: String, unique: true})
    name: string

    @Prop({type: Number, unique: true})
    code: number

    @Prop({type: String, unique: true})
    shortName: string
}

export const CountriesSchema = SchemaFactory.createForClass(Countries)