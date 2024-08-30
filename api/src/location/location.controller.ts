import { Controller, Get, Query, Res } from '@nestjs/common';
import { LocationService } from './location.service';
import { Public } from 'src/auth/public.decorator';
import { Response } from 'express';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Public()
  @Get('cities')
  async getCities(@Query() query, @Res() res: Response) {
    const { country } = query
    console.log(country, 'country', query)
    res.json(await this.locationService.getCities(country))
  }

  @Public()
  @Get('countries')
  async getCountries(@Res() res: Response) {
    res.json(await this.locationService.getCountries())
  }

  @Get('registered/countries')
  async getRegisteredCountries(@Res() res: Response) {
    res.json(await this.locationService.getRegisteredCountries())
  }

  @Get('registered/country/cities')
  async getRegisteredCities(@Query() query, @Res() res: Response) {
    const { country } = query
    res.json(await this.locationService.getRegisteredCountryCities(country))
  }

  @Get('registered/city/areas')
  async getRegisteredCityAreas(@Query() query, @Res() res: Response) {
    const { city } = query
    res.json(await this.locationService.getRegisteredCityAreas(city))
  }
}
