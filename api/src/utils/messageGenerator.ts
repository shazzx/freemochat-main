export const messageGenerator = (fullname: string, otp: string, type?: string) => {
    if(type == 'reset-password'){
        return `Freemochat: Use this link to reset your password: ${otp} Valid for 30 minutes.`;
    }
    if(type == 'register'){
        return `Freemochat: ${otp} is your verification code. Valid for 30 minutes.`;
    }else{
        return `Freemochat: ${otp} is your verification code. Valid for 30 minutes. Ignore if you didn't request this.`;
    }
}
