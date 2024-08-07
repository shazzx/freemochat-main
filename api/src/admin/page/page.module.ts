import { Module } from '@nestjs/common';
import { PageService } from './page.service';
import { PageController } from './page.controller';
import { PagesModule } from 'src/pages/pages.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from 'src/schema/pages';
import { JwtModule } from '@nestjs/jwt';
import counterSchema, { Counter } from 'src/schema/Counter';

@Module({
  imports: [PagesModule, JwtModule, MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }])],
  controllers: [PageController],
  providers: [PageService],
})
export class PageModule { }
