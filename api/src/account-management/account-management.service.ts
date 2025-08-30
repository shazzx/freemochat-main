import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Suspension } from 'src/schema/Suspension';
import { User } from 'src/schema/user';
import { Types } from 'mongoose'
import { UserService } from 'src/user/user.service';

@Injectable()
export class AccountManagementService {
    constructor(
        @InjectModel(Suspension.name) private suspensionModel: Model<Suspension>,
        private userService: UserService,
    ) { }


    async toggleSuspendUser(userId: string, reason: string): Promise<{ userId: string, suspended: boolean, message: string }> {
        const deleteResult = await this.suspensionModel.deleteOne({ userId: new Types.ObjectId(userId) });

        if (deleteResult.deletedCount === 0) {
            await this.suspensionModel.create({ userId: new Types.ObjectId(userId), reason });
            return { userId, suspended: true, message: 'account has been suspended' };
        }
        return { userId, suspended: false, message: 'account has been activated' };
    }

    async deactivateAccount(userId: string) {
        return this.userService.updateUser(userId, { isActive: false })
    }

    async reactivateAccount(userId: string) {
        return this.userService.updateUser(userId, { isActive: true })
    }

    async getAccountStatus(userId: string) {
        const user = await this.userService.getRawUser(userId)
        const isSuspended = await this.suspensionModel.findOne({ userId: new Types.ObjectId(userId) })

        let accountStatus = { isActive: user.isActive, isSuspended: isSuspended ? true : false }
        return accountStatus
    }


}