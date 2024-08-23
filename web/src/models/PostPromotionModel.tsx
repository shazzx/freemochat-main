import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { useEffect, useRef, useState } from 'react'
import { SelectScrollable } from './SelectScrollable'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import postPromotionSchema from '@/utils/schemas/main'
import { axiosClient } from '@/api/axiosClient'

function PostPromotionModel({ postId, setPostPromotion }) {
    const reachTarget = useRef()
    const [totalCost, setTotalCost] = useState(1)
    const redirectToCheckout = async (sessionId: string) => {
        const stripePromise = loadStripe("pk_test_51OMOYiE4GJiGICjcO7ETml0xmXgcLyayr3PBHDGakHbbgObG1hECGcafKcrPq10zZq29dTEiCYN0KTKWlNZDccKm001MdZtqdZ")
        const stripe = await stripePromise
        stripe?.redirectToCheckout({
            sessionId,
        }).then((data) => {
            console.log(data)
        })
    }


    let postPromotion = async (target) => {
        let { data } = await axiosClient.post("posts/promotion", { postId, promotionDetails: { reachTarget: target.numberField } })
        console.log(data)
        redirectToCheckout(data.id)
    }


    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(postPromotionSchema),
        mode: 'onChange',
    });

    const handleWatch = watch('numberField');

    useEffect(() => {
        if (handleWatch) {
            setTotalCost(handleWatch * 0.0005)
        }
    }, [handleWatch, setValue]);
    const [country, setCountry] = useState(null)
    const [city, setCity] = useState(null)
    const [area, setArea] = useState(null)
    const [signupButtonState, setSignupButtonState] = useState(false)


    return (
        <div className='fixed inset-0 z-50 w-screen  overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setPostPromotion(false)
            }}></div>
            <div className='flex flex-col gap-4 z-10 py-4 w-96 bg-background border-2 border-accent rounded-lg h-fit overflow-auto'>
                <div className='flex items-center flex-col justify-center'>
                    <h2 className='w-full text-center text-xl font-medium'>Post Promotion</h2>
                    <svg width="240" height="120" viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="transparent" d="M0 0h900v600H0z" /><path d="m358.024 529.218 92.975-46.487V413m92.974 116.22-92.975-46.488" stroke="#E1E4E5" stroke-width="24" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M309.212 418.654h283.34c44.163 0 67.406-23.244 67.406-67.407V70H241.573v281.247c.233 44.163 23.477 67.407 67.639 67.407z" fill="#666AF6" stroke="#666AF6" stroke-width="24" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M218.563 70h464.871" stroke="#666AF6" stroke-width="24" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M356.546 364.608v-37.126m93.975 37.126v-75.412m93.975 75.412V250.91m0-111.379-8.443 9.902c-46.804 54.646-109.576 93.337-179.507 110.758" stroke="#fff" stroke-width="24" stroke-linecap="round" /><path d="M491.128 139.531h53.368V192.9" stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" /><path d="M748.757 317.135c-19.025 9.437-44.276-2.697-44.276-2.697s5.611-27.431 24.647-36.856c19.025-9.437 44.266 2.685 44.266 2.685s-5.612 27.43-24.637 36.868z" fill="url(#a)" /><path d="M149.661 328.773c17.774 10.653 43.274.805 43.274.805s-3.334-27.115-21.119-37.755c-17.774-10.653-43.263-.817-43.263-.817s3.334 27.115 21.108 37.767z" fill="url(#b)" /><circle r="12.955" transform="matrix(-1 0 0 1 603.939 484.381)" fill="#E1E4E5" /><circle r="18.713" transform="matrix(-1 0 0 1 190.869 455.333)" fill="#E1E4E5" /><circle r="14.242" transform="matrix(-1 0 0 1 723.565 419.537)" fill="#E1E4E5" /><circle r="15.834" transform="matrix(-1 0 0 1 725.156 124.121)" fill="#E1E4E5" /><circle r="14.219" transform="scale(1 -1) rotate(-75 -58.552 -184.085)" fill="#E1E4E5" /><circle r="5.918" transform="matrix(-1 0 0 1 196.636 124.646)" fill="#E1E4E5" /><ellipse rx="14.551" ry="11.641" transform="matrix(-1 0 0 1 295.764 485.386)" fill="#E1E4E5" /><defs><linearGradient id="a" x1="675.698" y1="346.573" x2="832.618" y2="222.449" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient><linearGradient id="b" x1="218.441" y1="363.063" x2="75.426" y2="230.183" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" /><stop offset="1" stop-color="#EEE" /></linearGradient></defs></svg>
                </div>
                <form onSubmit={handleSubmit(postPromotion)} className='flex flex-col items-center justify-center gap-3 w-full'>
                    <div className='flex flex-col gap-1 max-w-[280px]'>
                        <div className='flex flex-col'>
                            <label htmlFor="">Target Country</label>
                            <span className="text-xs">Select all to target all available countries in our database!</span>
                        </div>
                        <div className="flex gap-2 ">
                                        <SelectScrollable placeholder={"Select country"} selectData={
                                            [
                                                { name: "Pakistan", "phone_code": "92", cities: ["Karachi", "Islamabad"] },
                                                { name: "Australia", "phone_code": "92", cities: ["Karachi", "Islamabad"] },
                                                { name: "India", "phone_code": "92", cities: ["Karachi", "Islamabad"] }
                                            ]
                                        } setCity={setCity} setCountry={setCountry} />
                                    </div>

                    </div>
                    <div className='flex flex-col w-full max-w-[280px]'>

                        <label htmlFor="">Target City <span className='text-xs'>(optional)</span></label>
                        <SelectScrollable placeholder={"Select city"} selectData={[
                                        { name: "Karachi" }, { name: "Islamabad" }
                                    ]} setCity={setCity} setCountry={setCountry} areCities={true} countryName={country} />

                    </div>

                    <div className='flex flex-col w-full max-w-[280px]'>

                        <label htmlFor="">Target Area <span className='text-xs'>(optional)</span></label>
                        <SelectScrollable placeholder={"Select city"} selectData={[
                                        { name: "Gulshan-e-iqbal" }, { name: "Sadar" }
                                    ]} cityName={city} setCountry={setCountry} setArea={setArea} areAreas={true} countryName={country} />
                    </div>

                    <div className='flex flex-col gap-1 max-w-[280px]'>
                        <div className='flex flex-col'>
                            <label htmlFor="">Reach Target</label>
                            <span className="text-xs">Number of people you want your post to reach out!</span>
                        </div>
                    </div>

                    <div className='flex gap-2 w-full max-w-[280px] flex-col'>
                        <Input name="numberField" type="number" className="bg-card rounded-md w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Enter reach target" ref={reachTarget} min={2000} defaultValue={2000} max={10000} step={25} {...register("numberField")} />
                        <p className='text-red-400 text-sm'>
                            {errors.numberField && errors.numberField.message}
                        </p>
                    </div>
                    <div className='flex justify-between items-center w-full max-w-[280px]'>
                        <h3>Total Cost ${totalCost}</h3>
                        <Button type="submit" onClick={() => {
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

                                    "Proceed"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PostPromotionModel