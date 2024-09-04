import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose'
import { UserChatListService } from 'src/chatlist/chatlist.service';
import { MessageService } from 'src/message/message.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { NotificationService } from 'src/notification/notification.service';
import { ChatGroup } from 'src/schema/cgroup';
import { Group } from 'src/schema/group';
import { Member } from 'src/schema/members';

@Injectable()
export class MemberService {
    constructor(
        @InjectModel(Member.name) private readonly memberModel: Model<Member>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly messageService: MessageService,
        // private readonly notificationService: NotificationService,
        @InjectModel(Group.name) private groupModel: Model<Group>,
        @InjectModel(ChatGroup.name) private chatGroupModel: Model<ChatGroup>,
        @InjectConnection() private connection: Connection
    ) { }

    async getMembers(cursor, groupId) {
        const limit = 5
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};
        let query = { ..._cursor, groupId: new Types.ObjectId(groupId), isAdmin: 0 }

        const members = await this.memberModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit + 1 },
            {
                $lookup: {
                    from: 'users',
                    localField: "member",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    isAdmin: 1,
                    groupId: 1,
                    updatedAt: 1,
                    createdAt: 1,
                },
            },
        ]);

        // {
        //     $lookup: {
        //       from: 'groupmembers',
        //       let: { groupId: '$_id' },
        //       pipeline: [
        //         { $match: { $expr: { $eq: ['$group', '$$groupId'] } } },
        //         {
        //           $lookup: {
        //             from: 'users',
        //             localField: 'user',
        //             foreignField: '_id',
        //             as: 'userDetails'
        //           }
        //         },
        //         { $unwind: '$userDetails' },
        //         {
        //           $replaceRoot: {
        //             newRoot: {
        //               $mergeObjects: ['$userDetails', { isAdmin: '$isAdmin' }]
        //             }
        //           }
        //         },
        //         { $sort: { isAdmin: -1 } } // Sort descending, so true comes before false
        //       ],
        //       as: 'members'
        //     }
        //   },

        const hasNextPage = members.length > limit;
        const _members = hasNextPage ? members.slice(0, -1) : members;
        const nextCursor = hasNextPage ? _members[_members.length - 1].createdAt.toISOString() : null;

        const results = { members: _members, nextCursor };
        // this.cacheService.set(cacheKey, JSON.stringify(results), 300)

        return results
    }

    async getGroupIds(userId) {
        let query = { member: new Types.ObjectId(userId), type: 'chatgroup' }
        const groups = await this.memberModel.find( query );
        const _groups = await this.chatGroupModel.find({admins: query.member})

        return [...groups.map((group) => group.groupId.toString()), ..._groups.map((group,i) => group._id.toString())]
    }

    async toggleJoin(_userId, groupDetails) {
        let userId = groupDetails?.userId || _userId 

        console.log('yes yes', groupDetails)
        console.log('joiner', userId, 'user', _userId)

        const filter = {
            member: new Types.ObjectId(userId),
            groupId: new Types.ObjectId(groupDetails.groupId),
        };

        const member = await this.memberModel.findOne({member: filter.member})

        if(member && member.isAdmin == 1){
            console.log('deleting')
            let _member = await this.chatGroupModel.updateOne(
                { _id: filter.groupId },
                { $pull: { admins: filter.member } },
            );
            console.log(_member)
        }

        const deleteResult = await this.memberModel.deleteOne(filter);

        if (deleteResult.deletedCount === 0) {
            await this.memberModel.create({...filter, type: groupDetails.type});
            let message = await this.messageService.createMessage({ type: 'ChatGroup', sender: filter.groupId, recepient: filter.member, content: "added in group", messageType: "Info", isGroup: true })
            // await this.notificationService.createNotification(
            //     {
            //         from: new Types.ObjectId(userId),
            //         user: new Types.ObjectId(authorId),
            //         targetId: new Types.ObjectId(targetId),
            //         type,
            //         targetType,
            //         value: type == "post" ? "liked your post" : type == "comment" ? "liked your commnet" : "liked your reply"
            //     }
            // )

            await this.metricsAggregatorService.incrementCount(filter.groupId, "members", "group")
            
            return true;
        }

        let message = await this.messageService.createMessage({ type: 'Group', sender: filter.groupId, recepient: filter.member, content: "removed from group", messageType: "Info", isGroup: true, removeUser: true, removeChat: true })
        console.log(message)
        await this.metricsAggregatorService.decrementCount(filter.groupId, "members", "group")
        return false;
    }

    async toggleAdmin(_superAdminId: string, _userId: string, _groupId: string, isChatGroup: boolean) {
        const adminId = new Types.ObjectId(_superAdminId)
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)
        console.log(_superAdminId, _userId, _groupId)
        console.log(adminId, ":admin", userId, ": user", groupId, ": group")
        // const session = await this.connection.startSession();
        // session.startTransaction();
        try {
            // First, verify if the user performing the action is the super admin
            if (isChatGroup) {
                const group = await this.chatGroupModel.findOne({ _id: groupId, user: adminId });

                if (!group) {
                    throw new ForbiddenException('Only the group creator can perform this action');
                }
            } else {
                const group = await this.groupModel.findOne({ _id: groupId, user: adminId });

                if (!group) {
                    throw new ForbiddenException('Only the group creator can perform this action');
                }
            }
            console.log('isgroup')
            // Toggle isAdmin in GroupMember
            const updatedMember = await this.memberModel.findOneAndUpdate(
                { groupId, member: userId },
                { $bit: { isAdmin: { xor: 1 } } },
                { new: true }
            );
            console.log(updatedMember)

            if (!updatedMember) {
                throw new NotFoundException('Group member not found');
            }

            console.log('iis updated member')

            // Update Group's admins array based on new isAdmin status
            if (updatedMember.isAdmin) {
                console.log('is admin')
                // Add to admins array if not already present
                if (isChatGroup) {
                    await this.chatGroupModel.updateOne(
                        { _id: groupId },
                        { $addToSet: { admins: new Types.ObjectId(userId) } },
                    );
                } else {
                    await this.groupModel.updateOne(
                        { _id: groupId },
                        { $addToSet: { admins: new Types.ObjectId(userId) } },
                    );
                }
            } else {
                // Remove from admins array
                console.log('not admin')
                if (isChatGroup) {
                    await this.chatGroupModel.updateOne(
                        { _id: groupId },
                        { $pull: { admins: new Types.ObjectId(userId) } },
                    );
                } else {
                    await this.groupModel.updateOne(
                        { _id: groupId },
                        { $pull: { admins: new Types.ObjectId(userId) } },
                    );
                }
            }
            console.log(updatedMember, 'done')
            return updatedMember;
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        }
        // finally {
        // session.endSession();
        // }
    }
}
