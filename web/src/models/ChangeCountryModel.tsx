import { axiosClient } from '@/api/axiosClient'
import React, { useEffect, useState } from 'react'
import { SelectScrollable } from './SelectScrollable'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Card } from '@/components/ui/card'
import { phone } from 'phone'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
function ChangeCountryModel({ setModelTrigger }) {

    const [country, setCountry] = useState(null)
    const [cities, setCities] = useState(null)
    const [countries, setCountries] = useState(null)
    const [city, setCity] = useState(null)
    const [_phone, setPhone] = useState(null)

    const valdatePhone = (phone, country) => {
        phone(phone, { country:  country || "PK" })
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
                const { data } = await axiosClient.get('/location/cities', { params: { country } })
                console.log(data, 'cities')
                setCities(data)
            }

            fetchCities()
        }
    }, [country])

    useEffect(()  => {
        console.log(_phone)
    }, [_phone])

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center top-0 right-0'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>
            <Card className='z-10 p-6 border border-accent'>
                <form action="" onSubmit={()=>{
                    valdatePhone(_phone, "PK")
                } }>

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
                                <SelectScrollable placeholder={"Select country"} selectData={countries} setCity={setCity} setCountry={setCountry} />
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
                        </div>
                        <div className="w-full">
                            <Label >
                                Phone
                            </Label>
                            <Input
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={!country || !city ? true : false}
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
                    </div>
                    <Button disabled={!country || !city ||  !_phone? true : false} >Change</Button>
                </form>
            </Card>
        </div>
    )
}

export default ChangeCountryModel