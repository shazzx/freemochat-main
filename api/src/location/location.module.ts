import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Countries, CountriesSchema } from 'src/schema/countries';
import { Cities, CitiesSchema } from 'src/schema/cities';
import { Location, LocationSchema } from 'src/schema/locations';

@Module({
  imports: [MongooseModule.forFeature(
    [
      { name: Countries.name, schema: CountriesSchema },
      { name: Cities.name, schema: CitiesSchema },
      { name: Location.name, schema: LocationSchema },
    ])],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService]
})
export class LocationModule { }
