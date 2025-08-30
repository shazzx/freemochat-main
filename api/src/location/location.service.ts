import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cities } from 'src/schema/cities';
import { Countries } from 'src/schema/countries';
import { Location } from 'src/schema/locations';
import { Address, AddressTypes, LANGUAGES } from 'src/utils/enums/global.c';

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
          filter: { name: country, type: AddressTypes.COUNTRY },
          update: { $setOnInsert: { name: country, type: "country" } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { name: city, type: AddressTypes.CITY },
          update: { $setOnInsert: { name: city, country, type: "city" } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { name: area, type: AddressTypes.AREA },
          update: { $setOnInsert: { name: area, city, country, type: "area" } },
          upsert: true
        }
      },
    ]

    return await this.locationModel.bulkWrite(docs)
  }

  async isValidAddress({ country, city }: { country: string, city: string }) {
    const isValidCountry = await this.countriesModel.findOne({ name: country })
    const isValidCity = await this.citiesModel.findOne({ name: city })
    if (!isValidCountry || !isValidCity) {
      throw new BadRequestException(Address.INVALID)
    }
    return true
  }


  async isValidRegisteredAddress({ country, city, area }: { country?: string, city?: string, area?: string }) {
    const isValidCountry = await this.locationModel.findOne({ name: country, type: AddressTypes.COUNTRY })

    if (!isValidCountry) {
      throw new BadRequestException(Address.INVALID)
    }

    if (city) {
      const isValidCity = await this.locationModel.findOne({ name: city, country, type: AddressTypes.CITY })

      if (!isValidCity) {
        throw new BadRequestException(Address.INVALID)
      }
    }

    if (area) {
      const isValidArea = await this.locationModel.findOne({ name: area, city, type: AddressTypes.AREA })
      if (!isValidArea) {
        throw new BadRequestException(Address.INVALID)
      }
    }
    return true
  }


  async getCities(country: string) {
    const cities = await this.citiesModel.find({ country }).sort({ name: 1 }).collation({ locale: LANGUAGES.ENGLISH, caseLevel: true })
    return cities
  }

  async getCountries() {
    const countries = await this.countriesModel.find().sort({ name: 1 }).collation({ locale: LANGUAGES.ENGLISH, caseLevel: true })
    return countries
  }

  async getRegisteredCountries() {
    const countries = await this.locationModel.find({ type: AddressTypes.COUNTRY }).sort({ name: 1 }).collation({ locale: LANGUAGES.ENGLISH, caseLevel: true })
    return countries
  }

  async getRegisteredCountryCities(country: string) {
    const cities = await this.locationModel.find({ type: AddressTypes.CITY, country }).sort({ name: 1 }).collation({ locale: LANGUAGES.ENGLISH, caseLevel: true })
    return cities
  }

  async getRegisteredCityAreas(city: string) {
    const areas = await this.locationModel.find({ type: AddressTypes.AREA, city }).sort({ name: 1 }).collation({ locale: LANGUAGES.ENGLISH, caseLevel: true })
    return areas
  }
}
