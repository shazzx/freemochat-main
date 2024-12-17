import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Friend } from 'src/schema/friends';
import { Types } from 'mongoose'
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class FriendService {
    constructor(@InjectModel(Friend.name) private readonly friendsModel: Model<Friend>, private readonly cacheService: CacheService) { }

    async getFriends(userId: string, objectId?: boolean): Promise<any> {
        console.log(userId)
        const friends = await this.friendsModel.find({ user: new Types.ObjectId(userId) })
        if (objectId) {
            return friends.map(f => f.friend)
        }
        return friends.map(f => f.friend.toString())

    }

    async areFriends(userId: string, friendId: string): Promise<any> {
        const friends = await this.friendsModel.find({ user: new Types.ObjectId(userId), friend: new Types.ObjectId(userId) })
        console.log(friends)

        if (friends) {
            return true
        }

        return false
    }

    async updateOnlineFriends(userId: string): Promise<void> {
        const friends = await this.getFriends(userId)
        const onlineFriends = await Promise.all(
            friends.map(async (friendId) => {
                let friendID = friendId.toString()
                const isOnline = await this.cacheService.isUserOnline(friendID)
                if (isOnline) {
                    // await this.cacheService.addOnlineFriend(userId, friendID)
                    return friendID
                }
                // await this.cacheService.removeOnlineFriend(userId, friendID)
                return null
            })
        )
    }

    async getOnlineFriends(userId: string): Promise<string[]> {
        return await this.cacheService.getOnlineFriends(userId)
    }
}
