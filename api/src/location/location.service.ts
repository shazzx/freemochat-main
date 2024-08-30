import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cities } from 'src/schema/cities';
import { Countries } from 'src/schema/countries';
import { Location } from 'src/schema/locations';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Countries.name) private readonly countriesModel: Model<Countries>,
    @InjectModel(Cities.name) private readonly citiesModel: Model<Cities>,
    @InjectModel(Location.name) private readonly locationModel: Model<Location>
  ) { }

  async checkAddressRegisteration({ country, city, area }: { country?: string, city?: string, area?: string }) {
    const docs = [
      {
        updateOne: {
          filter: { name: country, type: 'country' },
          update: { $setOnInsert: { name: country, type: "country" } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { name: city, type: 'city' },
          update: { $setOnInsert: { name: city, country, type: "city" } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { name: area, type: 'area' },
          update: { $setOnInsert: { name: area, city, country, type: "area" } },
          upsert: true
        }
      },
    ]

    return await this.locationModel.bulkWrite(docs)
    // await this.locationModel.findOneAndUpdate(
    //     { name: country, type: 'country' },
    //     {
    //         $setOnInsert: { name: city, type: city },
    //     },
    //     { upsert: true })
    // await this.locationModel.findOneAndUpdate(
    //     { name: city, country, type: 'city' },
    //     {
    //         $setOnInsert: { name: city, type: city },
    //     },
    //     { upsert: true })
    // await this.locationModel.findOneAndUpdate(
    //     { name: city, country, type: 'city' },
    //     {
    //         $setOnInsert: { name: city, type: city },
    //     },
    //     { upsert: true })
  }

  async isValidAddress({ country, city }: { country: string, city: string }) {
    const isValidCountry = await this.countriesModel.findOne({ name: country })
    const isValidCity = await this.citiesModel.findOne({ name: city })
    if (!isValidCountry || !isValidCity) {
      throw new BadRequestException("Invalid Address")
    }
    return true
  }

  async getCities(country: string) {
    const cities = await this.citiesModel.find({ country }).sort({ name: 1 }).collation({ locale: "en", caseLevel: true })
    return cities
  }

  async getCountries() {
    const countries = await this.countriesModel.find().sort({ name: 1 }).collation({ locale: "en", caseLevel: true })
    return countries
  }

  async getRegisteredCountries() {
    const countries = await this.locationModel.find({ type: 'country' }).sort({ name: 1 }).collation({ locale: "en", caseLevel: true })
    return countries
  }

  async getRegisteredCountryCities(country: string) {
    const cities = await this.locationModel.find({ type: 'city', country }).sort({ name: 1 }).collation({ locale: "en", caseLevel: true })
    return cities
  }

  async getRegisteredCityAreas(city: string) {
    const areas = await this.locationModel.find({ type: 'area', city }).sort({ name: 1 }).collation({ locale: "en", caseLevel: true })
    return areas
  }

  async seedCountries() {
    //  await this.countriesModel.create([
    //     {name: 'Pakistan', code: 92, shortName: "PK" },
    //     {name: 'United States America', code: 68, shortName: "USA" }
    //  ])

    await this.citiesModel.create([
      { name: "Karachi", country: "Pakistan" },
      { name: "Islamabad", country: "Pakistan" },
      { name: "Washington", country: "United States America" }
    ])
    return true
  }

}
