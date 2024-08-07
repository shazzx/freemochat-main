import { Module } from '@nestjs/common';
import { BackgroundjobsService } from './backgroundjobs.service';
import { BackgroundjobsController } from './backgroundjobs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from 'src/schema/story';

@Module({
  imports: [MongooseModule.forFeature([{name: Story.name, schema: StorySchema}])],
  controllers: [BackgroundjobsController],
  providers: [BackgroundjobsService],
})
export class BackgroundjobsModule {}
