import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter } from 'src/schema/Counter';

@Injectable()
export class MetricsAggregatorService {
    constructor(@InjectModel(Counter.name) private readonly counterModel: Model<Counter>) { }

    async incrementCount(targetId: Types.ObjectId, name: string, type: string) {
        let counter = await this.counterModel.updateOne(
            { targetId, name, type },
            {
                $setOnInsert: { targetId, name, type },
                $inc: { count: 1 }
            },
            { upsert: true }
        )
        console.log(targetId, name, type, "increment", counter)
        return counter
    }

    async userMetrics(targetId: string) {
        let notification = await this.counterModel.findOne({ targetId: new Types.ObjectId(targetId), name: "notification", type: "user" })
        let requests = await this.counterModel.findOne({ targetId: new Types.ObjectId(targetId), name: "request", type: "user" })
        return { notification, requests }
    }


    async getAll() {
        return await this.counterModel.find()
    }

    async defaultCount(targetId: string, name: string, type: string) {
        let counter = await this.counterModel.updateOne(
            { targetId: new Types.ObjectId(targetId), name, type },
            { targetId, name, type, count: 0 },
            { upsert: true }
        )
        console.log(targetId, name, type, "default")
        return counter
    }

    // async deleteAll() {
    //     return await this.counterModel.deleteMany()
    // }

    async decrementCount(targetId: Types.ObjectId, name: string, type: string) {
        let counter = await this.counterModel.updateOne(
            { targetId, name, type },
            {
                $setOnInsert: { targetId, name, type },
                $inc: { count: -1 }
            },
        )
        console.log(targetId, name, type, 'decrement')

        return counter
    }

}
