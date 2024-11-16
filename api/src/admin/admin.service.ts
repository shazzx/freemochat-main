import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter } from 'src/schema/Counter';
import { Promotion } from 'src/schema/promotion';
import { Report } from 'src/schema/report';
import { Admin } from './schema/admin';
import { hash } from 'bcrypt';
import { getFileType } from 'src/utils/getFileType';
import { v4 as uuidv4 } from 'uuid'
import { UploadService } from 'src/upload/upload.service';
import { PaymentService } from 'src/payment/payment.service';
import { MetricsAggregatorService } from 'src/metrics-aggregator/metrics-aggregator.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
        @InjectModel(Report.name) private readonly reportModel: Model<Report>,
        @InjectModel(Promotion.name) private readonly campaignModel: Model<Promotion>,
        @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
        private readonly metricsAggregatorService: MetricsAggregatorService,
        private readonly uploadService: UploadService,
        private readonly paymentService: PaymentService
    ) { }

    async getAdmin(username: string) {
        return await this.adminModel.findOne({ username })
    }


    // use this method with caution
    async createAdmin(adminDetails) {
        let admin = await this.adminModel.find()
        if (admin && admin.length > 0) {
            throw new BadRequestException("Please remove your first admin account then create a new one")
        }

        let salt = 6
        let hashPassword = await hash(adminDetails.password, salt)

        return await this.adminModel.create({ ...adminDetails, password: hashPassword })
    }

    async getReports(cursor: string, search: string) {
        let limit = 10
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

        const query = search
            ? { $or: [{_id: new Types.ObjectId(search)}, {postId: new Types.ObjectId(search)}], ..._cursor }
            : _cursor;

            console.log(search)

        const reports = await this.reportModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    let: { userId: { $toObjectId: "$reportedBy" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } }
                    ],
                    as: "reportedBy"
                }
            }
        ])

        const hasNextPage = reports.length > limit
        const _reports = hasNextPage ? reports.slice(0, -1) : reports
        const nextCursor = hasNextPage ? _reports[_reports.length - 1].createdAt.toISOString() : null

        const results = { reports: _reports, nextCursor };
        return results
    }

    async getCampaigns(cursor: string, search: string) {
        let limit = 10
        const _cursor = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

        const query = search
            ? { username: { $regex: search, $options: 'i' }, ..._cursor }
            : _cursor;
        console.log(query)

        const camapaigns = await this.reportModel.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit }
        ])

        const hasNextPage = camapaigns.length > limit
        const _camapaigns = hasNextPage ? camapaigns.slice(0, -1) : camapaigns
        const nextCursor = hasNextPage ? _camapaigns[_camapaigns.length - 1].createdAt.toISOString() : null

        const results = { camapaigns: _camapaigns, nextCursor };
        return results
    }

    async partialRefund(promotionId) {
        let campaign = await this.campaignModel.findById(promotionId)
        if (campaign.paymentDetails.paymentIntentId) {
            let paymentIntentId = campaign.paymentDetails.paymentIntentId
            let refundAmount = Number(campaign.paymentDetails.totalAmount) - (Number(campaign.reach) / 1000)
            console.log(refundAmount)
            let refund = await this.paymentService.partialRefund(paymentIntentId, refundAmount)
            return refund
        }
        throw new InternalServerErrorException()
    }



    async reportPost(postId, reportData) {
        const report = await this.reportModel.create({ reportedBy: reportData.userId, type: reportData.type, postId })
        return report
    }


    async removeReport(reportId) {
        const report = await this.reportModel.findByIdAndDelete(reportId)
        await this.metricsAggregatorService.decrementCount(null, "count", "reports")
        return report
    }

    async getDashboardData() {
        try {
            const [latestCampaigns, latestReports] = await Promise.all([
                // this.counterModel.find({
                //     type: { $in: ['users', 'campaigns', 'reports'] }
                // }).lean(),

                this.campaignModel.find()
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .lean(),

                this.reportModel.find()
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .lean()
            ]);

            const result = await this.counterModel.aggregate([
                {
                    $match: {
                        type: { $in: ['users', 'campaigns', 'reports'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        users: {
                            $push: {
                                $cond: [{ $eq: ['$type', 'users'] }, '$$ROOT', '$$REMOVE']
                            }
                        },
                        campaigns: {
                            $push: {
                                $cond: [{ $eq: ['$type', 'campaigns'] }, '$$ROOT', '$$REMOVE']
                            }
                        },
                        reports: {
                            $push: {
                                $cond: [{ $eq: ['$type', 'reports'] }, '$$ROOT', '$$REMOVE']
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        users: 1,
                        campaigns: 1,
                        reports: 1
                    }
                }
            ]);


            const formattedResult = result[0] || { users: [], campaigns: [], reports: [] };

            return {
                counters: formattedResult,
                latestCampaigns,
                latestReports
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }


    async updateAdmin(adminId: string, updatedDetails: any, file: Express.Multer.File) {
        let profile: string;
        if (file) {

            const fileType = getFileType(file.mimetype)
            const filename = uuidv4()

            let uploaded = await this.uploadService.processAndUploadContent(file.buffer, filename, fileType)

            if (file.originalname == 'profile') {
                profile = uploaded.url
            }
        }
        console.log(profile)

        if (profile) {
            updatedDetails = { ...updatedDetails, profile }
        }

        console.log(adminId, updatedDetails)

        let updatedAdmin = this.adminModel.findByIdAndUpdate(adminId, { $set: { ...updatedDetails } }, { returnOriginal: false })
        return updatedAdmin
    }
}
