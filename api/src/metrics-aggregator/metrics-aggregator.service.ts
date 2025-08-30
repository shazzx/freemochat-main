import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter } from 'src/schema/Counter';

@Injectable()
export class MetricsAggregatorService {
    constructor(
        @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
    ) { }

    async incrementCount(targetId: Types.ObjectId, name: string, type: string, session?: any, customCount?: number, location?: {
        latitude: number;
        longitude: number;
        address?: string;
        country?: string;
        city?: string;
    }) {
        let counter = await this.counterModel.updateOne(
            { targetId, name, type },
            {
                $setOnInsert: {
                    targetId, name, type, ...(location && { location })
                },
                $inc: { count: customCount ?? 1 }
            },
            { upsert: true, session }

        )
        return counter
    }

    async userMetrics(targetId: string) {
        let notification = await this.counterModel.findOne({ targetId: new Types.ObjectId(targetId), name: "notification", type: "user" })
        let requests = await this.counterModel.findOne({ targetId: new Types.ObjectId(targetId), name: "request", type: "user" })
        let unreadChatlists = await this.counterModel.findOne({ targetId: new Types.ObjectId(targetId), name: "unreadChatlist", type: "user" })
        return { notification, requests, unreadChatlists }
    }

    async getGlobalEnvironmentalCounts() {
        return await this.counterModel.find({ targetId: null, type: "contributions" })
    }

    async getCountryContributions() {
        try {
            const result = await this.counterModel.aggregate([
                {
                    $match: {
                        type: { $regex: /_country_contributions$/ }
                    }
                },

                {
                    $addFields: {
                        country: {
                            $replaceAll: {
                                input: "$type",
                                find: "_country_contributions",
                                replacement: ""
                            }
                        },
                        category: "$name"
                    }
                },

                {
                    $group: {
                        _id: {
                            category: "$category",
                            country: "$country"
                        },
                        count: { $sum: "$count" }
                    }
                },

                {
                    $group: {
                        _id: "$_id.category",
                        countries: {
                            $push: {
                                country: "$_id.country",
                                count: "$count"
                            }
                        },
                        total: { $sum: "$count" }
                    }
                },

                {
                    $addFields: {
                        countries: {
                            $slice: [
                                {
                                    $sortArray: {
                                        input: "$countries",
                                        sortBy: { count: -1 }
                                    }
                                },
                                50 
                            ]
                        }
                    }
                }
            ]);

            const categories = {
                plantation: [],
                garbage_collection: [],
                water_ponds: [],
                rain_water: []
            };

            const totals = {
                plantation: 0,
                garbage_collection: 0,
                water_ponds: 0,
                rain_water: 0
            };

            result.forEach(categoryData => {
                const category = categoryData._id;
                if (categories[category]) {
                    categories[category] = categoryData.countries.map(country => ({
                        country: country.country,
                        count: country.count,
                        displayName: country.country
                    }));
                    totals[category] = categoryData.total;
                }
            });

            const grandTotal = Object.values(totals).reduce((sum, count) => sum + count, 0);

            return {
                categories,
                totals,
                grandTotal,
                countriesCount: {
                    plantation: categories.plantation.length,
                    garbage_collection: categories.garbage_collection.length,
                    water_ponds: categories.water_ponds.length,
                    rain_water: categories.rain_water.length
                },
                totalUniqueCountries: new Set([
                    ...categories.plantation.filter(c => c.count > 0).map(c => c.country),
                    ...categories.garbage_collection.filter(c => c.count > 0).map(c => c.country),
                    ...categories.water_ponds.filter(c => c.count > 0).map(c => c.country),
                    ...categories.rain_water.filter(c => c.count > 0).map(c => c.country)
                ]).size,
                success: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error in aggregation:', error);
            throw new InternalServerErrorException('Failed to aggregate country contributions');
        }
    }

    async searchCountries(searchQuery: string) {
        try {
            const rawData = await this.counterModel.find({
                type: { $regex: /_country_contributions$/ }
            }).lean();

            const countriesMap = new Map();

            rawData.forEach(doc => {
                const countryName = doc.type.replace('_country_contributions', '');
                const category = doc.name as string;
                const count = doc.count || 0;
                const location = doc.location || { latitude: null, longitude: null };

                if (!countriesMap.has(countryName)) {
                    countriesMap.set(countryName, {
                        country: countryName,
                        displayName: countryName,
                        totalContributions: 0,
                        location,
                        categories: {
                            plantation: 0,
                            garbage_collection: 0,
                            water_ponds: 0,
                            rain_water: 0
                        }
                    });
                }

                const countryData = countriesMap.get(countryName);
                countryData.totalContributions += count;

                if (countryData.categories[category] !== undefined) {
                    countryData.categories[category] += count;
                }
            });

            const allCountries = Array.from(countriesMap.values());

            const searchRegex = new RegExp(searchQuery, 'i');
            const filteredCountries = allCountries.filter(country =>
                searchRegex.test(country.country) || searchRegex.test(country.displayName)
            );

            filteredCountries.sort((a, b) => b.totalContributions - a.totalContributions);

            return {
                countries: filteredCountries,
                totalFound: filteredCountries.length,
                searchQuery: searchQuery,
                success: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error searching countries:', error);
            return {
                countries: [],
                totalFound: 0,
                searchQuery: searchQuery,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }


    async userAndPageContributions(targetId: string) {
        let plantation = await this.counterModel.findOne(
            {
                targetId: new Types.ObjectId(targetId),
                name: "plantation",
                type: "contributions"
            })

        let garbageCollection = await this.counterModel.findOne(
            {
                targetId: new Types.ObjectId(targetId),
                name: "garbage_collection",
                type: "contributions"
            })

        let waterPonds = await this.counterModel.findOne(
            {
                targetId: new Types.ObjectId(targetId),
                name: "water_ponds",
                type: "contributions"
            })

        let rainWater = await this.counterModel.findOne(
            {
                targetId: new Types.ObjectId(targetId),
                name: "rain_water",
                type: "contributions"
            })

        return {
            plantation: plantation?.count || 0,
            garbageCollection: garbageCollection?.count || 0,
            waterPonds: waterPonds?.count || 0,
            rainWater: rainWater?.count || 0
        }
    }


    async getAll() {
        return await this.counterModel.find()
    }

    async defaultCount(targetId: string, name: string, type: string) {
        if (name == 'unreadChatlist') {
            return false
        }
        let counter = await this.counterModel.updateOne(
            { targetId: new Types.ObjectId(targetId), name, type },
            { targetId, name, type, count: 0 },
            { upsert: true }
        )
        return counter
    }

    async decrementCount(targetId: Types.ObjectId, name: string, type: string, customCount?: number) {
        console.log(type, 'decrementing count for', name, 'with customCount:', customCount);
        let counter = await this.counterModel.updateOne(
            { targetId, name, type },
            {
                $setOnInsert: { targetId, name, type },
                $inc: { count: customCount ? -customCount : -1 }
            },
        )
        return counter
    }

    async removeCounter(targetId: Types.ObjectId, name: string, type: string, customCount?: number) {
        console.log(type, 'removing counter for', name, 'with customCount:', customCount);
        let counter = await this.counterModel.deleteOne(
            { targetId, name, type },
        )
        return counter
    }
}
