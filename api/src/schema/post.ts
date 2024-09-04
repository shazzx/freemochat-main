import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Types } from "mongoose";
import { Promotion } from "./promotion";

class Media {
    @Prop()
    url: string;

    @Prop()
    type: string;

    @Prop()
    name: string;
}


@Schema({timestamps: true})
export class Post {
    @Prop({ type: Types.ObjectId, refPath: 'type', required: true, index: true })
    targetId: ObjectId

    @Prop({type: String})
    username: String

    @Prop({Type: Boolean})
    isUploaded: Boolean

    @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
    user: ObjectId

    @Prop({type: String, required: true})
    type: String;

    @Prop({type: String})
    content: String;
    
    @Prop({type: String})
    visibility: String;
    
    @Prop({type: Array<Media>})
    media: Media[]

    @Prop()
    createdAt: Date
}

export const PostSchema = SchemaFactory.createForClass(Post)
