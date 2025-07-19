import { Module} from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { PostModule } from 'src/admin/post/post.module';
import { Post, PostSchema } from 'src/schema/post';
import { Group, GroupSchema } from 'src/schema/group';
import { Page, PageSchema } from 'src/schema/pages';
import { HashtagModule } from 'src/hashtag/hashtag.module';

@Module({
  imports: [AuthModule, JwtModule, HashtagModule, 
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }])
  ],
    
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule { }
