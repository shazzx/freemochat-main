import { axiosClient } from '@/api/axiosClient'
import React, { useEffect, useRef, useState } from 'react'
import { SelectScrollable } from './SelectScrollable'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Card } from '@/components/ui/card'
import { phone } from 'phone'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InputOTPForm } from '@/components/Auth/OTPInput'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { updateUser } from '@/app/features/user/userSlice'
import { MdClose } from 'react-icons/md'
function ChangeCountryModel({ setModelTrigger }) {

    const { user } = useAppSelector((state) => state.user)
    console.log(user.address)
    const [country, setCountry] = useState({ name: user.address.country })
    const [cities, setCities] = useState(null)
    const [countries, setCountries] = useState(null)
    const [city, setCity] = useState(user.address.city)
    const [_phone, setPhone] = useState(null)
    const [otp, setOtp] = useState(null)
    const areaRef = useRef<HTMLInputElement>()

    const navigate = useNavigate()
    const params = useParams()
    const [searchParams] = useSearchParams()

    const dispatch = useAppDispatch()


    const validatePhone = (_phone, country) => {
        return phone(_phone, { country: country || "PK" })
    }

    useEffect(() => {
        const fetchCountries = async () => {
            const { data } = await axiosClient.get('/location/countries')
            setCountries(data)
        }
        fetchCountries()
    }, [])

    useEffect(() => {

        if (country !== null) {
            console.log(country)
            const fetchCities = async () => {
                const { data } = await axiosClient.get('/location/cities', { params: { country: country.name } })
                console.log(data, 'cities')
                setCities(data)
            }

            fetchCities()
        }
    }, [country])

    const [isPhoneValid, setIsPhoneValid] = useState(false)

    useEffect(() => {
        if (country && _phone) {
            let phoneValidation = validatePhone(_phone, country['iso3'])
            if (!phoneValidation.isValid) {
                setIsPhoneValid(false)
                return
            }
            setIsPhoneValid(true)
        }
    }, [_phone])


    const otpResend = async (type: string) => {

        if (!country || !city) {
            toast.info("please select country and city")
            return
        }


        if (areaRef.current.value.length < 3) {
            toast.info("area name must be of 3 or more characters")
            return
        }



        let phone = validatePhone(`${_phone}`, country["iso3"])

        if (phone.isValid) {
            setOtpSent(true)
            const { data } = await axiosClient.post("/user/resend-otp-user", { type, username: user.username, phone: phone.phoneNumber })
            if (data.success) {
                toast.success(data.message)
            }
            return
        }

        toast.info("phone number does not match with your selected country")

    }
    const [otpSent, setOtpSent] = useState(false)

    const verifyOTP = async (data: any) => {
        try {

            const response = await axiosClient.post("/user/verify-otp-user", data, { timeout: 20000 })
            console.log(response.data)

            if (response.data.success) {
                dispatch(updateUser({
                    address: {
                        country: country.name,
                        city,
                        area: areaRef.current.value
                    }
                }))

                toast.success('Address Changed')
                navigate('')
            }

        } catch (error) {
            toast.info("Wrong or expired OTP")
            setOtpSent(false)
        }
        // return response.data
    }

    const mutation = useMutation({
        mutationFn: async (data: {
            otp?: string, type?: string, updatedData: {
                phone?: string, address: {
                    country: string,
                    city: string,
                    area: string
                }
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


    const changeCountry = async () => {
        if (country.name == user.address.country) {
            mutation.mutate({
                updatedData: {
                    address: {
                        country: country.name,
                        city,
                        area: areaRef.current.value
                    }
                }
            })
            return
        }
        let phone = validatePhone(`${_phone}`, country["iso3"])

        if (phone.isValid) {
            mutation.mutate({
                otp, type: 'phone', updatedData: {
                    phone: phone.phoneNumber, address: {
                        country: country.name,
                        city,
                        area: areaRef.current.value
                    }
                }
            })
            return
        }
        toast.info("phone number is not valid")
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
                <form action="" className='p-4' onSubmit={(e) => {
                    e.preventDefault()
                    let valid = validatePhone(_phone, country['iso3'])
                    console.log(valid)
                }}>

                    <div className="flex flex-col gap-4 w-full">
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
                                <SelectScrollable placeholder={"Select country"} defaultValue={user?.address?.country} selectData={countries} setCity={setCity} setCountry={setCountry} />
                            </div>

                        </div>
                        <div className="w-full">
                            <Label >
                                City
                            </Label>
                            <SelectScrollable
                                placeholder={"Select city"}
                                selectData={cities}
                                defaultValue={country?.name == user.address.country ? user?.address?.city : null}
                                setCity={setCity}
                                setCountry={setCountry}
                                areCities={true}
                                countryName={country} />
                        </div>

                        <div className="w-full">
                            <div className="w-full">
                                <Label >
                                    Area
                                </Label>
                                <Input
                                    disabled={!country || !city ? true : false}
                                    name="area"
                                    placeholder="Enter your area name"
                                    ref={areaRef}
                                    id="area"
                                    defaultValue={country?.name == user.address.country ? user.address.area : null}
                                    className="max-w-96 w-full"
                                />
                            </div>
                        </div>
                        {country.name !== user.address.country &&
                            <div className="w-full">
                                <Label >
                                    Phone
                                </Label>
                                <Input
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!country || !city ? true : false}
                                    name="phone"
                                    type='number'
                                    placeholder="Enter your phone number"
                                    id="phone"
                                    className="max-w-96 w-full"
                                />
                            </div>}
                        {
                            (country?.name == user.address.country) ?
                                <Button type='button' onClick={changeCountry}>Change Address</Button>
                                :
                                <InputOTPForm changeData={changeCountry} setCode={setOtp} setOtpSent={setOtpSent} sent={otpSent} send={true} otpResend={otpResend} onSubmit={changeCountry} buttonTitle={"Change Address"} data={!country || !city || !_phone || !otpSent ? true : false} type="phone" label="Phone Verification" description={otpSent ? "Please enter the one-time password sent to your phone." : "Click on send to get an OTP for verification."} />
                        }

                    </div>

                </form>
            </Card>
        </div>
    )
}

export default ChangeCountryModel