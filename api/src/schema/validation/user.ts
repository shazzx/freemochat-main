import { z } from 'zod'
import { Cursor, ValidMongoId } from './global'
import { isUUID } from 'validator'
// firstname: 'shahzad',
//   lastname: 'ali',
//   username: 'shahzadali',
//   email: 'shahzadali@gmail.com',
//   address: { country: 'pakistan', city: 'karachi', area: 'Pipri' },
//   password: 'shazzhere',
//   confirmPassword: 'shazzhere'

export const CreateUser = z.object({
    firstname: z.string(),
    lastname: z.string().optional(),
    username: z.string(),
    phone: z.string(),
    email: z.string().email(),
    password: z.string(),
    confirmPassword: z.string(),
    address: z.object({
        country: z.string(),
        city: z.string(),
        area: z.string(),
    })
})


export const UpdateUser = z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    username: z.string().optional(),
    bio: z.string().nullable().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.object({
        country: z.string().optional(),
        city: z.string().optional(),
        area: z.string().optional(),
    }).optional(),
    images: z.object({
        profile: z.string().optional(),
        cover: z.string().optional(),
    }).optional(),
    education: z.array(z.object({
        institution: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string(),
        startYear: z.number(),
        endYear: z.number().nullable(),
        description: z.string(),
    })).optional(),
    workExperience: z.array(z.object({
        jobTitle: z.string(),
        company: z.string(),
        totalYears: z.number(),
        description: z.string(),
    })).optional(),
    socialMedia: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        linkedin: z.string().optional(),
        whatsapp: z.string().optional(),
    }).optional(),
    website: z.string().optional(),

})


export const LoginUser = z.object({
    username: z.string(),
    password: z.string()
})


export const GetUser = z.object({
    username: z.string().optional(),
})

export const FriendGeneral = z.object({
    recepientId: ValidMongoId
})


export const GetFriends = Cursor.extend({
    groupId: ValidMongoId.optional(),
    userId: ValidMongoId
})


export const VerifyOTP = z.object({
    username: z.string().min(5),
    otp: z.string(),
    type: z.string(),
    authId: z.string().refine(
        (val) => isUUID(val),
        {
            message: 'Invalid UUID',
        }
    )
})


export const VerifyOTPUser = z.object({
    username: z.string().min(5),
    otp: z.string().optional(),
    type: z.string().optional(),
    updatedData: z.object({
        changePassword: z.object({
            password: z.string(),
            currentPassword: z.string(),
        }).optional(),
        phone: z.string().optional(),
        email: z.string().email(),
        address: z.object({
            country: z.string(),
            city: z.string(),
            area: z.string(),
        }).optional(),
    }
    )
})


export const ChangePassword = z.object({
    changePassword: z.object({
        password: z.string(),
        currentPassword: z.string(),
    }),
})


export const ForgetPassword = z.object({
    otp: z.string(),
    type: z.string(),
    username: z.string(),
    authId: z.string().refine(
        (val) => isUUID(val),
        {
            message: 'Invalid UUID',
        }
    ).optional(),
    changePassword: z.object({
        password: z.string(),
    }),
})


export const ForgetPasswordPub = z.object({
    username: z.string(),
    authId: z.string().refine(
        (val) => isUUID(val),
        {
            message: 'Invalid UUID',
        }
    ).optional(),
    changePassword: z.object({
        password: z.string(),
    }),
})


export const ForgetPasswordRequest = z.object({
    username: z.string().optional(),
})

export const resendOTP = z.object({
    username: z.string().min(5),
    type: z.string(),
    authId: z.string().refine(
        (val) => isUUID(val),
        {
            message: 'Invalid UUID',
        }
    )
})


export const resendOTPUser = z.object({
    email: z.string().optional(),
    username: z.string(),
    type: z.string(),
})


export const usernameExists = z.object({
    username: z.string(),
})


export const areFriends = z.object({
    friendId: z.string(),
})

export const verificationStatus = z.object({
    username: z.string().min(5),
    authId: z.string().refine(
        (val) => isUUID(val),
        {
            message: 'Invalid UUID',
        }
    )
})


export type CreateUserDTO = z.infer<typeof CreateUser>
export type UpdateUserDTO = z.infer<typeof UpdateUser>
export type LoginUserDTO = z.infer<typeof LoginUser>
export type GetUserDTO = z.infer<typeof GetUser>
export type FriendGeneralDTO = z.infer<typeof FriendGeneral>
export type GetFriendsDTO = z.infer<typeof GetFriends>
export type VerifyOTPDTO = z.infer<typeof VerifyOTP>
export type VerifyOTPUserDTO = z.infer<typeof VerifyOTPUser>
export type ChangePasswordDTO = z.infer<typeof ChangePassword>
export type ForgetPasswordDTO = z.infer<typeof ForgetPassword>
export type ForgetPasswordPubDTO = z.infer<typeof ForgetPasswordPub>
export type ForgetPasswordRequestDTO = z.infer<typeof ForgetPasswordRequest>
export type resendOTPDTO = z.infer<typeof resendOTP>
export type resendOTPUserDTO = z.infer<typeof resendOTPUser>
export type usernameExistsDTO = z.infer<typeof usernameExists>
export type areFriendsDTO = z.infer<typeof areFriends>
export type verificationStatusDTO = z.infer<typeof verificationStatus>