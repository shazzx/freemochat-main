import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './schema/admin';
import { User, UserSchema } from 'src/schema/user';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { GroupModule } from './group/group.module';
import { PageModule } from './page/page.module';
import { CGroupModule } from './cgroup/cgroup.module';
import { Report, ReportSchema } from 'src/schema/report';
import { Promotion, promotionSchema } from 'src/schema/promotion';
import counterSchema, { Counter } from 'src/schema/Counter';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';
import { AccountManagementModule } from 'src/account-management/account-management.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Counter.name, schema: counterSchema },
      { name: Promotion.name, schema: promotionSchema }]),
    PostModule,
    GroupModule,
    PageModule,
    CGroupModule,
    AuthModule,
    JwtModule,
    UploadModule,

  ],
  controllers: [AdminController],
  providers: [AdminService, { provide: "ADMIN_APP_GUARD", useClass: JwtAuthGuard }],
  exports: [AdminService]

})
export class AdminModule { }
