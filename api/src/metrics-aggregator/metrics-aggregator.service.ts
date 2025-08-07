import { Injectable } from '@nestjs/common';
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
        let counter = await this.counterModel.updateOne(
            { targetId, name, type },
            {
                $setOnInsert: { targetId, name, type },
                $inc: { count: customCount ?? -1 }
            },
        )
        return counter
    }
}
