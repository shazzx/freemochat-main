import { updateCover, updateProfile, updateUser } from "@/app/features/user/userSlice"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import ImageCropper from "@/components/ImageCropper"
import Cover from "@/components/profile/Cover"
import Profile from "@/components/profile/Profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UpdateUserSchema, UserSchema } from "@/utils/schemas/auth"
import { yupResolver } from "@hookform/resolvers/yup"
import { Label } from "@radix-ui/react-dropdown-menu"
import { FC, FormEvent, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import ChangeCountryModel from "./ChangeCountryModel"
import { CalendarIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react"
import ChangePhoneModel from "./ChangePhoneModel"
import ChangeEmailModel from "./ChangeEmailModel"
import ChangePasswordModel from "./ChangePasswordModel"
import ForgetPasswordModel from "./ForgetPasswordModel"
import { MdClose } from "react-icons/md"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import EducationForm from "./EducationForm"
import WorkExperienceForm from "./WorkExperienceForm"
import { toast } from "react-toastify"

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
    let [uploadImageState, setUploadImageState] = useState(false)
    let [cropperModel, setCropperModel] = useState(false)

    // Modal states
    const [changeCountryModel, setChangeCountryModel] = useState(false)
    const [changePhoneModel, setChangePhoneModel] = useState(false)
    const [changeEmailModel, setChangeEmailModel] = useState(false)
    const [changePasswordModel, setChangePasswordModel] = useState(false)
    const [forgetPasswordModel, setForgetPasswordModel] = useState(false)

    // Form states
    const [educationFormOpen, setEducationFormOpen] = useState(false)
    const [workExperienceFormOpen, setWorkExperienceFormOpen] = useState(false)

    // Edit states
    const [currentEditingEducation, setCurrentEditingEducation] = useState(null)
    const [currentEditingWorkExperience, setCurrentEditingWorkExperience] = useState(null)

    const { firstname, lastname, username, email, address, profile, cover, bio, phone, website,
        dateOfBirth, maritalStatus, socialMedia, education, workExperience } = user

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
    const websiteRef = useRef<HTMLInputElement>()

    const coverInputRef = useRef<HTMLInputElement>(null)
    const profileInputRef = useRef<HTMLInputElement>(null)

    // Date state
    const [date, setDate] = useState<Date | undefined>(dateOfBirth ? new Date(dateOfBirth) : undefined)

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(UpdateUserSchema),
        mode: 'onChange',
    });

    const handleWatch = watch('username');

    useEffect(() => {
        if (handleWatch) {
            const lowercaseHandle = handleWatch.toLowerCase().replace(/\s+/g, '');
            setValue('username', lowercaseHandle);
        }
    }, [handleWatch, setValue]);

    // Handle editing education
    const editEducation = (index) => {
        setCurrentEditingEducation({
            data: user.education[index],
            index
        });
        setEducationFormOpen(true);
    };

    // Handle editing work experience
    const editWorkExperience = (index) => {
        setCurrentEditingWorkExperience({
            data: user.workExperience[index],
            index
        });
        setWorkExperienceFormOpen(true);
    };

    // Handle education save (add or update)
    const handleEducationSave = async (educationData, isEdit) => {
        try {
            let updatedEducation;

            if (isEdit && currentEditingEducation) {
                // Update existing item at index
                updatedEducation = [...(user.education || [])];
                updatedEducation[currentEditingEducation.index] = educationData;

                toast.success("Education updated successfully");
            } else {
                // Add new item
                updatedEducation = [...(user.education || []), educationData];

                toast.success("Education added successfully");
            }

            dispatch(updateUser({ ...user, education: updatedEducation }));
            const isUpdated = await uploadSingle(null, null, { education: updatedEducation }, true);

            // Reset the current editing state
            setCurrentEditingEducation(null);

            return isUpdated;
        } catch (error) {
            console.error("Failed to save education", error);
            toast.error("Failed to save education");
            return false;
        }
    };

    // Handle work experience save (add or update)
    const handleWorkExperienceSave = async (workData, isEdit) => {
        try {
            let updatedWorkExperience;

            if (isEdit && currentEditingWorkExperience) {
                // Update existing item at index
                updatedWorkExperience = [...(user.workExperience || [])];
                updatedWorkExperience[currentEditingWorkExperience.index] = workData;

                toast.success("Work experience updated successfully");
            } else {
                // Add new item
                updatedWorkExperience = [...(user.workExperience || []), workData];

                toast.success("Work experience added successfully");
            }

            dispatch(updateUser({ ...user, workExperience: updatedWorkExperience }));
            const isUpdated = await uploadSingle(null, null, { workExperience: updatedWorkExperience }, true);

            // Reset the current editing state
            setCurrentEditingWorkExperience(null);

            return isUpdated;
        } catch (error) {
            console.error("Failed to save work experience", error);
            toast.error("Failed to save work experience");
            return false;
        }
    };

    // Remove education item
    const removeEducation = async (index) => {
        try {
            const updatedEducation = [...(user.education || [])];
            updatedEducation.splice(index, 1);

            dispatch(updateUser({ ...user, education: updatedEducation }));
            const isUpdated = await uploadSingle(null, null, { education: updatedEducation }, true);
            if (isUpdated) {
                toast.success("Education removed")
            }
        } catch (error) {
            console.error("Failed to remove education", error);
        }
    };

    // Remove work experience item
    const removeWorkExperience = async (index) => {
        try {
            const updatedWorkExperience = [...(user.workExperience || [])];
            updatedWorkExperience.splice(index, 1);

            dispatch(updateUser({ ...user, workExperience: updatedWorkExperience }));
            const isUpdated = await uploadSingle(null, null, { workExperience: updatedWorkExperience }, true);
            if (isUpdated) {
                toast.success("Work experience removed")
            }
        } catch (error) {
            console.error("Failed to remove work experience", error);
        }
    };

    const onSubmit = async (data) => {
        console.log(data)

        // Add date of birth if set
        if (date) {
            data.dateOfBirth = date.toISOString();
        }

        dispatch(updateUser(data))
        uploadSingle(null, null, data)
    }

    const handleCloseEducationForm = () => {
        setEducationFormOpen(false);
        setCurrentEditingEducation(null);
    };

    const handleCloseWorkExperienceForm = () => {
        setWorkExperienceFormOpen(false);
        setCurrentEditingWorkExperience(null);
    };

    const navigate = useNavigate()

    return (
        <div className='absolute top-0 right-0 w-screen z-50 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 opacity-15  bg-black w-full h-full' onClick={() => {
                navigate('', { replace: true })
            }}></div>
            {
                changeCountryModel &&
                <ChangeCountryModel setModelTrigger={setChangeCountryModel} />
            }
            {
                changePhoneModel &&
                <ChangePhoneModel setModelTrigger={setChangePhoneModel} />
            }
            {
                changeEmailModel &&
                <ChangeEmailModel setModalTrigger={setChangeEmailModel} />
            }
            {
                changePasswordModel &&
                <ChangePasswordModel setModelTrigger={setChangePasswordModel} setForgetPasswordModel={setForgetPasswordModel} />
            }
            {
                forgetPasswordModel &&
                <ForgetPasswordModel setModelTrigger={setForgetPasswordModel} />
            }
            {
                educationFormOpen &&
                <EducationForm
                    setOpen={handleCloseEducationForm}
                    onSave={async (educationData, isEdit) => {
                        return await handleEducationSave(educationData, isEdit);
                    }}
                    existingData={currentEditingEducation ? currentEditingEducation.data : null}
                />
            }
            {
                workExperienceFormOpen &&
                <WorkExperienceForm
                    setOpen={handleCloseWorkExperienceForm}
                    onSave={async (workData, isEdit) => {
                        return await handleWorkExperienceSave(workData, isEdit);
                    }}
                    existingData={currentEditingWorkExperience ? currentEditingWorkExperience.data : null}
                />
            }
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
            <div className='z-10 max-w-[720px] relative w-full bg-background rounded-lg h-full overflow-auto'>
                <MdClose cursor="pointer" size={24} className='ml-auto absolute top-2 right-2 z-10' onClick={() => {
                    navigate('', { replace: true })
                }} />
                <div className="grid gap-8 p-1 overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        <div className='relative w-full max-h-64 roundd-md  overflow-hidden'>
                            <form className='image-upload_form'>
                                <label htmlFor="image">
                                    <Cover cover={cover || coverLocalUrl} upload={true} />
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
                                    <Profile image={profile || profileLocalUrl} fallbackName={user && firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()} width={'w-28'} smWidth={'w-32'} height={'h-28'} smHeight={'h-32'} upload={true} />
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

                                {/* Website Field */}
                                <div className="w-full">
                                    <div className="w-full">
                                        <Label>
                                            Website
                                        </Label>
                                        <Input
                                            name="website"
                                            placeholder="Enter your website"
                                            ref={websiteRef}
                                            id="website"
                                            defaultValue={website}
                                            className="max-w-96 w-full"
                                            {...register("website")}
                                        />
                                        {errors.website && <p>{errors.website.message}</p>}
                                    </div>
                                </div>

                                {/* Date of Birth Field */}
                                <div className="w-full">
                                    <Label>Date of Birth</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal max-w-96"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Marital Status */}
                                <div className="w-full">
                                    <Label>Marital Status</Label>
                                    <Select defaultValue={maritalStatus || "single"} onValueChange={(value: any) => setValue("maritalStatus", value)}>
                                        <SelectTrigger className="max-w-96 w-full">
                                            <SelectValue placeholder="Select marital status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single</SelectItem>
                                            <SelectItem value="married">Married</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Social Media Section */}
                                <div className="w-full mt-4">
                                    <h3 className="text-lg font-medium mb-2">Social Media</h3>

                                    <div className="w-full mb-2">
                                        <Label>Facebook</Label>
                                        <Input
                                            name="socialMedia.facebook"
                                            placeholder="Facebook profile URL"
                                            defaultValue={socialMedia?.facebook}
                                            className="max-w-96 w-full"
                                            {...register("socialMedia.facebook")}
                                        />
                                        {errors.socialMedia?.facebook && <p>{errors.socialMedia.facebook.message}</p>}

                                    </div>

                                    <div className="w-full mb-2">
                                        <Label>Instagram</Label>
                                        <Input
                                            name="socialMedia.instagram"
                                            placeholder="Instagram profile URL"
                                            defaultValue={socialMedia?.instagram}
                                            className="max-w-96 w-full"
                                            {...register("socialMedia.instagram")}
                                        />
                                        {errors.socialMedia?.instagram && <p>{errors.socialMedia.instagram.message}</p>}

                                    </div>

                                    <div className="w-full mb-2">
                                        <Label>LinkedIn</Label>
                                        <Input
                                            name="socialMedia.linkedin"
                                            placeholder="LinkedIn profile URL"
                                            defaultValue={socialMedia?.linkedin}
                                            className="max-w-96 w-full"
                                            {...register("socialMedia.linkedin")}
                                        />
                                        {errors.socialMedia?.linkedin && <p>{errors.socialMedia.linkedin.message}</p>}

                                    </div>

                                    <div className="w-full mb-2">
                                        <Label>WhatsApp</Label>
                                        <Input
                                            name="socialMedia.whatsapp"
                                            placeholder="WhatsApp number"
                                            defaultValue={socialMedia?.whatsapp}
                                            className="max-w-96 w-full"
                                            {...register("socialMedia.whatsapp")}
                                        />
                                        {errors.socialMedia?.whatsapp && <p>{errors.socialMedia.whatsapp.message}</p>}

                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <span className="my-2">Address</span >
                                    <PencilIcon size="16" className="cursor-pointer" onClick={() => {
                                        setChangeCountryModel(true)
                                    }} />
                                </div>

                                <div className="flex flex-col w-full">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-full">
                                            <Label >
                                                Country
                                            </Label>
                                            <Input
                                                disabled
                                                name="country"
                                                placeholder="Enter your country name"
                                                id="country"
                                                defaultValue={address?.country}
                                                className="max-w-96 w-full"
                                            />
                                        </div>
                                        <div className="w-full">
                                            <Label >
                                                City
                                            </Label>
                                            <Input
                                                disabled
                                                name="city"
                                                placeholder="Enter your city name"
                                                id="city"
                                                defaultValue={address?.city}
                                                className="max-w-96 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <div className="w-full">
                                            <Label >
                                                Area
                                            </Label>
                                            <Input
                                                disabled
                                                name="area"
                                                placeholder="Enter your area name"
                                                id="area"
                                                defaultValue={address?.area}
                                                className="max-w-96 w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full">
                                    <div className="w-full">
                                        <div className="flex gap-2 items-center">
                                            <Label className="mb-1">
                                                Email
                                            </Label>
                                            <PencilIcon size="16" className="cursor-pointer" onClick={() => {
                                                setChangeEmailModel(true)
                                            }} />
                                        </div>

                                        <Input
                                            disabled
                                            name="email"
                                            placeholder="Enter your email"
                                            id="email"
                                            defaultValue={email}
                                            className="max-w-96 w-full"
                                            {...register("email")}
                                        />
                                        {errors.email && <p>{errors.email.message}</p>}
                                    </div>
                                    <div className="w-full">
                                        <div className="flex gap-2 items-center">
                                            <Label className="mb-1">
                                                Phone
                                            </Label>
                                            <PencilIcon size="16" className="cursor-pointer" onClick={() => {
                                                setChangePhoneModel(true)
                                            }} />
                                        </div>
                                        <Input
                                            disabled
                                            name="phone"
                                            placeholder="Enter your phone number"
                                            id="phone"
                                            defaultValue={phone}
                                            className="max-w-96 w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Education Section */}
                            <div className="w-full flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <h2>Education</h2>
                                    <PlusIcon size={18} className="cursor-pointer" onClick={() => {
                                        setCurrentEditingEducation(null);
                                        setEducationFormOpen(true);
                                    }} />
                                </div>
                                <div className="space-y-3">
                                    {education && education.length > 0 ? (
                                        education.map((edu, index) => (
                                            <Card key={index} className="p-2">
                                                <CardContent className="flex justify-between items-center p-2">
                                                    <div>
                                                        <h4 className="font-medium">{edu.institution}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {edu.degree} in {edu.fieldOfStudy} ({edu.startYear} - {edu.endYear || 'Present'})
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <PencilIcon
                                                            size={18}
                                                            className="cursor-pointer text-blue-500"
                                                            onClick={() => editEducation(index)}
                                                        />
                                                        <TrashIcon
                                                            size={18}
                                                            className="cursor-pointer text-red-500"
                                                            onClick={() => removeEducation(index)}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-3">No education history added</p>
                                    )}
                                </div>
                            </div>

                            {/* Work Experience Section */}
                            <div className="w-full flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <h2>Work Experience</h2>
                                    <PlusIcon size={18} className="cursor-pointer" onClick={() => {
                                        setCurrentEditingWorkExperience(null);
                                        setWorkExperienceFormOpen(true);
                                    }} />
                                </div>
                                <div className="space-y-3">
                                    {workExperience && workExperience.length > 0 ? (
                                        workExperience.map((work, index) => (
                                            <Card key={index} className="p-2">
                                                <CardContent className="flex justify-between items-center p-2">
                                                    <div>
                                                        <h4 className="font-medium">{work.jobTitle} at {work.company}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {work.totalYears} years • {work.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <PencilIcon
                                                            size={18}
                                                            className="cursor-pointer text-blue-500"
                                                            onClick={() => editWorkExperience(index)}
                                                        />
                                                        <TrashIcon
                                                            size={18}
                                                            className="cursor-pointer text-red-500"
                                                            onClick={() => removeWorkExperience(index)}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-3">No work experience added</p>
                                    )}
                                </div>
                            </div>

                            <div className="w-full flex flex-col gap-2">
                                <h2>Privacy</h2>
                                <div className="flex w-full flex-col md:flex-row justify-start items-start gap-4">
                                    <Button type="button" onClick={() => {
                                        setChangePasswordModel(true)
                                    }}>Change Password</Button>
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