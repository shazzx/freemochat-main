import { Prop } from "@nestjs/mongoose";

export class Date {
    @Prop()
    year: String;

    @Prop()
    month: String;

    @Prop()
    date: String;

    @Prop()
    day: String;

    @Prop()
    hour: String;

    @Prop()
    minutes: String;

    @Prop()
    meridiam: String
}

export class Profile {
    @Prop()
    main: string;

    @Prop()
    cover: string;
}