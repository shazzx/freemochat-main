import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { Group } from 'src/schema/group';
import { Member } from 'src/schema/members';

@Injectable()
export class GroupsService {
    constructor(
        @InjectModel(Group.name) private readonly groupModal: Model<Group>,
        @InjectModel(Member.name) private readonly memberModel: Model<Member>,
        private readonly metricsAggregatorService: MetricsAggregatorService
    ) { }

    async getGroup(handle, userId) {
        console.log(handle, 'handle', userId, 'userid')
        const group = await this.groupModal.aggregate([
            { $match: { handle } },
            {
                $lookup: {
                  from: 'users',
                  localField: 'admins',
                  foreignField: '_id',
                  as: 'populatedAdmins'
                }
              },
            {
                
                $lookup: {
                    from: 'members',
                    let: { pageId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$groupId', '$$pageId'] },
                                        { $eq: ['$member', new Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'memberStatus',
                },
            },
            {
                $lookup: {
                    from: 'counters',
                    localField: "_id",
                    foreignField: "targetId",
                    as: 'membersCount'
                }
            },
            {
                $addFields: {
                    isMember: { $gt: [{ $size: '$memberStatus' }, 0] },
                    membersCount: {
                        $ifNull: [
                            { $arrayElemAt: ["$membersCount.count", 0] },
                            0
                        ]
                    },
                    populatedAdmins: {
                        $map: {
                          input: '$populatedAdmins',
                          as: 'admin',
                          in: {
                            $mergeObjects: [
                              '$$admin',
                              { isAdmin: true }
                            ]
                          }
                        }
                      }
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    handle: 1,
                    membersCount: 1,
                    profile: 1,
                    cover: 1,
                    admins: "$populatedAdmins",
                    user: 1,
                    isMember: 1,
                    createdAt: 1
                },
            },
        ]);
        const isSuperAdmin = group[0].user.toString() === userId;
        const isAdmin = group[0].admins.some(adminId => adminId.toString() === userId);
        console.log(group[0], isSuperAdmin, isAdmin)

        let groupData = { ...group[0], isAdmin, isSuperAdmin }
        return groupData
    }

    async getRawGroup(groupId){
        return await this.groupModal.findById(groupId)
    }

    async getGroups(userId: string) {
        const groups = await this.groupModal.find({$or: [{ user: new Types.ObjectId(userId)}, {user: new Types.ObjectId(userId) }]})
        return groups
    }


    async handleExists(handle: string) {
        const group = await this.groupModal.findOne({ handle })
        if (group && group.handle !== handle) {
            return false
        }
        return true
    }

    async toggleJoin(userId, groupDetails) {
        console.log('grou service join method')
        const filter = {
            member: new Types.ObjectId(userId),
            groupId: new Types.ObjectId(groupDetails.groupId),
        };

        const deleteResult = await this.memberModel.deleteOne(filter);

        if (deleteResult.deletedCount === 0) {
            await this.memberModel.create(filter);
            console.log(filter.groupId)
            await this.metricsAggregatorService.incrementCount(filter.groupId, "members", "group")
            return true;
        }
        await this.metricsAggregatorService.decrementCount(filter.groupId, "members", "group")
        return false;
    }

    async createGroup(userId, groupDetails: any) {
        let _userId = new Types.ObjectId(userId)
        let group = await this.groupModal.create({ admins: [_userId], user: _userId, ...groupDetails })
        return group
    }


    async updateGroup(groupId: string, updatedDetails) {
        console.log(updatedDetails)
        let _updatedDetails = await this.groupModal.findByIdAndUpdate(groupId, { $set: updatedDetails }, { new: true })
        console.log(_updatedDetails)
        return _updatedDetails
    }


    async deleteGroup(groupId: string) {
        let deletedGroup = await this.groupModal.findByIdAndDelete(groupId)
        return deletedGroup
    }
}