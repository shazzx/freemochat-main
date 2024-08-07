import ImageCropper from "@/components/ImageCropper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageCreateSchema } from "@/utils/schemas/auth"
import { yupResolver } from "@hookform/resolvers/yup"
import { Label } from "@radix-ui/react-dropdown-menu"
import { Camera } from "lucide-react"
import { FC, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

const createPageModel: FC<any> = ({ setModelTrigger, createPage, editPage, editState, pageDetails }) => {

    let [imageSrc, setImageSrc] = useState(null)
    let [coverImage, SetCoverImage] = useState(null)
    let [imageUpload, setImageUpload] = useState(null)
    let [coverImageUpload, setCoverImageUpload] = useState(null)
    let [cropperModel, setCropperModel] = useState(false)
    const [isCheckingHandle, setIsCheckingHandle] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(PageCreateSchema),
        mode: 'onChange',
    });

    const handleWatch = watch('handle');

    useEffect(() => {
        if (handleWatch) {
            const lowercaseHandle = handleWatch.toLowerCase().replace(/\s+/g, '');
            setValue('handle', lowercaseHandle);
        }
    }, [handleWatch, setValue]);



    const pageName = useRef<HTMLInputElement>()
    const pageHandle = useRef<HTMLInputElement>()
    const pageAbout = useRef<HTMLTextAreaElement>()
    const onSubmit = async (pageDetails) => {
        console.log(pageDetails)

        if (editState) {
            editPage({ pageDetails, imageUpload, coverImageUpload })
            return
        }

        await createPage(pageDetails, imageUpload, coverImageUpload)
    }

    return (
        <div className='absolute top-0 right-0 w-screen z-10 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>
            {
                imageUpload && cropperModel &&
                <ImageCropper image={imageUpload} aspect={4 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    setImageSrc(imageUrl)
                    setImageUpload(croppedImage)
                }} />
            }
            {
                coverImageUpload && cropperModel &&
                <ImageCropper image={coverImageUpload} aspect={9 / 4} setCropperModel={setCropperModel} _onCropComplete={(croppedImage) => {
                    let imageUrl = URL.createObjectURL(croppedImage)
                    SetCoverImage(imageUrl)
                    setCoverImageUpload(croppedImage)
                }} />

            }
            <div className='z-10 w-fit bg-background rounded-lg h-full  border-2 border-accent shadow-md overflow-auto'>
                <div className="grid gap-8 p-1  overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        {/* cover image */}
                        <div className='relative max-w-[460px] max-h-72 roundd-md  overflow-hidden'>
                            <div >
                                <label htmlFor="image-cover" className="cursor-pointer">
                                    <div className="flex items-center justify-center w-[440px] h-56 bg-muted">
                                        {coverImage ?
                                            <img className='w-full' onClick={() => {
                                            }} src={coverImage} alt="" />
                                            :
                                            editState && pageDetails?.images?.cover ? <img className='w-full' onClick={() => {
                                            }} src={pageDetails?.images?.cover} alt="" />

                                                :
                                                <Camera size={42} />

                                        }
                                    </div>

                                </label>

                                <input className="hidden" type="file" accept='image/*' id='image-cover' onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.addEventListener('load', () => {
                                            setCoverImageUpload(reader.result as string);
                                        });
                                        reader.readAsDataURL(file);
                                        setCropperModel(true)

                                    }
                                }} />
                            </div>

                        </div>
                        {/* profile image */}
                        <div className='w-28 h-28 rounded-xl absolute -bottom-16 border-primary border-2 overflow-hidden'>
                            <div >
                                <label htmlFor="image-profile" className="cursor-pointer">
                                    <div className="flex items-center justify-center w-28 h-28 bg-muted">
                                        {imageSrc ?
                                            <img className='w-full' onClick={() => {
                                            }} src={imageSrc} alt="" />
                                            :
                                            editState && pageDetails?.images?.profile ? <img className='w-full' onClick={() => {
                                            }} src={pageDetails?.images?.profile} alt="" />

                                                :
                                                <Camera size={42} />
                                        }
                                    </div>

                                </label>
                                <input className="hidden" type="file" accept='image/*' id='image-profile' onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.addEventListener('load', () => {
                                            setImageUpload(reader.result as string);
                                        });
                                        reader.readAsDataURL(file);
                                    }
                                    setCropperModel(true)
                                }} />
                            </div>

                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="w-full p-4 flex flex-col gap-8 items-center">
                            <div className="flex flex-col w-full justify-center gap-2 mt-10">
                                <div>
                                    <Label >
                                        Name
                                    </Label>
                                    <Input
                                        name="name"
                                        ref={pageName}
                                        defaultValue={pageDetails?.name}
                                        id="name"
                                        className="w-96"
                                        placeholder="Page Name"
                                        {...register('name')}
                                    />
                                    {errors.name && <p>{errors.name.message}</p>}
                                </div>

                                <div>
                                    <Label >
                                        Page Handle
                                    </Label>
                                    <Input
                                        name="handle"
                                        ref={pageHandle}
                                        defaultValue={pageDetails?.handle}
                                        id="handle"
                                        className="w-96"
                                        placeholder="@page_handle"
                                        {...register('handle')}
                                    />
                                    {errors.handle && <p>{errors.handle.message}</p>}
                                </div>

                                <div>
                                    <Label >
                                        About
                                    </Label>
                                    <Textarea
                                        ref={pageAbout}
                                        defaultValue={pageDetails?.about}
                                        id="about"
                                        className="w-96"
                                        placeholder="your page about"
                                        maxLength={150}
                                        {...register('about')}
                                    />
                                    {errors.about && <p>{errors.about.message}</p>}
                                </div>
                            </div>
                            <div className="w-full flex justify-end ">
                                <Button type="submit">{editState ? "Update" : "Create"}</Button>

                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}

export default createPageModel