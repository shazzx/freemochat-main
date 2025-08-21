import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { toast } from "react-toastify"
import { setVerificationStatus } from "@/app/features/user/verificationStatusSlice"
import logo from './../assets/logo.png'
import { domain } from "@/config/domain"
import BottomLinks from "./BottomLinks"
import { detectCountryFromNumber } from "@/lib/utils"
import LoginWrapper from "./LoginWrapper"


export function LoginForm() {
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
        onError: (error: any) => {
            if (error.response.data.type == 'not verified') {
                dispatch(setVerificationStatus(error.response.data.verification))
                navigate("/auth/" + error.response.data.user.username + "?auth_id=" + error.response.data.user.auth_id)
                return
            }

            if (error.response.data.message.startsWith('Your account')) {
                toast.error(error.response.data.message)
                return
            }
            toast.error(error.response.data.message)
            setLoginButtonState(false)
        }
    })

    const dispatchUser = async () => {
        dispatch(setAccessToken(mutation.data.access_token))
        let response = await axiosClient.get("user", { headers: { Authorization: `Bearer ${store.getState().auth.access_token}` } })
        dispatch(setUser(response.data))

    }


    const onSubmit = async (data) => {
        setLoginButtonState(true)
        const datas = detectCountryFromNumber(data)
        mutation.mutate(data)
    }
    if (mutation.isSuccess) {
        dispatchUser()
        navigate("/")
    }
    const [loginButtonState, setLoginButtonState] = useState(false)

    return (
        <div className="flex items-center justify-center w-screen h-screen flex-col gap-6">
            <h1 className="text-2xl font-bold "><img className="sm:h-[112px] h-24" src={logo} alt="" /></h1>
            <LoginWrapper/>
            <BottomLinks />
        </div>
    )
}
