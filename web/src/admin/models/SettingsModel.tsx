import { updateProfile } from "@/app/features/admin/adminSlice"
import { useAppDispatch } from "@/app/hooks"
import ImageCropper from "@/components/ImageCropper"
import Cover from "@/components/profile/Cover"
import Profile from "@/components/profile/Profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { yupResolver } from "@hookform/resolvers/yup"
import { Label } from "@radix-ui/react-dropdown-menu"
import { FC, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { AdminSchema } from "../types/admin"
import { useMutation } from "@tanstack/react-query"
import { axiosClient } from "@/api/Admin/axiosClient"

export const SettingsModel: FC<any> = ({ admin, updateAdmin, setModelTrigger }) => {

    // profile stats
    let [profileLocalUrl, setProfileLocalUrl] = useState(undefined)
    let [profileForCrop, setProfileForCrop] = useState(undefined)

    // other states
    // let [aspectRatio, setAspectRatio] = useState(undefined)
    let [cropperModel, setCropperModel] = useState(false)

    const { firstname, lastname, username, email, profile } = admin


    const dispatch = useAppDispatch()

    // references
    const usernameRef = useRef<HTMLInputElement>()
    const firstnameRef = useRef<HTMLInputElement>()
    const lastnameRef = useRef<HTMLInputElement>()
    const emailRef = useRef<HTMLInputElement>()
    const currentPasswordRef = useRef<HTMLInputElement>()
    const newPasswordRef = useRef<HTMLInputElement>()
    const profileInputRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(AdminSchema),
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
        updateAdmin(data)
    }


    const updateUserDetails = async (data) => {
        let response = await axiosClient.post("/admin/update", { updatedDetails: data })
        return response.data
    }

    const mutation = useMutation({
        mutationFn: async (data) => {
            return await updateUserDetails(data)
        }
    })

    const navigate = useNavigate()

    return (
        <div className='absolute top-0 right-0 w-screen z-50 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 opacity-15  bg-black w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>
            {
                profileForCrop && cropperModel &&
                <ImageCropper image={profileForCrop} aspect={4 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    setProfileLocalUrl(imageUrl)
                    dispatch(updateProfile(imageUrl))
                    updateAdmin(null, croppedImage, 'profile')
                    setProfileForCrop(undefined)
                    if (profileInputRef.current.value) {
                        profileInputRef.current.value = null
                    }
                }} />
            }
            <div className='z-10 max-w-[720px] w-full bg-background rounded-lg h-full overflow-auto'>

                <div className="grid gap-8 p-1  overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        <div className='relative w-full max-h-64 roundd-md  overflow-hidden'>
                            <form className='image-upload_form'>
                                <Cover cover={null} />
                            </form>
                        </div>
                        <div className='absolute -bottom-16 overflow-hidden'>

                            <form className='image-upload_form'>

                                <label htmlFor="profile-image">
                                    <Profile image={profile || profileLocalUrl} fallbackName={admin && firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()} width={'w-28'} smWidth={'w-32'} height={'h-28'} smHeight={'h-32'} upload={true} />
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
                                </div>
                                <div className="w-full">
                                    <div className="w-full">
                                        <Label >
                                            username
                                        </Label>
                                        <Input
                                            name="adminname"
                                            placeholder="Enter your adminname"
                                            ref={usernameRef}
                                            id="adminname"
                                            defaultValue={username}
                                            className="max-w-96 w-full"
                                            {...register("username")}
                                        />
                                        {errors.username && <p>{errors.username.message}</p>}
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
