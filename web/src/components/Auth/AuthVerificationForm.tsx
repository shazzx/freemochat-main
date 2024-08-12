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
import { Link, useNavigate } from "react-router-dom"
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

function AuthVerificationForm() {
    const { register, handleSubmit } = useForm({ resolver: zodResolver(LoginUserSchema) })
    const navigate = useNavigate()

    const dispatch = useAppDispatch()

    const loginUser = async (data: any) => {
        const response = await axiosClient.post("/user/login", data, { withCredentials: true })
        return response.data
    }

    const mutation = useMutation({
        mutationFn: async (data): Promise<any> => {
            return await loginUser(data)
        },
        onError: () => {
        }
    })

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
        dispatchUser()
        navigate("/")
    }
    const [signupButtonState, setSignupButtonState] = useState(false)


    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <Card className="flex flex-col p-4 items-center justify-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-12 max-w-96 p-4">
                    <InputOTPForm label="Email Verification" description="Please enter the one-time password sent to your email."/>
                    <InputOTPForm label="Phone Verification" description="Please enter the one-time password sent to your phone."/>
                </CardContent>
            </Card>
        </div>
    )
}

export default AuthVerificationForm