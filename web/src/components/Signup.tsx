import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { axiosClient } from "@/api/axiosClient"
import { useMutation } from "@tanstack/react-query"
import { useForm } from 'react-hook-form'
import { useEffect, useState } from "react"
import { useToast } from "./Toast"
import { CustomCheckbox } from "./CustomCheckbox"
import { loginSuccess, setAccessToken } from "@/app/features/user/authSlice"
import { useAppDispatch } from "@/app/hooks"
import { Input } from "./ui/input"
import { yupResolver } from "@hookform/resolvers/yup"
import { SignupSchema } from "@/utils/schemas/auth"
import Selector from "./Selector"
import { SelectScrollable } from "@/models/SelectScrollable"


export function Signup() {
    // const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(_SignupUserSchema) })
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(SignupSchema),
        mode: 'onChange',
    });
    const [signupButtonState, setSignupButtonState] = useState(false)
    const [agreementCondition, setAgreementCondition] = useState(false)
    const { showToast } = useToast()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [country, setCountry] = useState(null)
    const [cities, setCities] = useState(null)
    const [city, setCity] = useState(null)


    useEffect(() => {
        console.log(errors)
    }, [errors])

    const signupUser = async (_data) => {
        const { data } = await axiosClient.post("/user/create", _data, { timeout: 30000 })
        return data
    }

    const { mutateAsync, data, isError, isSuccess } = useMutation({
        mutationFn: async (data): Promise<any> => {
            const response = await signupUser(data)
            return response
        },
        onError: () => {
            showToast("something went wrong please try again", "error")
            setSignupButtonState(false)
        }
    })

    const dispatchData = (data) => {
        console.log(data)
        dispatch(setAccessToken(data.access_token))
        dispatch(loginSuccess(data.user))
    }

    if (isSuccess) {
        showToast("signed up successfully", "success")
        // dispatchData(data)
        navigate("/auth/" + data?.username + "?auth_id=" + data?.tempSecret)
    }

    useEffect(() => {
        if (country !== null) {
            console.log(country)
            const fetchCities = async () => {
                const {data} = await axiosClient.get('/user/cities', { params: { country } })
                console.log(data, 'cities')
                setCities(data)
            }

            fetchCities()
        }
    }, [country])

    const onSubmit = (_data) => {
        if (!country || !city) {
            throw new Error("please select country and city")
        }
        let data = { ..._data, address: { country, city, ..._data.address } }
        mutateAsync(data)
    }


    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <Card className="mx-auto max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign Up</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4">
                            <div className="flex gap-2">
                                <div className="">
                                    <Label htmlFor="firstname">Firstname</Label>
                                    <Input
                                        type="text"
                                        placeholder="Firstname"
                                        name="firstname"
                                        {...register("firstname")}
                                    />
                                    {errors.firstname && <p>{errors.firstname.message}</p>}


                                </div>
                                <div className="">
                                    <Label htmlFor="lastname">Lastname</Label>
                                    <Input
                                        type="text"
                                        placeholder="Lastname"
                                        name="lastname"
                                        {...register("lastname")}
                                    />
                                    {errors.lastname && <p>{errors.lastname.message}</p>}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    type="text"
                                    placeholder="Username"
                                    name="username"
                                    {...register("username")}
                                />
                                {errors.username && <p>{errors.username.message}</p>}

                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    name="email"
                                    {...register("email")}
                                />
                                {errors.email && <p>{errors.email.message}</p>}
                            </div>

                            <div className="flex gap-4 w-full">
                                <div className="w-full">
                                    <Label >
                                        Country
                                    </Label>
                                    {/* <Input
                                        name="country"
                                        placeholder="Enter your country name"
                                        id="country"
                                        className="max-w-96 w-full"
                                        {...register("address.country")}
                                    />
                                    {errors.address?.country && <p>{errors.address.country.message}</p>} */}
                                    <div className="flex gap-2 ">
                                        <SelectScrollable placeholder={"Select country"} selectData={
                                            [
                                                { name: 'Pakistan', code: 92 },
                                                { name: 'United States America', code: 68 },
                                                // { name: "Pakistan", "phone_code": "92", cities: ["Karachi", "Islamabad"] },
                                                // { name: "Australia", "phone_code": "92", cities: ["Karachi", "Islamabad"] },
                                                // { name: "India", "phone_code": "92", cities: ["Karachi", "Islamabad"] }
                                            ]
                                        } setCity={setCity} setCountry={setCountry} />
                                    </div>

                                </div>
                                <div className="w-full">
                                    <Label >
                                        City
                                    </Label>
                                    <SelectScrollable
                                        placeholder={"Select city"}
                                        selectData={cities}
                                        setCity={setCity}
                                        setCountry={setCountry}
                                        areCities={true}
                                        countryName={country} />
                                    {/* <Input
                                        name="city"
                                        placeholder="Enter your city name"
                                        id="city"
                                        className="max-w-96 w-full"
                                        {...register("address.city")}
                                    />
                                    {errors.address?.city && <p>{errors.address.city.message}</p>} */}
                                </div>

                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="area">Area</Label>
                                <Input
                                    type="text"
                                    placeholder="Area"
                                    name="area"
                                    {...register("address.area")}
                                />
                                {errors.address?.area && <p>{errors.address.area.message}</p>}

                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    placeholder="password"
                                    name="password"
                                    {...register("password")}
                                />
                                {errors.password && <p>{errors.password.message}</p>}

                            </div>


                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    type="password"
                                    placeholder="confirm password"
                                    name="confirmPassword"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

                            </div>


                            <div >
                                <CustomCheckbox message={"Accept terms and conditions"} setAgreementCondition={setAgreementCondition} />
                            </div>
                            <Button disabled={!agreementCondition} onClick={() => {
                                setSignupButtonState(true)
                            }}>
                                {signupButtonState ?
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

                                    "Create Account"}
                            </Button>
                        </div>




                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link to="#" className="underline">
                                Login
                            </Link>
                        </div>
                    </form>

                </CardContent>
            </Card>
        </div>

    )
}
