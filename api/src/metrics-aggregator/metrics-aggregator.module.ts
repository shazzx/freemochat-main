import { Module } from '@nestjs/common';
import { MetricsAggregatorService } from './metrics-aggregator.service';
import { MetricsAggregatorController } from './metrics-aggregator.controller';
import { MongooseModule } from '@nestjs/mongoose';
import counterSchema, { Counter } from 'src/schema/Counter';

@Module({
  imports: [MongooseModule.forFeature([{ name: Counter.name, schema: counterSchema }])],
  controllers: [MetricsAggregatorController],
  providers: [MetricsAggregatorService],
  exports: [MetricsAggregatorService]
})
export class MetricsAggregatorModule { }
