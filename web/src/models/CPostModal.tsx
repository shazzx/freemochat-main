import { Button } from "@/components/ui/button"
import { FC, useEffect, useRef, useState, useCallback, useMemo } from "react"
import EmojiPicker from 'emoji-picker-react'
import { Theme } from 'emoji-picker-react'
import { MdCancel } from "react-icons/md"
import PostCarousel from "@/components/Carousel"
import { Loader, VideoIcon, Palette, Hash, AtSign, Check } from "lucide-react"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import CustomComboBox from "@/components/ComboboxTwo"
import { TUser } from "@/utils/types/TUser"
import BackgroundPost from "@/components/BackgroundPost"
import { axiosClient } from "@/api/axiosClient"
import MentionsInput, { MentionReference } from "@/components/MentionsInput"
import ContentWithLinksAndMentions from "@/components/ContentWithLinksAndMentions"

interface UserSuggestion {
    _id: string;
    username: string;
    firstname: string;
    lastname: string;
    profile?: string;
    isSpecial?: boolean; 
}


const BACKGROUND_COLORS = [
    { name: 'None', color: null, gradient: null },
    { name: 'Blue', color: '#4A90E2', gradient: ['#4A90E2', '#357ABD'] },
    { name: 'Purple', color: '#7B68EE', gradient: ['#7B68EE', '#6A5ACD'] },
    { name: 'Pink', color: '#FF69B4', gradient: ['#FF69B4', '#FF1493'] },
    { name: 'Orange', color: '#FF8C42', gradient: ['#FF8C42', '#FF6B35'] },
    { name: 'Green', color: '#32CD32', gradient: ['#32CD32', '#228B22'] },
    { name: 'Red', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF5252'] },
    { name: 'Teal', color: '#20B2AA', gradient: ['#20B2AA', '#008B8B'] },
    { name: 'Gold', color: '#FFD700', gradient: ['#FFD700', '#FFA500'] },
];


const TEXT_LIMITS = {
    WITH_BACKGROUND: 280,
    WITHOUT_BACKGROUND: 2000,
};


const extractHashtags = (text: string): string[] => {
    if (!text) return [];
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = [];
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
        const hashtag = match[1].toLowerCase();
        if (hashtag && !hashtags.includes(hashtag)) {
            hashtags.push(hashtag);
        }
    }

    return hashtags;
};

export const fetchUserMentionSuggestions = async (query: string): Promise<UserSuggestion[]> => {
    try {
        const response = await axiosClient.get('/search/mention-suggestions', {
            params: {
                query,
                type: 'users'
            }
        });

        const suggestions: UserSuggestion[] = response.data;
        return suggestions
    } catch (error) {
        console.error('Error fetching user mention suggestions:', error);
        throw error;
    }
};

