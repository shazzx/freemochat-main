import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose'
import { UserChatListService } from 'src/chatlist/chatlist.service';
import { MessageService } from 'src/message/message.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';
import { ChatGroup } from 'src/schema/cgroup';
import { Group } from 'src/schema/group';
import { Member } from 'src/schema/members';

@Injectable()
export class MemberService {
    constructor(
        @InjectModel(Member.name) private readonly memberModel: Model<Member>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        @InjectModel(Group.name) private groupModel: Model<Group>,
        @InjectModel(ChatGroup.name) private chatGroupModel: Model<ChatGroup>,
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

        const hasNextPage = members.length > limit;
        const _members = hasNextPage ? members.slice(0, -1) : members;
        const nextCursor = hasNextPage ? _members[_members.length - 1].createdAt.toISOString() : null;

        const results = { members: _members, nextCursor };
        return results
    }

    async getGroupMemberIds(groupId) {
        const members = await this.memberModel.find({ groupId: new Types.ObjectId(groupId) })
        const group = await this.chatGroupModel.findById(groupId)
        const _members = members.map((member) => {
            return member.member.toString()
        })
        const _admins = group.admins.map((admin) => {
            return admin.toString()
        })
        return [..._members, ..._admins]
    }

    async getGroupIds(userId) {
        let query = { member: new Types.ObjectId(userId), type: 'chatgroup' }
        const groups = await this.memberModel.find(query);
        const _groups = await this.chatGroupModel.find({ admins: query.member })

        return [...groups.map((group) => group.groupId.toString()), ..._groups.map((group, i) => group._id.toString())]
    }

    async toggleJoin(_userId: string, _groupId: string) {
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)

        try {
            const existingMember = await this.memberModel.findOne({
                groupId,
                member: userId
            });

            const group = await this.groupModel.findById(groupId);
            if (!group) {
                throw new NotFoundException('Group not found');
            }

            const userIsAdmin = group.admins.some(admin => admin.toString() === userId.toString());
            const userIsSuperAdmin = group.user.toString() === userId.toString();

            if (existingMember) {
                await this.memberModel.findOneAndDelete({
                    groupId,
                    member: userId
                });

                if (userIsAdmin && !userIsSuperAdmin) {
                    await this.groupModel.updateOne(
                        { _id: groupId },
                        { $pull: { admins: userId } }
                    );
                }

                if (userIsSuperAdmin) {
                    throw new ForbiddenException('Group owner cannot leave the group');
                }

                return {
                    action: 'left',
                    adminRemoved: userIsAdmin && !userIsSuperAdmin,
                    message: `User left the group${userIsAdmin && !userIsSuperAdmin ? ' and admin privileges removed' : ''}`
                };
            } else {

                const newMember = new this.memberModel({
                    groupId,
                    member: userId,
                    isAdmin: 0,
                    joinedAt: new Date()
                });

                await newMember.save();

                return {
                    action: 'joined',
                    adminRestored: false,
                    message: 'User joined the group as regular member'
                };
            }
        } catch (error) {
            throw error;
        }
    }

    async isMember(userId, groupId) {
        const member = await this.memberModel.findOne({ member: new Types.ObjectId(userId), groupId: new Types.ObjectId(groupId) })
        if (member) {
            return true
        }
        return false
    }

    async toggleAdmin(_superAdminId: string, _userId: string, _groupId: string, isChatGroup: boolean) {
        const adminId = new Types.ObjectId(_superAdminId)
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)

        try {
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

            const updatedMember = await this.memberModel.findOneAndUpdate(
                { groupId, member: userId },
                { $bit: { isAdmin: { xor: 1 } } },
                { new: true }
            );

            if (!updatedMember) {
                throw new NotFoundException('Group member not found');
            }

            if (updatedMember.isAdmin) {
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
            return updatedMember;
        } catch (error) {
            throw error;
        }
    }

    async removeMember(_adminId: string, _userId: string, _groupId: string) {
        const adminId = new Types.ObjectId(_adminId)
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)

        try {
            const group = await this.groupModel.findOne({
                _id: groupId,
                $or: [
                    { user: adminId },    
                    { admins: adminId }   
                ]
            });

            if (!group) {
                throw new ForbiddenException('You do not have permission to perform this action');
            }

            if (group.user.toString() === userId.toString()) {
                throw new ForbiddenException('Cannot remove the group creator');
            }

            const isSuperAdmin = group.user.toString() === adminId.toString();
            const targetIsAdmin = group.admins.some(admin => admin.toString() === userId.toString());

            if (targetIsAdmin && !isSuperAdmin) {
                throw new ForbiddenException('Only the group creator can remove admins');
            }

            const removed = await this.memberModel.findOneAndDelete({
                groupId,
                member: userId
            });

            if (!removed) {
                throw new NotFoundException('Group member not found');
            }

            if (targetIsAdmin) {
                await this.groupModel.updateOne(
                    { _id: groupId },
                    { $pull: { admins: userId } }
                );
            }

            await this.metricsAggregatorService.decrementCount(groupId, "members", "group")

            return {
                success: true,
                removedFromAdmins: targetIsAdmin,
                message: `Member ${targetIsAdmin ? 'and admin privileges' : ''} removed successfully`
            };

        } catch (error) {
            throw error;
        }
    }
}
