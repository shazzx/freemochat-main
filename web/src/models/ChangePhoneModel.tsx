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
import { countryToAlpha3 } from 'country-to-iso'
import { MdClose } from 'react-icons/md'

function ChangePhoneModel({ setModelTrigger }) {

    const { user } = useAppSelector((state) => state.user)

    const [country, setCountry] = useState(null)
    const [cities, setCities] = useState(null)
    const [countries, setCountries] = useState(null)
    const [city, setCity] = useState(null)
    const [_phone, setPhone] = useState(null)
    const [otp, setOtp] = useState(null)
    const areaRef = useRef<HTMLInputElement>()

    const navigate = useNavigate()
    const params = useParams()
    const [searchParams] = useSearchParams()

    const dispatch = useAppDispatch()


    const validatePhone = (_phone, country) => {
        let data = countryToAlpha3(user.address.country)
        console.log(_phone, data)
        return phone(_phone, { country: countryToAlpha3(user.address.country) })
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
        const { data } = await axiosClient.post("/user/resend-otp-user", { type, username: user.username })
        console.log(data)
        if (data.success) {
            toast.success(data.message)
        }
    }
    const [otpSent, setOtpSent] = useState(false)

    const verifyOTP = async (data: any) => {
        try {

            const response = await axiosClient.post("/user/verify-otp-user", data, { timeout: 20000 })

            if (response.data.success) {
                dispatch(updateUser({
                    phone: _phone
                }))

                toast.success('Phone Number Changed')
                navigate('')
            }

        } catch (error) {
            console.log(error)
            toast.info("Wrong or expired OTP")
            setOtpSent(false)
        }
        // return response.data
    }

        const _updateUser = async (data) => {
            const formData = new FormData()
            formData.append("userData", JSON.stringify(data))
    
            try {
                const response = await axiosClient.post("/user/update", formData, { headers: { "Content-Type": 'multipart/form-data' } })
                if (response.status == 201) {
                    dispatch(updateUser(data))
                    toast.info("Phone Number Changed")
                    setModelTrigger(false)
                    navigate('', { replace: true })
                }
            } catch (error) {
                toast.info(error.message)
    
            }
    
        }

    const mutation = useMutation({
        mutationFn: async (data: {
                phone: string,
        }): Promise<any> => {
            // return await verifyOTP(_data)
            return await _updateUser(data)
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
        let phone = validatePhone(_phone, user.country)
        if (phone.isValid) {
            mutation.mutate({
                    phone: phone.phoneNumber
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
                                Phone
                            </Label>
                            <Input
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={otpSent}
                                name="phone"
                                type='number'
                                // ref={phoneRef}
                                placeholder="Enter your phone number"
                                id="phone"
                                // defaultValue={phone}
                                className="max-w-96 w-full"
                            // {...register("phone")}
                            />
                            {/* {errors.phone && <p>{errors.phone.message}</p>} */}
                        </div>
                        {/* <InputOTPForm changeData={changeCountry} setCode={setOtp} setOtpSent={setOtpSent} sent={otpSent} send={true} otpResend={otpResend} onSubmit={changeCountry} buttonTitle={"Change Phone"} data={!_phone || !otpSent ? true : false} type="phone" label="Phone Verification" description={otpSent ? "Please enter the one-time password sent to your phone." : "Click on send to get an OTP for verification."} /> */}
                        <Button type="button" onClick={changeCountry}>Change</Button>
                    </div>

                </form>
            </Card>
        </div>
    )
}

export default ChangePhoneModel