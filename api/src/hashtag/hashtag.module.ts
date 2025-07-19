import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Hashtag, HashtagSchema } from "src/schema/hashtag";
import { HashtagService } from "./hashtagservice";
import { Post, PostSchema } from "src/schema/post";
import { HashtagController } from "./hashtag.controller";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Hashtag.name, schema: HashtagSchema },
            { name: Post.name, schema: PostSchema },
        ]),
    ],
    providers: [HashtagService],
    controllers: [HashtagController],
    exports: [HashtagService]
})
export class HashtagModule { }
