import { axiosClient } from '@/api/axiosClient'
import { useState } from 'react'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputOTPForm } from '@/components/Auth/OTPInput'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { updateUser } from '@/app/features/user/userSlice'
import emailValdator from "email-validator";
import { Button } from '@/components/ui/button'
import { MdClose } from 'react-icons/md'

function ChangePasswordModel({ setModelTrigger, setForgetPasswordModel }) {

    const { user } = useAppSelector((state) => state.user)
    const [confirmPassword, setConfirmPassword] = useState(null)
    const [newPassword, setNewPassword] = useState(null)
    const [currentPassword, setCurrentPassword] = useState(null)

    const [otp, setOtp] = useState(null)
    const [otpSent, setOtpSent] = useState(false)
    const [buttonState, setButtonState] = useState(true)
    const [loader, setLoader] = useState(false)

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

            const response = await axiosClient.post("/user/change-current-password", data, { timeout: 20000 })
            toast.success('Password Changed')
            navigate('')

        } catch (error) {
            console.log(error)
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
            changePassword: {
                currentPassword: string,
                password: string,
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


    const changePassword = async () => {
        // if (!otp || otp.length !== 6) {
        //     toast.info("Please complete the otp")
        //     return
        // }


        if (!currentPassword) {
            toast.info("Current password can't be empty")
            return
        }
        console.log(currentPassword.length)

        if (currentPassword.length < 7) {
            toast.info("Current password must be of 8 characters long")
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
            changePassword: {
                currentPassword: currentPassword,
                password: newPassword
            }
        })
    }

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center top-0 right-0'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>

            <Card className='z-10 p-2 border border-accent'>
                <MdClose cursor="pointer" size={18} className='ml-auto' onClick={() => {
                    setModelTrigger(false)
                }} />
                <form action="" className='p-4'>
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex w-full flex-col justify-start items-start gap-4">
                            <div className="w-full">
                                <Label>
                                    Current Password
                                </Label>

                                <Input
                                    placeholder="Enter your current password"
                                    // ref={currentPasswordRef}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    id="current-password"
                                    type="password"
                                    className="max-w-96 w-full"
                                />
                                <span onClick={() => {
                                    setForgetPasswordModel(true)
                                    setModelTrigger(false)
                                }} className="ml-auto inline-block text-sm float-end cursor-pointer m-1 underline">
                                    Forgot your password?
                                </span>
                            </div>
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
                        <Button disabled={!confirmPassword || !currentPassword || !newPassword || !buttonState ? true : false} type="button" onClick={changePassword} >{loader ?
                            <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                                width="24" height="24">
                                <path
                                    d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                                    stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path
                                    d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                                    stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                                </path>
                            </svg>
                            : 'Change Password'}</Button>
                    </div>

                </form>
            </Card>
        </div>
    )
}

export default ChangePasswordModel