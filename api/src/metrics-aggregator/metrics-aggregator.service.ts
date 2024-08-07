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
        console.log(targetId, name, type, "increment")
        return counter
    }

    async getAll() {
        return await this.counterModel.find()
    }


    async deleteAll() {
        return await this.counterModel.deleteMany()
    }

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
