import { Sheet } from 'react-modal-sheet';
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader, VideoIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { MdCancel } from 'react-icons/md';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import PostCarousel from '@/components/Carousel';
import { Combobox } from '@/components/Comboxbox';
import { Textarea } from '@/components/ui/textarea';
import CustomComboBox from '@/components/ComboboxTwo';


function BottomCreatePost({ setModelTrigger, createPost, createReel, editPost, postDetails, updatePost, isReel, isShared }: any) {
    const [selectedMedia, setSelectedMedia] = useState([])
    const [emojiPickerState, setEmojiPickerState] = useState(false)
    const [selected, setSelected] = useState("public")
    const [media, setMedia] = useState([])
    // const [removeMedia, setRemoveMedia] = useState([])
    const [postMedia, setPostMedia] = useState<{ remove: string, url: string, file: string, filename: string }[]>((postDetails && postDetails?.media) ? [...postDetails?.media] : [])
    const [uploading, setUploading] = useState(false)
    const [searchParams] = useSearchParams()
    const isOpen = (searchParams.get("createpost") == 'true') || (searchParams.get("createreel") == 'true') ? true : editPost ? true : false

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

    // Helper function to determine if current selection should be treated as a reel
    const isReelContent = () => {
        if (isReel) return true; // If explicitly marked as reel (for editing)
        return selectedMedia.length === 1 && selectedMedia[0].type === 'video';
    }

    useEffect(() => {
        // For editing posts, merge with existing media (but only if it's not a media type switch)
        if (editPost && postDetails?.media?.length > 0 && !isReel) {
            // Keep existing media that hasn't been marked for removal, and add new selected media
            const existingMedia = postDetails.media.filter(media => !media.remove)
            setPostMedia([...selectedMedia, ...existingMedia])
        } else {
            // For new posts or when switching media types, replace completely
            setPostMedia(selectedMedia)
            console.log(selectedMedia)
        }

        return () => {
            if (!editPost) {
                setPostMedia([])
            }
        }
    }, [selectedMedia, editPost])

    const getSelected = (selectionState) => {
        setSelected(selectionState)
    }
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        const formData = new FormData()
        const isCreatingReel = isReelContent()

        // Check if there's any valid content
        const hasContent = content.current.value.length > 1;
        const hasValidMedia = selectedMedia.length > 0;

        if (!hasContent && !hasValidMedia) {
            toast.info("Please write something or add media");
            return;
        }

        if (selectedMedia?.length > 0) {
            if (isCreatingReel) {
                // For reels: single video file
                formData.append('file', selectedMedia[0].file)
            } else {
                // For posts: multiple files
                for (let i = 0; i <= selectedMedia.length - 1; i++) {
                    formData.append('files', selectedMedia[i].file)
                }
            }
        }

        if ((isShared && !editPost) || ((hasContent || hasValidMedia) && !editPost)) {
            if (isCreatingReel) {
                // Call createReel method
                createReel({ visibility: selected, content: content.current.value, formData })
            } else {
                // Call createPost method
                createPost({ visibility: selected, content: content.current.value, formData, selectedMedia })
            }
            setUploading(true)
            navigate('', { replace: true })
            return
        }

        if ((isShared && editPost) || ((hasContent || hasValidMedia) && editPost)) {
            updatePost({ visibility: selected, content: content.current.value, formData, selectedMedia, media: postMedia, setModelTrigger })
            setUploading(true)
            navigate('', { replace: true })
            return
        }

        toast.info("Please write something or add media")
    }

    // Helper function to check video duration
    const checkVideoDuration = (file): Promise<boolean> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                resolve(duration <= 90); // 90 seconds max for reels
            };

            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(false);
            };

            video.src = URL.createObjectURL(file);
        });
    };

    const handleImageSelection = async (e) => {
        let _selectedMedia = []

        for (let file of e.target.files) {
            if (file.type.startsWith('image/')) {
                _selectedMedia.push({ file, type: 'image', url: URL.createObjectURL(file) })
            }
        }

        // Replace any existing media with images (clear videos if any)
        setSelectedMedia(_selectedMedia);

        // Clear the input value to allow re-selection of the same files
        e.target.value = '';
    }

    const handleVideoSelection = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('video/')) {
            e.target.value = ''; // Clear the input if invalid file
            return;
        }

        // Check video duration for reel compliance
        const isValidDuration = await checkVideoDuration(file);

        if (!isValidDuration) {
            toast.error("Video duration must be 90 seconds or less");
            e.target.value = ''; // Clear the input
            return;
        }

        // Replace all media with single video (clear images if any)
        setSelectedMedia([{ file, type: 'video', url: URL.createObjectURL(file) }]);

        // Clear the input value to allow re-selection of the same file
        e.target.value = '';
    }

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
                        <div className={`relative z-20 ${(isShared && !editPost) ? 'sm:w-[360px] overflow-auto sm:border-2 sm:border-accent' : 'h-full sm:max-h-[700px] bg-background rounded-lg w-full sm:w-[440px] overflow-auto sm:border-2 sm:border-accent'} `}>
                            {uploading &&
                                <div className="z-10 absolute w-full h-full flex items-center justify-center">
                                    <div className="absolute w-full h-full bg-card opacity-70"></div>
                                    <div className="z-10 flex gap-2">
                                        <Loader />
                                        <span>Uploading...</span>
                                    </div>
                                </div>
                            }

                            <div className="p-3 h-full z-10 overflow-y-auto relative bg-background-secondary sm:border sm:border-accent">
                                <form className="flex flex-col h-full gap-10" onSubmit={handleSubmit}>
                                    {(!isShared || editPost) &&
                                        <div>
                                            <h3 className="text-center text-lg sm:text-xl">
                                                {editPost ? `Update ${isReel ? 'Reel' : 'Post'}` :
                                                    isReelContent() ? 'Create Reel' : 'Create Post'}
                                            </h3>
                                            {isReelContent() && !editPost && (
                                                <p className="text-center text-sm text-gray-600 mt-1">
                                                    Creating a reel (single video detected)
                                                </p>
                                            )}
                                        </div>
                                    }

                                    <div className={`w-full ${selectedMedia?.length > 0 || postDetails?.media?.length ? 'h-[240px]' : 'h-[360px]'} flex flex-col items-center`}>
                                        <Textarea
                                            name="create post"
                                            className="border-accent border w-full bg-card h-full p-2"
                                            defaultValue={editPost && postDetails?.content}
                                            placeholder={isReelContent() ? "Write a caption for your reel..." : "Write something"}
                                            id=""
                                            ref={content}
                                        />
                                    </div>

                                    {!isShared &&
                                        <>
                                            <div>
                                                <div className="w-full flex flex-col items-end justify-center gap-1">
                                                    <div className="flex items-center justify-center gap-4">
                                                        {/* Separate Icons for Images and Videos */}
                                                        {!(editPost && isReel) && (
                                                            <>
                                                                {/* Image Selection */}
                                                                <label htmlFor="post-image" className="flex flex-col items-center cursor-pointer">
                                                                    <svg width="40" height="40" className="stroke-foreground" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path fillRule="evenodd" clipRule="evenodd" d="M20.8137 7.08301H13.1864C11.5588 7.092 10.0014 7.74722 8.85682 8.90451C7.71228 10.0618 7.07437 11.6264 7.08341 13.254V20.7453C7.08342 20.9853 7.09714 21.2252 7.12449 21.4636C7.4676 24.5567 10.0744 26.9015 13.1864 26.9163H20.8137C22.4414 26.9073 23.9988 26.2521 25.1433 25.0948C26.2879 23.9376 26.9258 22.373 26.9167 20.7453V13.254C26.9258 11.6264 26.2879 10.0618 25.1433 8.90451C23.9988 7.74722 22.4414 7.092 20.8137 7.08301Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.8252 12.1059C12.8252 12.5026 12.5036 12.8242 12.1069 12.8242C11.7102 12.8242 11.3887 12.5026 11.3887 12.1059C11.3887 11.7093 11.7102 11.3877 12.1069 11.3877C12.5036 11.3877 12.8252 11.7093 12.8252 12.1059Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                        <path d="M7.12451 21.4637C7.88469 20.7823 8.59089 20.0429 9.23676 19.2523C10.1925 17.9592 11.8863 17.451 13.3961 18.0042C16.9718 19.1375 20.1635 23.3011 23.2249 21.1364C24.3493 20.2785 25.2194 19.1312 25.7423 17.8172C26.05 17.0954 26.4444 16.4137 26.9168 15.7871" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                    <span className="text-xs mt-1">Images</span>
                                                                </label>

                                                                {/* Video Selection */}
                                                                <label htmlFor="post-video" className="flex flex-col items-center cursor-pointer">
                                                                    <VideoIcon className="w-10 h-10 stroke-foreground" strokeWidth={1.2} />
                                                                    <span className="text-xs mt-1">Video</span>
                                                                </label>
                                                            </>
                                                        )}

                                                        <div>
                                                            <div className="text-2xl cursor-pointer" onClick={() => setEmojiPickerState(true)}>
                                                                &#x1F600;
                                                            </div>
                                                            <div className="absolute top-14 left-10">
                                                                {emojiPickerState && (
                                                                    <MdCancel
                                                                        size={30}
                                                                        className="absolute top-2 right-2 z-50 cursor-pointer"
                                                                        onClick={() => setEmojiPickerState(false)}
                                                                    />
                                                                )}
                                                                <EmojiPicker
                                                                    theme={Theme.DARK}
                                                                    className="bg-card pt-6"
                                                                    open={emojiPickerState}
                                                                    width={300}
                                                                    height={340}
                                                                    onEmojiClick={(emoji) => {
                                                                        setEmojiPickerState(false)
                                                                        content.current.value = content.current.value + " " + emoji.emoji
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-full flex justify-between p-2">
                                                        <span className="text-base text-center p-2 px-6 bg-card rounded-md">Visibility</span>
                                                        <div>
                                                            <CustomComboBox getSelected={getSelected} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hidden File Inputs */}
                                                <input
                                                    className="hidden"
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    id='post-image'
                                                    onChange={handleImageSelection}
                                                />

                                                <input
                                                    className="hidden"
                                                    type="file"
                                                    accept="video/*"
                                                    id='post-video'
                                                    onChange={handleVideoSelection}
                                                />

                                                {(selectedMedia?.length > 0 || postDetails?.media?.length > 0) && !(isReel && editPost) &&
                                                    <div className="flex items-center justify-center px-2 gap-2">
                                                        <PostCarousel
                                                            setPostMedia={setPostMedia}
                                                            postMedia={postMedia}
                                                            selectedMedia={selectedMedia}
                                                            setSelectedMedia={setSelectedMedia}
                                                        />
                                                    </div>
                                                }
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    disabled={uploading}
                                                    className="bg-card text-foreground border border-accent hover:text-background-secondary"
                                                    onClick={() => {
                                                        setModelTrigger(false)
                                                        if (location.pathname == '/') {
                                                            navigate('/', { replace: true })
                                                            return
                                                        }
                                                        navigate('', { replace: true })
                                                    }}
                                                >
                                                    {editPost ? "Discard" : "Cancel"}
                                                </Button>
                                                <Button type="submit" disabled={uploading} className="w-[120px]">
                                                    {editPost ? "Save" : (isReelContent() ? "Create Reel" : "Post")}
                                                </Button>
                                            </div>
                                        </>
                                    }

                                    {isShared &&
                                        <div className="flex items-center justify-center">
                                            <Button type="submit" disabled={uploading} className="w-[120px]">
                                                {editPost ? "Save" : "Share"}
                                            </Button>
                                        </div>
                                    }
                                </form>
                            </div>
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