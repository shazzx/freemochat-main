import { axiosClient } from '@/api/axiosClient'
import { useState } from 'react'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'
import {  useAppSelector } from '@/app/hooks'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { FaCheckCircle } from 'react-icons/fa'

function YourAccount() {
    const [usernameOrEmail, setUsernameOrEmail] = useState(null)
    const [buttonState, setButtonState] = useState(true)
    const [loader, setLoader] = useState(false)
    const [otpSent, setOtpSent] = useState(false)

    const navigate = useNavigate()

    const verifyOTP = async (data: any) => {
        try {

            const response = await axiosClient.post("/user/forget-password-request", data, { timeout: 30000 })
            console.log(response.data)
            setOtpSent(true)

        } catch (error) {
            if (!error.response.data.success) {
                toast.info(error.response.data.error.message)
                setLoader(false)
                setButtonState(true)
                return
            }
            setLoader(false)
            setButtonState(true)
            console.log(error.response.data.error.message)
            toast.info("Something went wrong try agian later")
        }
    }

    const mutation = useMutation({
        mutationFn: async (data: {
            username: string,
        }): Promise<any> => {
            let _data = {
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


    const resetPasswordRequest = async () => {

        if (!usernameOrEmail) {
            toast.info("Username can't be empty")
            return
        }


        if (usernameOrEmail.length < 5) {
            toast.info("Username  must be greater than 5 characters")
            return
        }

        setLoader(true)
        setButtonState(false)

        mutation.mutate({
            username: usernameOrEmail
        })
    }

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center top-0 right-0'>
            <Card className='z-10 p-6 border border-accent'>
                {!otpSent && <form  action="" onSubmit={(e) => {
                    e.preventDefault()
                }}>

                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex w-full flex-col justify-start items-start gap-4">
                            <div className="w-full ">
                                <Label className='mb-1' >
                                    Username
                                </Label>
                                <Input
                                    placeholder="Enter Username"
                                    // ref={newPasswordRef}
                                    id="new-password"
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                    type="text"
                                    className="max-w-96 w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <Button className='mt-4' disabled={!usernameOrEmail || !buttonState ? true : false} type="button" onClick={resetPasswordRequest} >{loader ?
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
                </form>}
                {otpSent &&  <div className="flex gap-2 items-center justify-center">
              <FaCheckCircle className="text-green-500 text-xl" />
              <span>Reset password link has been sent to your phone number.</span>
            </div> }
            </Card>
        </div>
    )
}

export default YourAccount