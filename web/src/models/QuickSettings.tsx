import { updateCover, updateProfile, updateUser } from "@/app/features/user/userSlice"
import { useAppDispatch } from "@/app/hooks"
import ImageCropper from "@/components/ImageCropper"
import Cover from "@/components/profile/Cover"
import Profile from "@/components/profile/Profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserSchema } from "@/utils/schemas/auth"
import { yupResolver } from "@hookform/resolvers/yup"
import { Label } from "@radix-ui/react-dropdown-menu"
import { FC, FormEvent, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

const QuickSettings: FC<any> = ({ user, uploadSingle }) => {

    // profile stats
    let [profileLocalUrl, setProfileLocalUrl] = useState(undefined)
    let [profileForCrop, setProfileForCrop] = useState(undefined)
    let [profileUploadBlob, setProfileUploadBlob] = useState(undefined)

    // cover status
    let [coverLocalUrl, setCoverLocalUrl] = useState(undefined)
    let [coverForCrop, setCoverForCrop] = useState(undefined)
    let [coverUploadBlob, setCoverUploadBlob] = useState(undefined)

    // other states
    // let [aspectRatio, setAspectRatio] = useState(undefined)
    let [uploadImageState, setUploadImageState] = useState(false)
    let [cropperModel, setCropperModel] = useState(false)

    const { firstname, lastname, username, email, address, images, bio, phone } = user


    const dispatch = useAppDispatch()

    // references
    const usernameRef = useRef<HTMLInputElement>()
    const bioRef = useRef<HTMLTextAreaElement>()
    const firstnameRef = useRef<HTMLInputElement>()
    const lastnameRef = useRef<HTMLInputElement>()
    const emailRef = useRef<HTMLInputElement>()
    const phoneRef = useRef<HTMLInputElement>()
    const countryRef = useRef<HTMLInputElement>()
    const cityRef = useRef<HTMLInputElement>()
    const areaRef = useRef<HTMLInputElement>()
    const currentPasswordRef = useRef<HTMLInputElement>()
    const newPasswordRef = useRef<HTMLInputElement>()

    const coverInputRef = useRef<HTMLInputElement>(null)
    const profileInputRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(UserSchema),
        mode: 'onChange',
    });

    const handleWatch = watch('username');

    useEffect(() => {
        if (handleWatch) {
            const lowercaseHandle = handleWatch.toLowerCase().replace(/\s+/g, '');
            setValue('username', lowercaseHandle);
        }
    }, [handleWatch, setValue]);


    const onSubmit = async (data) => {
        console.log(data)

        dispatch(updateUser(data))
        uploadSingle(null, null, data)

        // let profile;
        // if (uploadImageState) {
        //     let profile = await uploadImage()
        // }

        // const updatedData = {
        //     username: usernameRef.current.value,
        //     firstname: firstnameRef.current.value,
        //     lastname: lastnameRef.current.value,
        //     email: emailRef.current.value,
        //     images: {
        //         cover: coverImage,
        //         profile: profileImage
        //     },
        //     address: {
        //         country: countryRef?.current.value,
        //         city: cityRef?.current.value,
        //     },
        //     phone: phoneRef?.current.value,
        //     currentPassword: currentPasswordRef?.current.value,
        //     newPassword: newPasswordRef?.current.value,
        // }
        // console.log(updatedData?.images)
        // mutation.mutate(updatedData)
    }


    // const updateUserDetails = async (data) => {
    //     let response = await axiosClient.post("/user/update", { updatedDetails: data })
    //     dispatch(loginSuccess(response.data))
    //     return response.data
    // }

    // const mutation = useMutation({
    //     mutationFn: async (data) => {
    //         return await updateUserDetails(data)
    //     }
    // })

    const navigate = useNavigate()

    return (
        <div className='absolute top-0 right-0 w-screen z-50 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 opacity-15  bg-black w-full h-full' onClick={() => {
                navigate(-1)
            }}></div>
            {
                profileForCrop && cropperModel &&
                <ImageCropper image={profileForCrop} aspect={4 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    setProfileLocalUrl(imageUrl)
                    dispatch(updateProfile(imageUrl))
                    uploadSingle(croppedImage, 'profile')
                    setProfileForCrop(undefined)
                    if (profileInputRef.current.value) {
                        profileInputRef.current.value = null
                    }
                }} />
            }
            {
                coverForCrop && cropperModel &&
                <ImageCropper image={coverForCrop} aspect={9 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    setCoverLocalUrl(imageUrl)
                    dispatch(updateCover(imageUrl))
                    setCoverUploadBlob(croppedImage)
                    uploadSingle(croppedImage, 'cover')
                    setCoverForCrop(undefined)
                    if (coverInputRef.current.value) {
                        coverInputRef.current.value = null
                    }
                }} />

            }
            <div className='z-10 max-w-[720px] w-full bg-background rounded-lg h-full overflow-auto'>

                <div className="grid gap-8 p-1  overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        <div className='relative w-full max-h-64 roundd-md  overflow-hidden'>
                            <form className='image-upload_form'>
                                <label htmlFor="image">
                                    <Cover cover={user?.images?.cover || coverLocalUrl} upload={true} />
                                </label>
                                <input className="hidden" ref={coverInputRef} type="file" accept='image/*' id='image' onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.addEventListener('load', () => {
                                            setCoverForCrop(reader.result as string);
                                        });
                                        reader.readAsDataURL(file);
                                    }
                                    setCropperModel(true)
                                }} />
                            </form>
                        </div>
                        <div className='absolute -bottom-16 overflow-hidden'>

                            <form onSubmit={(e: FormEvent) => e.preventDefault()} className='image-upload_form'>

                                <label htmlFor="profile-image">
                                    <Profile image={images?.profile || profileLocalUrl} fallbackName={user && firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()} width={'w-28'} smWidth={'w-32'} height={'h-28'} smHeight={'h-32'} upload={true} />
                                </label>

                                <input className="hidden" ref={profileInputRef} type="file" accept='image/*' id='profile-image'
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const file = e.target.files[0];
                                            const reader = new FileReader();
                                            reader.addEventListener('load', () => {
                                                setProfileForCrop(reader.result as string);
                                            });
                                            reader.readAsDataURL(file);
                                        }
                                        setProfileUploadBlob(undefined)
                                        setCropperModel(true)
                                    }} />
                            </form>

                        </div>
                    </div>
                    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
                        <div className="w-full p-4 flex flex-col gap-8 items-center">
                            <div className="flex flex-col w-full justify-center gap-2 mt-10">
                                <h2>Account Details</h2>
                                <div className="w-full flex gap-4">
                                    <div className="w-full">
                                        <Label >
                                            Firstname
                                        </Label>
                                        <Input
                                            name="firstname"
                                            placeholder="Enter your firstname"
                                            ref={firstnameRef}
                                            id="firstname"
                                            defaultValue={firstname}
                                            className="max-w-96 w-full"
                                            {...register("firstname")}
                                        />
                                        {errors.firstname && <p>{errors.firstname.message}</p>}
                                    </div>
                                    <div className="w-full">
                                        <Label >
                                            Lastname
                                        </Label>
                                        <Input
                                            name="lastname"
                                            placeholder="Enter your lastname"
                                            ref={lastnameRef}
                                            id="lastname"
                                            defaultValue={lastname}
                                            className="max-w-96 w-full"
                                            {...register("lastname")}
                                        />
                                        {errors.lastname && <p>{errors.lastname.message}</p>}
                                    </div>

                                </div>


                                <div className="w-full">
                                    <div className="w-full">
                                        <Label >
                                            Bio
                                        </Label>
                                        <Textarea
                                            name="bio"
                                            placeholder="Enter your bio"
                                            ref={bioRef}
                                            id="bio"
                                            defaultValue={bio}
                                            className="w-full"
                                            {...register("bio")}
                                        />
                                        {errors.bio && <p>{errors.bio.message}</p>}
                                    </div>
                                </div>
                                <div className="w-full">
                                    <div className="w-full">
                                        <Label >
                                            Username
                                        </Label>
                                        <Input
                                            name="username"
                                            placeholder="Enter your username"
                                            ref={usernameRef}
                                            id="username"
                                            defaultValue={username}
                                            className="max-w-96 w-full"
                                            {...register("username")}
                                        />
                                        {errors.username && <p>{errors.username.message}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col w-full">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-full">
                                            <Label >
                                                Country
                                            </Label>
                                            <Input
                                                name="country"
                                                placeholder="Enter your country name"
                                                ref={countryRef}
                                                id="country"
                                                defaultValue={address?.country}
                                                className="max-w-96 w-full"
                                                {...register("address.country")}
                                            />
                                            {errors.address?.country && <p>{errors.address.country.message}</p>}
                                        </div>
                                        <div className="w-full">
                                            <Label >
                                                City
                                            </Label>
                                            <Input
                                                name="city"
                                                placeholder="Enter your city name"
                                                ref={cityRef}
                                                id="city"
                                                defaultValue={address?.city}
                                                className="max-w-96 w-full"
                                                {...register("address.city")}
                                            />
                                            {errors.address?.city && <p>{errors.address.city.message}</p>}
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <div className="w-full">
                                            <Label >
                                                Area
                                            </Label>
                                            <Input
                                                name="area"
                                                placeholder="Enter your area name"
                                                ref={areaRef}
                                                id="area"
                                                defaultValue={address?.area}
                                                className="max-w-96 w-full"
                                                {...register("address.area")}
                                            />
                                            {errors.address?.area && <p>{errors.address.area.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full">
                                    <div className="w-full">
                                        <Label >
                                            Email
                                        </Label>
                                        <Input
                                            name="email"
                                            ref={emailRef}
                                            placeholder="Enter your email"
                                            id="email"
                                            defaultValue={email}
                                            className="max-w-96 w-full"
                                            {...register("email")}
                                        />
                                        {errors.email && <p>{errors.email.message}</p>}
                                    </div>
                                    <div className="w-full">
                                        <Label >
                                            Phone
                                        </Label>
                                        <Input
                                            name="phone"
                                            ref={phoneRef}
                                            placeholder="Enter your phone number"
                                            id="phone"
                                            defaultValue={phone}
                                            className="max-w-96 w-full"
                                            {...register("phone")}
                                        />
                                        {errors.phone && <p>{errors.phone.message}</p>}
                                    </div>

                                </div>

                            </div>
                            <div className="w-full flex flex-col gap-2">
                                <h2>Privacy</h2>
                                <div className="flex w-full flex-col md:flex-row justify-start items-start gap-4">
                                    <div className="w-full">
                                        <Label>
                                            Current Password
                                        </Label>
                                        <Input
                                            placeholder="Enter your current password"
                                            ref={currentPasswordRef}
                                            id="current-password"
                                            type="password"
                                            className="max-w-96 w-full"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <Label >
                                            New Password
                                        </Label>
                                        <Input
                                            placeholder="Enter new secure password"
                                            ref={newPasswordRef}
                                            id="new-password"
                                            type="password"
                                            className="max-w-96 w-full"
                                        />
                                    </div>

                                </div>
                                <Button type="submit">Save changes</Button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}

export default QuickSettings