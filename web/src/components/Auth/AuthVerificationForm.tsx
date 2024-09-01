import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { LoginUserSchema } from "@/utils/schemas/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { axiosClient } from "@/api/axiosClient"
import { useMutation } from "@tanstack/react-query"
import { setAccessToken } from "@/app/features/user/authSlice"
import { useAppDispatch } from "@/app/hooks"
import { store } from "@/app/store"
import { setUser } from "@/app/features/user/userSlice"
import { useState } from "react"
import { InputOTPForm } from "./OTPInput"
import { toast } from "react-toastify"

function AuthVerificationForm() {
    const { register, handleSubmit } = useForm({ resolver: zodResolver(LoginUserSchema) })
    const navigate = useNavigate()
    const params = useParams()
    const [searchParams] = useSearchParams()
    const authId = searchParams.get("auth_id")
    const [emailVerificationStatus, setEmailVerificationStatus] = useState(false)
    const [phoneVerificationStatus, setPhoneVerificationStatus] = useState(false)
    const username  = params.username
    if(!authId || !username){
        navigate("/login")
    }

    const dispatch = useAppDispatch()

    const verifyOTP = async (data: any) => {
        
        const response = await axiosClient.post("/user/verify-otp", data, {timeout: 20000})
        console.log(response.data)
        // return response.data
    }
    // 139578 emailOTP:  653196
    const mutation = useMutation({
        mutationFn: async (data: {pin: string, type: string}): Promise<any> => {
            let _data = {
                otp: data.pin,
                type: data.type,
                authId,
                username
            }
            return await verifyOTP(_data)
        },
        onError: (e: any) => {
            if(e.response.data.error.message){
                toast.info("Wrong or expired OTP")
            }
        },
        onSettled: (data) => {
            console.log(data)
        }
    })

    const otpResend  = async(type: string) => {
        const {data} = await axiosClient.post("/user/resend-otp", {type, authId, username})
        console.log(data)
        if(data.success){
            toast.success(data.message)
        }
      }

    const dispatchUser = async () => {
        dispatch(setAccessToken(mutation.data.access_token))
        let response = await axiosClient.get("user", { headers: { Authorization: `Bearer ${store.getState().auth.access_token}` } })
        dispatch(setUser(response.data))
    }

    const onSubmit = async (data) => {
        mutation.mutate(data)
        console.log(data)
    }

    if (mutation.isSuccess) {
        // dispatchUser()
        // navigate("/")
    }
    const [signupButtonState, setSignupButtonState] = useState(false)


    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <Card className="flex flex-col p-4 items-center justify-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-12 max-w-96 p-4">
                    <InputOTPForm otpResend={otpResend} onSubmit={onSubmit} type="email" label="Email Verification" description="Please enter the one-time password sent to your email."/>
                    <InputOTPForm otpResend={otpResend} onSubmit={onSubmit} type="phone" label="Phone Verification" description="Please enter the one-time password sent to your phone."  />
                </CardContent>
            </Card>
        </div>
    )
}

export default AuthVerificationForm