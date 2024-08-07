import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserChatListService } from 'src/chatlist/chatlist.service';
import { ChatGroup } from 'src/schema/cgroup';
import { Types } from 'mongoose'
import { InternalServerError } from '@aws-sdk/client-rekognition';
import { MessageService } from 'src/message/message.service';

@Injectable()
export class CGroupsService {
    constructor(
        @InjectModel(ChatGroup.name) private readonly chatGroupModel: Model<ChatGroup>,
        private readonly chatlistService: UserChatListService,
        private readonly messageService: MessageService,
    ) { }

    async getGroups(userId) {
        console.log(userId)
        let groups = await this.chatGroupModel.find({ user: new Types.ObjectId(userId) })
        console.log(await this.chatGroupModel.find())
        console.log('founded groups', groups,)
        return groups
    }

    async getGroup(userId, groupId) {
        let group = await this.chatGroupModel.aggregate([
            { $match: { _id: new Types.ObjectId(groupId) } },
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
                    from: 'counters',
                    localField: "_id",
                    foreignField: "targetId",
                    as: 'membersCount'
                }
            },
            {
                $addFields: {
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
                    membersCount: 1,
                    images: 1,
                    admins: "$populatedAdmins",
                    user: 1,
                },
            },
        ])
        const isSuperAdmin = group[0].user.toString() === userId;
        const isAdmin = group[0].admins.some(adminId => adminId.toString() === userId);
        console.log(group[0], isSuperAdmin, isAdmin)

        let groupData = { ...group[0], isAdmin, isSuperAdmin }
        return groupData
    }

    async createGroup(userId, groupDetails: any) {
        console.log(userId)
        let _userId = new Types.ObjectId(userId)
        try {
            let group = await this.chatGroupModel.create({ admins: [_userId], user: _userId, ...groupDetails })
            let message = await this.messageService.createMessage({ type: 'ChatGroup', sender: new Types.ObjectId(userId), recepient: group._id, content: "group created", messageType: "Info", isGroup: true })
            console.log(message, 'message')
            console.log(group, 'group')

            return group
        } catch (error) {
            console.log(error)
            // throw new InternalServerErrorException()
        }
    }


    async joinChatGroup(userDetails, groupDetails) {
        let group = await this.chatGroupModel.findById(groupDetails.groupId)
        if (!group) {
            return new BadRequestException()
        }

        // group.members.push(userDetails.userId)
        // await group.save()
        // console.log(group)
        // return group
    }


    async leaveChatGroup(userDetails, groupDetails: any) {
        let group = await this.chatGroupModel.findById(groupDetails.groupId)

        // if (!group) {
        //     return new BadRequestException()
        // }

        // let memberIndex = group.members.findIndex((user) => {
        //     if (user == userDetails.userId) {
        //         return user
        //     }
        // })

        // if (memberIndex == -1) {
        //     return new BadRequestException()
        // }

        // group.members.splice(memberIndex)
        // await group.save()
        // return group
    }

    // async updateGroup(groupId: string, groupDetails: any) {
    //     let updatedGroup = await this.chatGroupModel.findByIdAndUpdate(groupId, groupDetails, { returnOriginal: false })
    //     return updatedGroup
    // }


    async updateGroup(groupId: string, updatedDetails) {
        console.log(updatedDetails)
        let _updatedDetails = await this.chatGroupModel.findByIdAndUpdate(groupId, { $set: updatedDetails }, { new: true })
        console.log(_updatedDetails)
        return _updatedDetails
    }

    async deleteGroup(groupId: string,) {
        let deletedGroup = await this.chatGroupModel.findByIdAndDelete(groupId)
        return deletedGroup
    }
}
