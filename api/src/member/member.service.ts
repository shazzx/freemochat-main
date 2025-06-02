import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose'
import { ChatGateway } from 'src/chat/chat.gateway';
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
        private readonly chatlistService: UserChatListService,
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

    // Fixed backend toggleJoinGroup method to handle admin users properly
    async toggleJoin(_userId: string, _groupId: string) {
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)

        try {
            // Check if user is currently a member
            const existingMember = await this.memberModel.findOne({
                groupId,
                member: userId
            });

            // Get group data to check admin status
            const group = await this.groupModel.findById(groupId);
            if (!group) {
                throw new NotFoundException('Group not found');
            }

            // Check if user is admin (but not super admin/owner)
            const userIsAdmin = group.admins.some(admin => admin.toString() === userId.toString());
            const userIsSuperAdmin = group.user.toString() === userId.toString();

            if (existingMember) {
                // USER IS LEAVING THE GROUP

                // Remove from members collection
                await this.memberModel.findOneAndDelete({
                    groupId,
                    member: userId
                });

                // ✅ CRITICAL: If leaving user is admin (but not super admin), remove from admins array
                if (userIsAdmin && !userIsSuperAdmin) {
                    await this.groupModel.updateOne(
                        { _id: groupId },
                        { $pull: { admins: userId } }
                    );
                }

                // Note: Super admin (group owner) cannot leave their own group
                if (userIsSuperAdmin) {
                    throw new ForbiddenException('Group owner cannot leave the group');
                }

                return {
                    action: 'left',
                    adminRemoved: userIsAdmin && !userIsSuperAdmin,
                    message: `User left the group${userIsAdmin && !userIsSuperAdmin ? ' and admin privileges removed' : ''}`
                };
            } else {
                // USER IS JOINING THE GROUP

                // Add to members collection
                const newMember = new this.memberModel({
                    groupId,
                    member: userId,
                    isAdmin: 0, // New members start as regular members
                    joinedAt: new Date()
                });

                await newMember.save();

                // ✅ NOTE: When rejoining, user does NOT automatically get admin privileges back
                // Admin privileges must be re-granted by a super admin

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

    // Alternative method with transaction for better data consistency
    // async toggleJoin(_userId: string, _groupId: string) {
    //     const userId = new Types.ObjectId(_userId)
    //     const groupId = new Types.ObjectId(_groupId)

    //     const session = await this.connection.startSession();

    //     try {
    //         await session.withTransaction(async () => {
    //             // Check if user is currently a member
    //             const existingMember = await this.memberModel.findOne({
    //                 groupId,
    //                 member: userId
    //             }).session(session);

    //             // Get group data to check admin status
    //             const group = await this.groupModel.findById(groupId).session(session);
    //             if (!group) {
    //                 throw new NotFoundException('Group not found');
    //             }

    //             const userIsAdmin = group.admins.some(admin => admin.toString() === userId.toString());
    //             const userIsSuperAdmin = group.user.toString() === userId.toString();

    //             if (existingMember) {
    //                 // USER IS LEAVING THE GROUP

    //                 // Prevent super admin from leaving
    //                 if (userIsSuperAdmin) {
    //                     throw new ForbiddenException('Group owner cannot leave the group');
    //                 }

    //                 // Remove from members collection
    //                 await this.memberModel.findOneAndDelete({
    //                     groupId,
    //                     member: userId
    //                 }).session(session);

    //                 // Remove from admins array if they were admin
    //                 if (userIsAdmin) {
    //                     await this.groupModel.updateOne(
    //                         { _id: groupId },
    //                         { $pull: { admins: userId } }
    //                     ).session(session);
    //                 }

    //                 return {
    //                     action: 'left',
    //                     adminRemoved: userIsAdmin,
    //                     message: `User left the group${userIsAdmin ? ' and admin privileges removed' : ''}`
    //                 };
    //             } else {
    //                 // USER IS JOINING THE GROUP

    //                 // Add to members collection
    //                 const newMember = new this.memberModel({
    //                     groupId,
    //                     member: userId,
    //                     isAdmin: 0, // Always start as regular member
    //                     joinedAt: new Date()
    //                 });

    //                 await newMember.save({ session });

    //                 return {
    //                     action: 'joined',
    //                     message: 'User joined the group as regular member'
    //                 };
    //             }
    //         });

    //         return { success: true };
    //     } catch (error) {
    //         throw error;
    //     } finally {
    //         await session.endSession();
    //     }
    // }

    async isMember(userId, groupId) {
        const member = await this.memberModel.findOne({ member: new Types.ObjectId(userId), groupId: new Types.ObjectId(groupId) })
        console.log(member)
        if (member) {
            return true
        }
        return false
    }

    async toggleAdmin(_superAdminId: string, _userId: string, _groupId: string, isChatGroup: boolean) {
        const adminId = new Types.ObjectId(_superAdminId)
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)
        // console.log(_superAdminId, _userId, _groupId)
        // console.log(adminId, ":admin", userId, ": user", groupId, ": group")
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
            // console.log('isgroup')
            // Toggle isAdmin in GroupMember
            const updatedMember = await this.memberModel.findOneAndUpdate(
                { groupId, member: userId },
                { $bit: { isAdmin: { xor: 1 } } },
                { new: true }
            );
            // console.log(updatedMember)

            if (!updatedMember) {
                throw new NotFoundException('Group member not found');
            }

            // console.log('iis updated member')

            // Update Group's admins array based on new isAdmin status
            if (updatedMember.isAdmin) {
                // console.log('is admin')
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
                // console.log('not admin')
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
            // console.log(updatedMember, 'done')
            return updatedMember;
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        }
        // finally {
        // session.endSession();
        // }
    }

    async removeMember(_adminId: string, _userId: string, _groupId: string) {
        const adminId = new Types.ObjectId(_adminId)
        const userId = new Types.ObjectId(_userId)
        const groupId = new Types.ObjectId(_groupId)

        try {
            // Verify admin permissions and get group data
            const group = await this.groupModel.findOne({
                _id: groupId,
                $or: [
                    { user: adminId },     // Super admin
                    { admins: adminId }    // Regular admin
                ]
            });

            if (!group) {
                throw new ForbiddenException('You do not have permission to perform this action');
            }

            // Prevent removing group creator
            if (group.user.toString() === userId.toString()) {
                throw new ForbiddenException('Cannot remove the group creator');
            }

            // Check if requesting user is super admin
            const isSuperAdmin = group.user.toString() === adminId.toString();

            // Check if target user is an admin
            const targetIsAdmin = group.admins.some(admin => admin.toString() === userId.toString());

            // Only super admin can remove other admins
            if (targetIsAdmin && !isSuperAdmin) {
                throw new ForbiddenException('Only the group creator can remove admins');
            }

            // Remove from members collection
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
