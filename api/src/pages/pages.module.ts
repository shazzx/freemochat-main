import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { PageService } from './pages.service';
import { PageController } from './pages.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from 'src/schema/pages';
import FollowerSchema, { Follower } from 'src/schema/followers';
import { UploadModule } from 'src/upload/upload.module';
import { MetricsAggregatorModule } from 'src/metrics-aggregator/metrics-aggregator.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [UserModule, NotificationModule, AuthModule, JwtModule, UploadModule, MetricsAggregatorModule,
    MongooseModule.forFeature([
      { name: Page.name, schema: PageSchema },
      { name: Follower.name, schema: FollowerSchema }])],
  providers: [PageService],
  controllers: [PageController],
  exports: [PageService]
})
export class PagesModule { }
