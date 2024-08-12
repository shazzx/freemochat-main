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
import { useMutation } from "@tanstack/react-query"
import { useAppDispatch } from "@/app/hooks"
import { axiosClient } from "@/api/Admin/axiosClient"
import { setAccessToken } from "@/app/features/admin/authSlice"
import { setAdmin } from "@/app/features/admin/adminSlice"

export function AdminLogin() {
    const { register, handleSubmit } = useForm({ resolver: zodResolver(LoginUserSchema) })
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const loginAdmin = async (data: any) => {
        const response = await axiosClient.post("/admin/login", data, { withCredentials: true })
        return response.data
    }

    const mutation = useMutation({
        mutationFn: async (data): Promise<any> => {
            return await loginAdmin(data)
        },
        onError: (e) => {
            console.log(e)

        }
    })

    const dispatchUser = async () => {
        console.log(mutation.data.user)
        dispatch(setAccessToken(mutation.data.access_token))
        dispatch(setAdmin(mutation.data.user))
    }

    const onSubmit = async (data) => {

        mutation.mutate(data)
    }
    if (mutation.isSuccess) {
        dispatchUser()
        navigate("/admin")
    }

    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Email/Username</Label>
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
                                    <Link to="#" className="ml-auto inline-block text-sm underline">
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input id="password" type="password" {...register("password")} required />
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
