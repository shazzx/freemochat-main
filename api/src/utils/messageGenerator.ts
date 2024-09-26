export const messageGenerator = (fullname: string, otp: string, type?: string) => {
    if(type == 'reset-password'){
        return `Dear ${fullname},\n\nYour reset password link is ${otp}. It is valid for the next 5 minutes.\n\nThank you,\nFreedombook`;
    }
    if(type == 'register'){
        return `Dear ${fullname},\n\nYour OTP is ${otp}. It is valid for the next 5 minutes.\n\nThank you,\nFreedombook`;
    }else{
        return `Dear ${fullname},\n\nYour OTP is ${otp}. It is valid for the next 5 minutes.\n\nIf you did not request this, please contact us immediately.\n\nThank you,\nFreedombook`;
    }
}