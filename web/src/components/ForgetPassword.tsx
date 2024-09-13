import { axiosClient } from '@/api/axiosClient'
import { useState } from 'react'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputOTPForm } from '@/components/Auth/OTPInput'
import { toast } from 'react-toastify'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

function ForgetPassword() {
    const [confirmPassword, setConfirmPassword] = useState(null)
    const [newPassword, setNewPassword] = useState(null)

    const params = useParams()
    const [searchParams] = useSearchParams()
    
    console.log(params.auth, searchParams.get('username'))


    const [otp, setOtp] = useState(null)
    const [otpSent, setOtpSent] = useState(false)
    const [buttonState, setButtonState] = useState(true)
    const [loader, setLoader] = useState(false)

    const navigate = useNavigate()

    const otpResend = async (type: string) => {
        const { data } = await axiosClient.post("/user/resend-otp-user", { type, username: params.username })
        console.log(data)
        if (data.success) {
            toast.success(data.message)
        }
    }

    const verifyOTP = async (data: any) => {
        try {

            const response = await axiosClient.post("/user/forget-password", data, { timeout: 30000 })
            toast.success('Password Changed')
            navigate('')

        } catch (error) {
            if (!error.response.data.success) {
                toast.info(error.response.data.error.message)
                setOtpSent(false)
                setLoader(false)
                setButtonState(true)
                return
            }
            setLoader(false)
            setButtonState(true)
            console.log(error.response.data.error.message)
            toast.info("Wrong or expired OTP")
            setOtpSent(false)
        }
    }

    const mutation = useMutation({
        mutationFn: async (data: {
            otp: string, type: string,
            changePassword: {
                password: string,
            }
        }): Promise<any> => {
            let _data = {
                // username: user.username,
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


    const changePassword = async () => {
        if (!otp || otp.length !== 6) {
            toast.info("Please complete the otp")
            return
        }

        if (!newPassword) {
            toast.info("Current password can't be empty")
            return
        }

        if (newPassword.length < 7) {
            toast.info("New password must be of 8 characters long")
            return
        }


        if (!confirmPassword) {
            toast.info("Current password can't be empty")
            return
        }

        if (confirmPassword.length < 7) {
            toast.info("Confirm password must be of 8 characters long")
            return
        }


        if (confirmPassword !== newPassword) {
            toast.info("Confirm Password does not match")
            return
        }
        setLoader(true)
        setButtonState(false)

        mutation.mutate({
            otp, type: 'email', changePassword: {
                password: newPassword
            }
        })
    }

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center top-0 right-0'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
            }}></div>
            <Card className='z-10 p-6 border border-accent'>
                <form action="" onSubmit={(e) => {
                    e.preventDefault()
                }}>

                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex w-full flex-col justify-start items-start gap-4">
                            <div className="w-full">
                                <Label >
                                    New Password
                                </Label>
                                <Input
                                    placeholder="Enter new secure password"
                                    // ref={newPasswordRef}
                                    id="new-password"
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    type="password"
                                    className="max-w-96 w-full"
                                />
                            </div>
                            <div className="w-full">
                                <Label >
                                    Confirm Password
                                </Label>
                                <Input
                                    placeholder="Confirm Password"
                                    // ref={newPasswordRef}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    id="confirm-password"
                                    type="password"
                                    className="max-w-96 w-full"
                                />
                            </div>
                        </div>
                        <InputOTPForm loader={loader} changeData={changePassword} setCode={setOtp} setOtpSent={setOtpSent} sent={otpSent} send={true} otpResend={otpResend} onSubmit={changePassword} buttonTitle={"Change Password"} data={!confirmPassword || !confirmPassword || !otpSent || !buttonState ? true : false} type="email" label="Password Verification" description={otpSent ? "Please enter the one-time password sent to your email." : "Click on send to get an OTP for verification."} />

                    </div>

                </form>
            </Card>
        </div>
    )
}

export default ForgetPassword