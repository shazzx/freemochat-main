import { axiosClient } from '@/api/axiosClient'
import { useState } from 'react'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputOTPForm } from '@/components/Auth/OTPInput'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '@/app/features/user/userSlice'
import emailValdator from "email-validator";

function ChangeEmailModel({ setModelTrigger }) {

    const { user } = useAppSelector((state) => state.user)
    const [email, setEmail] = useState(null)
    const [otp, setOtp] = useState(null)
    const [otpSent, setOtpSent] = useState(false)

    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const otpResend = async (type: string) => {
        const { data } = await axiosClient.post("/user/resend-otp-user", { type, username: user.username })
        console.log(data)
        if (data.success) {
            toast.success(data.message)
        }
    }

    const verifyOTP = async (data: any) => {
        try {

            const response = await axiosClient.post("/user/verify-otp-user", data, { timeout: 20000 })

            if (response.data.success) {
                dispatch(updateUser({
                    email
                }))

                toast.success('Email Number Changed')
                navigate('')
            }

        } catch (error) {
            if (!error.response.data.success) {
                toast.info(error.response.data.error.message)
                setOtpSent(false)
                return
            }

            console.log(error.response.data.error.message)
            toast.info("Wrong or expired OTP")
            setOtpSent(false)
        }
    }

    const mutation = useMutation({
        mutationFn: async (data: {
            otp: string, type: string, updatedData: {
                email: string,
            }
        }): Promise<any> => {
            let _data = {
                username: user.username,
                ...data
            }
            return await verifyOTP(_data)
        },
        onError: (e: any) => {
            if (e.response.data.error.message) {
                toast.info("Wrong or expired OTP")
            }
        },
        onSettled: (data) => {
            console.log(data)
        }
    })


    const changeEmail = async () => {
        let isValidemail = emailValdator.validate(email)
        if (!otp || otp.length !== 6) {
            toast.info("Please complete the otp")
        }

        if (isValidemail) {
            console.log(isValidemail)
            mutation.mutate({
                otp, type: 'email', updatedData: {
                    email
                }
            })
            return
        }
        toast.info("Please write valid email")
    }

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center top-0 right-0'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>
            <Card className='z-10 p-6 border border-accent'>
                <form action="">

                    <div className="flex flex-col gap-4 w-full">
                        <div className="w-full">
                            <Label >
                                Email
                            </Label>
                            <Input
                                onChange={(e) => setEmail(e.target.value)}
                                name="email"
                                type='email'
                                // ref={phoneRef}
                                placeholder="Enter your new email"
                                id="email"
                                // defaultValue={phone}
                                className="max-w-96 w-full"
                            // {...register("phone")}
                            />
                            {/* {errors.phone && <p>{errors.phone.message}</p>} */}
                        </div>
                        <InputOTPForm changeData={changeEmail} setCode={setOtp} setOtpSent={setOtpSent} sent={otpSent} send={true} otpResend={otpResend} onSubmit={changeEmail} buttonTitle={"Change Email"} data={!email || !otpSent ? true : false} type="email" label="Email Verification" description={otpSent ? "Please enter the one-time password sent to your email." : "Click on send to get an OTP for verification."} />

                    </div>

                </form>
            </Card>
        </div>
    )
}

export default ChangeEmailModel