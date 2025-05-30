import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import CustomComboBox from '@/components/ComboboxTwo';
import { ScrollArea } from "@/components/ui/scroll-area";

function EditReelBottomSheet({ setModelTrigger, createPost, editPost, postDetails, updatePost, isReel, isShared }: any) {
    const [selectedMedia, setSelectedMedia] = useState([])
    const [emojiPickerState, setEmojiPickerState] = useState(false)
    const [selected, setSelected] = useState("public")
    const [media, setMedia] = useState([])
    const [postMedia, setPostMedia] = useState<{ remove: string, url: string, file: string, filename: string }[]>((postDetails && postDetails?.media) ? [...postDetails?.media] : [])
    const [uploading, setUploading] = useState(false)
    const [searchParams] = useSearchParams()
    const isOpen = (searchParams.get("createpost") == 'true') || (searchParams.get("createreel") == 'true') ? true : editPost ? true : false

    const content = useRef<HTMLTextAreaElement>()

    useEffect(() => {
        if (postMedia?.length > 0) {
            console.log(postMedia)
            setPostMedia([...selectedMedia, ...postMedia])
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

    const handleClose = () => {
        setModelTrigger(false)
        if (location.pathname == '/') {
            navigate('/', { replace: true })
            return
        }
        navigate('', { replace: true })
    }

    console.log(postDetails, 'reel details')

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent
                side="bottom"
                className={`rounded-t-2xl p-4 bg-background text-foreground shadow-lg max-h-[90vh] overflow-y-auto ${(isShared && !editPost)
                    ? 'max-w-[360px] mx-auto'
                    : 'max-w-[440px] mx-auto'
                    }`}
            >
                {/* Loading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-card/70"></div>
                        <div className="z-10 flex gap-2 items-center">
                            <Loader className="animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col w-full">
                    {/* Handle/indicator */}
                    <div className="w-full flex items-center justify-center mb-4">
                        <div className="w-10 h-1.5 rounded-full bg-gray-300 my-2"></div>
                    </div>

                    {/* Header */}
                    {(!isShared || editPost) && (
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-semibold">
                                {editPost ? `Update ${isReel ? 'Reel' : 'Post'}` : `Create ${isReel ? 'Reel' : 'Post'}`}
                            </h2>
                        </div>
                    )}

                    <ScrollArea className="max-h-[75vh]">
                        <form
                            className="flex flex-col gap-6"
                            onSubmit={async (e) => {
                                e.preventDefault()

                                const formData = new FormData()

                                if (selectedMedia?.length > 0 && !isReel) {
                                    for (let i = 0; i <= selectedMedia.length - 1; i++) {
                                        formData.append('files', selectedMedia[i].file)
                                    }
                                }

                                if (selectedMedia?.length > 0 && isReel) {
                                    formData.append('file', selectedMedia[0].file)
                                }

                                if ((isShared && !editPost) || ((content.current.value.length > 1 || selectedMedia.length > 0) && !editPost)) {
                                    createPost({ visibility: selected, content: content.current.value, formData, selectedMedia })
                                    setUploading(true)
                                    navigate('', { replace: true })
                                    return
                                }

                                if ((isShared && editPost) || (content.current.value.length > 1 || selectedMedia.length > 0 && editPost)) {
                                    updatePost({ visibility: selected, content: content.current.value, formData, selectedMedia, media: postMedia, setModelTrigger, postId: postDetails?._id })
                                    setUploading(true)
                                    navigate('', { replace: true })
                                    return
                                }

                                toast.info("Please write something")
                            }}
                        >
                            {/* Content Textarea */}
                            <div className="w-full">
                                <Textarea
                                    name="create post"
                                    className={`border-accent border w-full bg-card resize-none ${selectedMedia?.length > 0 || postDetails?.media?.length ? 'h-[180px]' : 'h-[280px]'
                                        }`}
                                    defaultValue={editPost && postDetails?.content}
                                    placeholder={isReel ? "Write a caption for your reel..." : "write something"}
                                    ref={content}
                                />
                            </div>

                            {!isShared && (
                                <>
                                    {/* Media and Emoji Controls */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Media Upload Button */}
                                                {!(editPost && isReel) && (
                                                    <label htmlFor="post-image" className="cursor-pointer">
                                                        <svg width="32" height="32" className="stroke-foreground hover:stroke-primary transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M20.8137 7.08301H13.1864C11.5588 7.092 10.0014 7.74722 8.85682 8.90451C7.71228 10.0618 7.07437 11.6264 7.08341 13.254V20.7453C7.08342 20.9853 7.09714 21.2252 7.12449 21.4636C7.4676 24.5567 10.0744 26.9015 13.1864 26.9163H20.8137C22.4414 26.9073 23.9988 26.2521 25.1433 25.0948C26.2879 23.9376 26.9258 22.373 26.9167 20.7453V13.254C26.9258 11.6264 26.2879 10.0618 25.1433 8.90451C23.9988 7.74722 22.4414 7.092 20.8137 7.08301Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M12.8252 12.1059C12.8252 12.5026 12.5036 12.8242 12.1069 12.8242C11.7102 12.8242 11.3887 12.5026 11.3887 12.1059C11.3887 11.7093 11.7102 11.3877 12.1069 11.3877C12.5036 11.3877 12.8252 11.7093 12.8252 12.1059Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M7.12451 21.4637C7.88469 20.7823 8.59089 20.0429 9.23676 19.2523C10.1925 17.9592 11.8863 17.451 13.3961 18.0042C16.9718 19.1375 20.1635 23.3011 23.2249 21.1364C24.3493 20.2785 25.2194 19.1312 25.7423 17.8172C26.05 17.0954 26.4444 16.4137 26.9168 15.7871" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </label>
                                                )}

                                                {/* Emoji Picker */}
                                                <div className="relative">
                                                    <div
                                                        className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                                                        onClick={() => setEmojiPickerState(true)}
                                                    >
                                                        &#x1F600;
                                                    </div>

                                                    {emojiPickerState && (
                                                        <div className="absolute bottom-10 left-0 z-50">
                                                            <div className="relative">
                                                                <MdCancel
                                                                    size={24}
                                                                    className="absolute -top-2 -right-2 z-50 cursor-pointer bg-background rounded-full"
                                                                    onClick={() => setEmojiPickerState(false)}
                                                                />
                                                                <EmojiPicker
                                                                    theme={Theme.DARK}
                                                                    open={emojiPickerState}
                                                                    width={280}
                                                                    height={320}
                                                                    onEmojiClick={(emoji) => {
                                                                        setEmojiPickerState(false)
                                                                        content.current.value = content.current.value + " " + emoji.emoji
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visibility Settings */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-base bg-card px-4 py-2 rounded-md">Visibility</span>
                                            <CustomComboBox getSelected={getSelected} />
                                        </div>

                                        {/* File Input */}
                                        <input
                                            className="hidden"
                                            type="file"
                                            multiple={!isReel}
                                            accept={isReel ? "video/*" : "image/*,video/*"}
                                            id='post-image'
                                            onChange={async (e) => {
                                                let _selectedMedia = []

                                                const checkVideoDuration = (file): Promise<boolean> => {
                                                    return new Promise((resolve) => {
                                                        const video = document.createElement('video');
                                                        video.preload = 'metadata';

                                                        video.onloadedmetadata = () => {
                                                            window.URL.revokeObjectURL(video.src);
                                                            const duration = video.duration;
                                                            resolve(duration <= 90);
                                                        };

                                                        video.onerror = () => {
                                                            window.URL.revokeObjectURL(video.src);
                                                            resolve(false);
                                                        };

                                                        video.src = URL.createObjectURL(file);
                                                    });
                                                };

                                                for (let file of e.target.files) {
                                                    if (isReel) {
                                                        if (file.type.startsWith('video/')) {
                                                            const isValidDuration = await checkVideoDuration(file);

                                                            if (!isValidDuration) {
                                                                toast.error("Video duration must be 90 seconds or less for reels");
                                                                e.target.value = '';
                                                                return;
                                                            }

                                                            _selectedMedia = [{ file, type: 'video', url: URL.createObjectURL(file) }]
                                                            break;
                                                        }
                                                    } else {
                                                        if (file.type.startsWith('video/')) {
                                                            _selectedMedia.push({ file, type: 'video', url: URL.createObjectURL(file) })
                                                        }
                                                        if (file.type.startsWith('image/')) {
                                                            _selectedMedia.push({ file, type: 'image', url: URL.createObjectURL(file) })
                                                        }
                                                    }
                                                }

                                                if (isReel) {
                                                    setSelectedMedia(_selectedMedia)
                                                } else {
                                                    setSelectedMedia([..._selectedMedia, ...selectedMedia])
                                                }
                                            }}
                                        />

                                        {/* Media Carousel */}
                                        {/* {(selectedMedia?.length > 0 || postDetails?.media?.length > 0) && !(isReel && editPost) && (
                                            <div className="flex items-center justify-center">
                                                <PostCarousel
                                                    setPostMedia={setPostMedia}
                                                    postMedia={postMedia}
                                                />
                                            </div>
                                        )} */}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-2 pb-2">
                                        <Button
                                            type="button"
                                            disabled={uploading}
                                            variant="outline"
                                            onClick={handleClose}
                                            className="min-w-[100px]"
                                        >
                                            {editPost ? "Discard" : "Cancel"}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={uploading}
                                            className="min-w-[120px]"
                                        >
                                            {editPost ? "Save" : (isReel ? "Create Reel" : "Post")}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Shared Post Button */}
                            {isShared && (
                                <div className="flex items-center justify-center pt-2 pb-2">
                                    <Button
                                        type="submit"
                                        disabled={uploading}
                                        className="min-w-[120px]"
                                    >
                                        {editPost ? "Save" : "Share"}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default EditReelBottomSheet