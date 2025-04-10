import { Sheet } from 'react-modal-sheet';
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { MdCancel } from 'react-icons/md';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import PostCarousel from '@/components/Carousel';
import { Combobox } from '@/components/Comboxbox';
import { Textarea } from '@/components/ui/textarea';


function BottomCreatePost({ setModelTrigger, createPost, editPost, postDetails, updatePost }: any) {
    const [selectedMedia, setSelectedMedia] = useState([])
    const [emojiPickerState, setEmojiPickerState] = useState(false)
    const [selected, setSelected] = useState("public")
    const [media, setMedia] = useState([])
    // const [removeMedia, setRemoveMedia] = useState([])
    const [postMedia, setPostMedia] = useState<{ remove: string, url: string, file: string, filename: string }[]>((postDetails && postDetails?.media) ? [...postDetails?.media] : [])
    const [uploading, setUploading] = useState(false)
    const [searchParams] = useSearchParams()
    const isOpen = searchParams.get("createpost") == 'true' ? true : false

    const content = useRef<HTMLTextAreaElement>()

    useEffect(() => {
        if (postMedia?.length > 0) {
            console.log(postMedia)
            setPostMedia([...selectedMedia, ...postMedia])
            // setRemoveMedia(postMedia.map((media) => {
            //     if (media?.remove) {
            //         return 
            //     }
            // }))
            // console.log(removeMedia)
        } else {
            setPostMedia(selectedMedia)
            console.log(selectedMedia)
        }

    }, [selectedMedia])

    useEffect(() => {
        console.log(postMedia)
    }, [])

    const getSelected = (selectionState) => {
        setSelected(selectionState)
        console.log(selectionState)
    }
    const navigate = useNavigate()

    return (
        <>
            <Sheet
                isOpen={isOpen}
                onClose={() => {
                    setModelTrigger(false)
                    if (location.pathname == '/') {
                        navigate('/', { replace: true })
                        return
                    }

                    navigate('', { replace: true })

                }}
                snapPoints={[700, 400, 0]}
            >

                <Sheet.Container>
                    <Sheet.Header className='bg-background-secondary dark:bg-background' />
                    <Sheet.Content >
                        <div className='z-10 max-w-xl w-full h-full flex flex-col bg-background relative sm:h-fit max-h-full scroll-smooth overflow-auto'>
                            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                                setModelTrigger(false)
                                if (location.pathname == '/') {
                                    navigate('/', { replace: true })
                                    return
                                }

                                navigate('', { replace: true })

                            }}></div>
                            <div className='relative z-20 h-full sm:max-h-[700px] bg-background rounded-lg w-full sm:w-[440px] overflow-auto sm:border-2 sm:border-accent'>
                                {uploading &&
                                    <div className="z-10 absolute w-full h-full flex items-center justify-center">
                                        <div className="absolute w-full h-full bg-card opacity-70">

                                        </div>
                                        <div className="z-10 flex gap-2">
                                            <Loader />
                                            <span >Uploading...</span>
                                        </div>

                                    </div>
                                }
                                <div className="p-3 h-full z-10 overflow-y-auto relative bg-background-secondary sm:border sm:border-accent">
                                    <form className="flex flex-col h-full gap-10" onSubmit={async (e) => {
                                        e.preventDefault()

                                        const formData = new FormData()

                                        if (selectedMedia?.length > 0) {
                                            for (let i = 0; i <= selectedMedia.length - 1; i++) {
                                                formData.append('files', selectedMedia[i].file)
                                            }
                                        }
                                        if ((content.current.value.length > 1 || selectedMedia.length > 0) && !editPost) {
                                            createPost({ visibility: selected, content: content.current.value, formData, selectedMedia })
                                            setUploading(true)
                                            navigate('', { replace: true })
                                            return
                                        }

                                        if (content.current.value.length > 1 || selectedMedia.length > 0 && editPost) {
                                            updatePost({ content: content.current.value, formData, selectedMedia, media: postMedia,
                                                 setModelTrigger })
                                            setUploading(true)
                                            navigate('', { replace: true })
                                            return
                                        }

                                        toast.info("Please write something")
                                    }}>
                                        <div>
                                            <h3 className="text-center text-lg sm:text-xl" >{editPost ? "Update Post" : "Create Post"}</h3>
                                        </div>
                                        <div className={`w-full ${selectedMedia?.length > 0 || postDetails?.media?.length ? 'h-[240px]' : 'h-[360px]'} flex flex-col items-center`}>
                                            <Textarea name="create post" className="border-accent border w-full bg-card h-full p-2" defaultValue={editPost && postDetails?.content} placeholder="write something" id="" ref={content}>
                                            </Textarea>
                                        </div>
                                        <div>
                                            <div className="w-full flex flex-col items-end justify-center gap-1 ">
                                                <div className="flex items-center justify-center ">
                                                    <label htmlFor="post-image">
                                                        <svg width="40" height="40" className="stroke-foreground cursor-pointer" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8137 7.08301H13.1864C11.5588 7.092 10.0014 7.74722 8.85682 8.90451C7.71228 10.0618 7.07437 11.6264 7.08341 13.254V20.7453C7.08342 20.9853 7.09714 21.2252 7.12449 21.4636C7.4676 24.5567 10.0744 26.9015 13.1864 26.9163H20.8137C22.4414 26.9073 23.9988 26.2521 25.1433 25.0948C26.2879 23.9376 26.9258 22.373 26.9167 20.7453V13.254C26.9258 11.6264 26.2879 10.0618 25.1433 8.90451C23.9988 7.74722 22.4414 7.092 20.8137 7.08301Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.8252 12.1059C12.8252 12.5026 12.5036 12.8242 12.1069 12.8242C11.7102 12.8242 11.3887 12.5026 11.3887 12.1059C11.3887 11.7093 11.7102 11.3877 12.1069 11.3877C12.5036 11.3877 12.8252 11.7093 12.8252 12.1059Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                                            <path d="M7.12451 21.4637C7.88469 20.7823 8.59089 20.0429 9.23676 19.2523C10.1925 17.9592 11.8863 17.451 13.3961 18.0042C16.9718 19.1375 20.1635 23.3011 23.2249 21.1364C24.3493 20.2785 25.2194 19.1312 25.7423 17.8172C26.05 17.0954 26.4444 16.4137 26.9168 15.7871" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                                        </svg>
                                                    </label>
                                                    <div >
                                                        <div className="text-2xl cursor-pointer" onClick={() => {
                                                            setEmojiPickerState(true)
                                                        }}>&#x1F600;</div>

                                                        <div className="absolute top-14 left-10">

                                                            {emojiPickerState && <MdCancel size={30} className="absolute top-2 right-2  z-50 cursor-pointer" onClick={() => {
                                                                setEmojiPickerState(false)
                                                            }} />}

                                                            <EmojiPicker theme={Theme.DARK} className="bg-card pt-6" open={emojiPickerState} width={300} height={340} onEmojiClick={(emoji) => {
                                                                setEmojiPickerState(false)
                                                                console.log(emoji)
                                                                content.current.value = content.current.value + " " + emoji.emoji
                                                            }} />
                                                        </div>


                                                    </div>
                                                </div>
                                                <div className="w-full flex justify-between p-2">
                                                    <span className="text-base text-center p-2 px-6 bg-card rounded-md">Visibility</span>
                                                    <div>
                                                        <Combobox getSelected={getSelected} />
                                                    </div>
                                                </div>
                                            </div>
                                            <input className="hidden" type="file" multiple id='post-image' onChange={async (e) => {
                                                let _selectedMedia = []
                                                for (let file of e.target.files) {
                                                    if (file.type.startsWith('video/')) {
                                                        _selectedMedia.push({ file, type: 'video', url: URL.createObjectURL(file) })
                                                    }
                                                    if (file.type.startsWith('image/')) {
                                                        _selectedMedia.push({ file, type: 'image', url: URL.createObjectURL(file) })
                                                    }
                                                }
                                                setSelectedMedia([..._selectedMedia, ...selectedMedia])
                                            }} />

                                            {(selectedMedia?.length > 0 || postDetails?.media?.length > 0) &&
                                                <div className="flex items-center justify-center px-2  gap-2">
                                                    <PostCarousel setPostMedia={setPostMedia} postMedia={postMedia} />
                                                </div>
                                            }
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button type="button" disabled={uploading} className="bg-card text-foreground border border-accent hover:text-background-secondary" onClick={() => {
                                                setModelTrigger(false)
                                                if (location.pathname == '/') {
                                                    navigate('/', { replace: true })
                                                    return
                                                }

                                                navigate('', { replace: true })

                                            }} >{editPost ? "Discard" : "Cancel"}</Button>
                                            <Button type="submit" disabled={uploading} className="w-[120px]">{editPost ? "Save" : "Post"}</Button>
                                        </div>

                                    </form>

                                </div>
                            </div >
                        </div>

                    </Sheet.Content>
                </Sheet.Container>
                <Sheet.Backdrop onTap={() => {
                    setModelTrigger(false)
                    if (location.pathname == '/') {
                        navigate('/', { replace: true })
                        return
                    }

                    navigate('', { replace: true })

                }} />
            </Sheet>
        </>
    );
}

export default BottomCreatePost