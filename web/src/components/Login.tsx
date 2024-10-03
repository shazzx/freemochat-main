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
import profile from './../assets/logo.png'
import { domain } from "@/config/domain"


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
        mutation.mutate(data)
        console.log(data)

    }
    if (mutation.isSuccess) {
        dispatchUser()
        navigate("/")
    }
    console.log('yes')
    const [loginButtonState, setLoginButtonState] = useState(false)

    return (
        <div className="flex items-center justify-center w-screen h-screen flex-col gap-10">
            <h1 className="text-2xl font-bold "><img className="sm:h-[72px] h-16" src={profile} alt="" /></h1>
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your username below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="type your email or username"
                                    {...register("username")}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <Link to={`${domain}/forget-password`} className="ml-auto inline-block text-sm underline">
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input id="password" type="password" {...register("password")} required />
                            </div>
                            <Button disabled={loginButtonState} type="submit" className="w-full">
                                {loginButtonState ?
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
                                    :

                                    "Login"}
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="underline">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div className="flex flex-col gap-2 items-center justify-center">
                <div className="flex flex-wrap max-w-72 items-center justify-center gap-2">
                    <span className="text-xs cursor-pointer">
                        Privacy Policy
                    </span>
                    <span className="text-xs cursor-pointer">
                        Terms of Service
                    </span>
                    <span className="text-xs cursor-pointer">
                        Cookie Policy
                    </span>
                    <span className="text-xs cursor-pointer">
                        Help/FAQ
                    </span>
                    <span className="text-xs cursor-pointer">
                        Contact Us
                    </span>
                </div>
                <div>
                    <span className="text-xs cursor-pointer">
                        Freedombook @ 2024
                    </span>
                </div>
            </div>
        </div>
    )
}
