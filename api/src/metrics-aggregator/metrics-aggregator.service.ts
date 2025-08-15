import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter } from 'src/schema/Counter';

@Injectable()
export class MetricsAggregatorService {
    constructor(
        @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
    ) { }

    async incrementCount(targetId: Types.ObjectId, name: string, type: string, session?: any, customCount?: number) {
        let counter = await this.counterModel.updateOne(
            { targetId, name, type },
            {
                $setOnInsert: { targetId, name, type },
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

    // Ultra-optimized MongoDB aggregation approach
    async getCountryContributions() {
        try {
            const result = await this.counterModel.aggregate([
                // Step 1: Match only country contribution documents
                {
                    $match: {
                        type: { $regex: /_country_contributions$/ }
                    }
                },

                // Step 2: Add computed fields for country and category
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

                // Step 3: Group by category and country
                {
                    $group: {
                        _id: {
                            category: "$category",
                            country: "$country"
                        },
                        count: { $sum: "$count" }
                    }
                },

                // Step 4: Group by category to create the final structure
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

                // Step 5: Sort countries within each category by count
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
                                50  // Top 50 countries per category
                            ]
                        }
                    }
                }
            ]);

            // Transform to expected format
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
                        displayName: country.country  // ✅ Just use the country name directly!
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
                    ...categories.plantation.map(c => c.country),
                    ...categories.garbage_collection.map(c => c.country),
                    ...categories.water_ponds.map(c => c.country),
                    ...categories.rain_water.map(c => c.country)
                ]).size,
                success: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error in aggregation:', error);
            throw new InternalServerErrorException('Failed to aggregate country contributions');
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
}