const CPostModal: FC<{
    setModelTrigger?: Function,
    createPost?: Function,
    createReel?: Function,
    editPost?: boolean,
    postDetails?: {
        _id: string,
        content: string,
        isShared: string,
        user: TUser,
        targetId: string,
        type: string,
        visibility: string,
        target: any,
        media: any,
        mentions?: MentionReference[],
        backgroundColor?: string
    },
    updatePost?: Function,
    isReel?: boolean,
    isShared?: boolean
}> = ({ setModelTrigger, createPost, createReel, editPost, postDetails, updatePost, isReel, isShared }) => {
    const [selectedMedia, setSelectedMedia] = useState([])
    const [emojiPickerState, setEmojiPickerState] = useState(false)
    const [selected, setSelected] = useState("public")
    const [media, setMedia] = useState([])
    const [postMedia, setPostMedia] = useState<{ remove: string, url: string, file: string, filename: string }[]>((postDetails && postDetails?.media) ? [...postDetails?.media] : [])
    const [uploading, setUploading] = useState(false)

    
    
    const [inputText, setInputText] = useState("")
    const [mentionUserIds, setMentionUserIds] = useState<string[]>([])
    const [mentionReferences, setMentionReferences] = useState<MentionReference[]>([])
    const [extractedHashtags, setExtractedHashtags] = useState<string[]>([])
    const [selectedBackground, setSelectedBackground] = useState(
        editPost ? (postDetails?.backgroundColor ? BACKGROUND_COLORS.find(bg => bg.color === postDetails.backgroundColor) || BACKGROUND_COLORS[0] : BACKGROUND_COLORS[0]) : BACKGROUND_COLORS[0]
    )
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)

    const content = useRef<HTMLTextAreaElement>()

    
    useEffect(() => {
        if (editPost && postDetails) {
            
            setInputText(postDetails.content || "");
            
            
            if (postDetails.mentions && postDetails.mentions.length > 0) {
                const userIds = postDetails.mentions.map(m => m._id);
                setMentionUserIds(userIds);
            }
        }
    }, [editPost, postDetails]);

    
    useEffect(() => {
        const hashtags = extractHashtags(inputText);
        setExtractedHashtags(hashtags);
    }, [inputText]);

    
    useEffect(() => {
        if (media.length > 0 && selectedBackground.color) {
            setSelectedBackground(BACKGROUND_COLORS[0]);
        }
    }, [media.length, selectedBackground.color]);

    
    const isReelContent = () => {
        if (isReel) return true;
        return selectedMedia.length === 1 && selectedMedia[0].type === 'video';
    }

    const canUseBackground = () => {
        return media.length === 0;
    }

    const getCurrentTextLimit = () => {
        return selectedBackground.color && canUseBackground() ? TEXT_LIMITS.WITH_BACKGROUND : TEXT_LIMITS.WITHOUT_BACKGROUND;
    }

    const getPlaceholderText = () => {
        if (selectedBackground.color && canUseBackground()) {
            return "Share your thoughts... (max 280 characters)";
        }
        return "What's on your mind? Type @ to mention a user or # to add hashtags...";
    }

    useEffect(() => {
        if (editPost && postDetails?.media?.length > 0 && !isReel) {
            const existingMedia = postDetails.media.filter(media => !media.remove)
            setPostMedia([...selectedMedia, ...existingMedia])
        } else {
            setPostMedia(selectedMedia)
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

    
    const handleMentionsChange = (internalText: string, userIds: string[], references: MentionReference[]) => {
        const textLimit = getCurrentTextLimit();

        
        
        
        if (internalText.length <= textLimit) {
            setInputText(internalText); 
            setMentionUserIds(userIds);
            setMentionReferences(references);
        } else {
            toast.warning(`Text limit exceeded! Maximum ${textLimit} characters allowed.`);
        }
    };

    const handleBackgroundSelect = (background: any) => {
        if (!canUseBackground() && background.color) {
            toast.info("Remove media to use background colors");
            return;
        }

        setSelectedBackground(background);

        if (background.color) {
            const limit = TEXT_LIMITS.WITH_BACKGROUND;
            if (inputText.length > limit) {
                const trimmedText = inputText.substring(0, limit);
                setInputText(trimmedText);
                toast.info(`Text trimmed to ${limit} characters for background post`);
            }
        }

        setShowBackgroundPicker(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault()

        const formData = new FormData()
        const isCreatingReel = isReelContent()

        const hasContent = inputText.trim().length > 0;
        const hasValidMedia = selectedMedia.length > 0;

        if (!hasContent && !hasValidMedia) {
            toast.info("Please write something or add media");
            return;
        }

        if (selectedMedia?.length > 0) {
            if (isCreatingReel) {
                formData.append('file', selectedMedia[0].file)
            } else {
                for (let i = 0; i <= selectedMedia.length - 1; i++) {
                    formData.append('files', selectedMedia[i].file)
                }
            }
        }

        if ((isShared && !editPost) || ((hasContent || hasValidMedia) && !editPost)) {
            const postData = {
                visibility: selected,
                content: inputText.trim(), 
                selectedMedia,
                mentions: mentionUserIds, 
                mentionReferences, 
                hashtags: extractedHashtags,
                ...(selectedBackground.color && media.length === 0 && { backgroundColor: selectedBackground.color })
            };

            if (isCreatingReel) {
                createReel({ ...postData, formData })
            } else {
                createPost({ ...postData, formData })
            }
            setUploading(true)
            navigate('', { replace: true })
            return
        }

        if ((isShared && editPost) || ((hasContent || hasValidMedia) && editPost)) {
            const updateData = {
                visibility: selected,
                content: inputText.trim(), 
                formData,
                selectedMedia,
                media: postMedia,
                setModelTrigger,
                mentions: mentionUserIds, 
                mentionReferences, 
                hashtags: extractedHashtags,
                postId: postDetails._id,
                type: postDetails.type || 'post',
                ...(selectedBackground.color && media.length === 0 && { backgroundColor: selectedBackground.color })
            };

            updatePost(updateData)
            setUploading(true)
            navigate('', { replace: true })
            return
        }

        toast.info("Please write something or add media")
    }

    const handleImageSelection = async (e) => {
        let _selectedMedia = []

        for (let file of e.target.files) {
            if (file.type.startsWith('image/')) {
                _selectedMedia.push({ file, type: 'image', url: URL.createObjectURL(file) })
            }
        }

        setSelectedMedia(_selectedMedia);
        e.target.value = '';
    }

    const handleVideoSelection = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('video/')) {
            e.target.value = '';
            return;
        }

        setSelectedMedia([{ file, type: 'video', url: URL.createObjectURL(file) }]);
        e.target.value = '';
    }

    
    const displayHashtags = useMemo(() => {
        if (extractedHashtags.length === 0) return '';
        return extractedHashtags.map(tag => `#${tag}`).join(', ');
    }, [extractedHashtags]);

    
    const TextPreview = () => {
        if (!selectedBackground?.color || media.length > 0 || selectedMedia.length > 0) {
            return null;
        }

        
        
        
        let previewText = inputText.trim() || "Your text will appear here...";
        
        
        mentionReferences.forEach(ref => {
            const userIdRegex = new RegExp(`@${ref._id}`, 'g');
            previewText = previewText.replace(userIdRegex, `@${ref.username}`);
        });

        return (
            <div className="w-full my-4">
                <BackgroundPost
                    content={previewText}
                    backgroundColor={selectedBackground.color}
                    containerWidth={400}
                    mentions={mentionReferences}
                    onHashtagPress={() => {}}
                    expanded={false}
                    toggleReadMore={() => {}}
                    isShared={false}
                    ContentWithLinksAndMentions={ContentWithLinksAndMentions}
                />
            </div>
        );
    };

    return (
        <div className={`${(isShared && !editPost) ? '' : 'fixed inset-0 z-[100] w-screen overflow-hidden h-screen flex items-center justify-center top-0 right-0'}  `}>
            {(!isShared && editPost) && <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setModelTrigger(false)
                if (location.pathname == '/') {
                    navigate('/', { replace: true })
                    return
                }
                navigate('', { replace: true })
            }}></div>}

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
                    <form className="flex flex-col h-full gap-6" onSubmit={handleSubmit}>
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

                        <div className={`w-full ${selectedMedia?.length > 0 || postDetails?.media?.length ? 'min-h-[200px]' : 'min-h-[200px]'}`}>
                            <MentionsInput
                                value={inputText} 
                                onChangeText={handleMentionsChange} 
                                placeholder={getPlaceholderText()}
                                className="border-accent border w-full bg-card h-full p-2 min-h-[150px] resize-none"
                                onSuggestionsFetch={fetchUserMentionSuggestions}
                                initialReferences={editPost && postDetails?.mentions ? 
                                    postDetails.mentions.map((user: any) => ({
                                        _id: user._id,
                                        username: user.username,
                                        firstname: user.firstname,
                                        lastname: user.lastname,
                                        profile: user.profile
                                    })) : []}
                                textLimit={getCurrentTextLimit()}
                            />

                            <div className="flex justify-end mt-1">
                                <span className={`text-xs ${inputText.length > getCurrentTextLimit() * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {inputText.length}/{getCurrentTextLimit()}
                                </span>
                            </div>
                        </div>

                        <TextPreview />

                        {canUseBackground() && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    className="flex items-center gap-2 p-2 border border-accent rounded-md w-full justify-between hover:bg-accent/10"
                                    onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Palette size={16} className="text-primary" />
                                        <span className="text-sm">Background: {selectedBackground.name}</span>
                                    </div>
                                    <div
                                        className="w-6 h-6 rounded-full border"
                                        style={{ backgroundColor: selectedBackground.color || '#f0f0f0' }}
                                    />
                                </button>

                                {showBackgroundPicker && (
                                    <div className="flex flex-wrap gap-2 p-2 border border-accent rounded-md">
                                        {BACKGROUND_COLORS.map((bg, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative ${selectedBackground.name === bg.name ? 'border-primary' : 'border-gray-300'
                                                    }`}
                                                style={{ backgroundColor: bg.color || '#f0f0f0' }}
                                                onClick={() => handleBackgroundSelect(bg)}
                                            >
                                                {!bg.color && (
                                                    <span className="text-xs text-gray-600">None</span>
                                                )}
                                                {selectedBackground.name === bg.name && (
                                                    <Check size={16} color="white" className="absolute" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* {mentionUserIds.length > 0 && (
                            <div className="bg-blue-50 p-2 rounded-md">
                                <div className="flex items-center gap-2">
                                    <AtSign size={14} className="text-blue-600" />
                                    <span className="text-xs text-blue-800">
                                        {mentionUserIds.length} mention{mentionUserIds.length !== 1 ? 's' : ''}: {mentionReferences.map(ref => `@${ref.username}`).join(', ')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {extractedHashtags.length > 0 && (
                            <div className="bg-purple-50 p-2 rounded-md">
                                <div className="flex items-center gap-2">
                                    <Hash size={14} className="text-purple-600" />
                                    <span className="text-xs text-purple-800">
                                        {extractedHashtags.length} hashtag{extractedHashtags.length !== 1 ? 's' : ''}: {displayHashtags}
                                    </span>
                                </div>
                            </div>
                        )} */}

                        {!isShared &&
                            <>
                                <div>
                                    <div className="w-full flex flex-col items-end justify-center gap-1">
                                        <div className="flex items-center justify-center gap-4">
                                            {!(editPost && isReel) && (
                                                <>
                                                    <label htmlFor="post-image" className="flex flex-col items-center cursor-pointer">
                                                        <svg width="40" height="40" className="stroke-foreground" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M20.8137 7.08301H13.1864C11.5588 7.092 10.0014 7.74722 8.85682 8.90451C7.71228 10.0618 7.07437 11.6264 7.08341 13.254V20.7453C7.08342 20.9853 7.09714 21.2252 7.12449 21.4636C7.4676 24.5567 10.0744 26.9015 13.1864 26.9163H20.8137C22.4414 26.9073 23.9988 26.2521 25.1433 25.0948C26.2879 23.9376 26.9258 22.373 26.9167 20.7453V13.254C26.9258 11.6264 26.2879 10.0618 25.1433 8.90451C23.9988 7.74722 22.4414 7.092 20.8137 7.08301Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M12.8252 12.1059C12.8252 12.5026 12.5036 12.8242 12.1069 12.8242C11.7102 12.8242 11.3887 12.5026 11.3887 12.1059C11.3887 11.7093 11.7102 11.3877 12.1069 11.3877C12.5036 11.3877 12.8252 11.7093 12.8252 12.1059Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M7.12451 21.4637C7.88469 20.7823 8.59089 20.0429 9.23676 19.2523C10.1925 17.9592 11.8863 17.451 13.3961 18.0042C16.9718 19.1375 20.1635 23.3011 23.2249 21.1364C24.3493 20.2785 25.2194 19.1312 25.7423 17.8172C26.05 17.0954 26.4444 16.4137 26.9168 15.7871" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <span className="text-xs mt-1">Images</span>
                                                    </label>

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
                                                            setInputText(prev => prev + " " + emoji.emoji)
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
        </div>
    )
}

export default CPostModal