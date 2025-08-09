import React, { Ref, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import PostModel from '@/models/PostModel'
import { axiosClient } from '@/api/axiosClient'
import { DropdownMenuMain } from './DropDown'
import ReportModel from '@/models/ReportModel'
import { useInView } from 'react-intersection-observer'
import PostPromotionModel from '@/models/PostPromotionModel'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { WhatsappIcon, WhatsappShareButton } from 'react-share'
import { useRemovePost, useUpdatePost } from '@/hooks/Post/usePost'
import CPostModal from '@/models/CPostModal'
import { domain } from '@/config/domain'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PostMediaCarousel } from './Post/PostMediaCarousel'
import { Copy, FilmIcon, Share2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { insertViewedPost } from '@/app/features/user/viewPostSlice'
import { setOpen } from '@/app/features/user/postModelSlice'
import { PiShareFatLight } from "react-icons/pi";
import AutoPlayVideo from './AutoPlayVideo'
import ShareModel from '@/models/ShareModel'
import LikeButton from './Post/LikeButton'
import BottomComments from '@/models/BottomComments'
import { MdShare } from 'react-icons/md'
import { RiShareForward2Line, RiShareForwardLine } from 'react-icons/ri'
import LikesModel from '@/models/LikesModel'
import { ReelItem } from './Reel/ReelsSuggetion'
import ShareBottomSheet from '@/models/ShareBottomSheet'
import ShareModal from '@/models/ShareModal'
import BackgroundPost from './BackgroundPost'
import EnvironmentalContributorTag from '@/models/EnvironmentalContributorTag'

// Define types for mentions and content parsing
interface MentionUser {
    _id: string;
    username: string;
    firstname: string;
    lastname: string;
    profile?: string;
}

interface ContentPart {
    type: 'text' | 'link' | 'mention' | 'hashtag';
    content: string;
    user?: MentionUser;
    hashtag?: string;
    style?: React.CSSProperties;
}

interface PostProps {
    postData: any,
    model?: boolean,
    username?: string,
    userId?: string,
    removeBookmark?: any,
    removePost?: any,
    postIndex?: number,
    pageIndex?: number
    useLikePost?: any,
    useBookmarkPost?: any,
    type?: string,
    fetchNextPage?: any,
    commentContent?: string,
    setEditCommentModelState?: any,
    editCommentModelState?: boolean,
    self?: boolean,
    profile?: string,
    isAdmin?: boolean
    isSearch?: boolean
    query?: any
    scrollRef?: any
}

// Regex patterns for parsing content
const URL_REGEX = /(?:(?:https?|ftp):\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const MENTION_REGEX = /@(\w+)/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g;
const MAX_CONTENT_LENGTH = 360;

// BackgroundPost component for posts with colored backgrounds
// const BackgroundPost: React.FC<{
//     content: string;
//     backgroundColor: string;
//     theme?: any;
//     mentions: MentionUser[];
//     onHashtagPress: (hashtag: string) => void;
//     expanded: boolean;
//     toggleReadMore: () => void;
// }> = ({ content, backgroundColor, mentions, onHashtagPress, expanded, toggleReadMore }) => {
//     const navigate = useNavigate();

//     const getTextStyle = (): React.CSSProperties => {
//         const textLength: number = content.length;
//         let fontSize: number = 24;

//         if (textLength > 200) fontSize = 18;
//         else if (textLength > 150) fontSize = 20;
//         else if (textLength > 100) fontSize = 22;
//         else if (textLength > 50) fontSize = 24;

//         return {
//             fontSize,
//             color: 'white',
//             textAlign: 'center',
//             fontWeight: 700,
//             textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
//             lineHeight: fontSize * 1.3 + 'px',
//         };
//     };

//     const textStyle = getTextStyle();
//     const postHeight = Math.min(Math.max(200, (textStyle.fontSize as number) * 8), 400);

//     return (
//         <div
//             style={{
//                 backgroundColor: backgroundColor,
//                 height: postHeight,
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 position: 'relative',
//                 overflow: 'hidden',
//                 borderRadius: '8px',
//                 margin: '10px 0',
//             }}
//         >
//             <div style={{ 
//                 padding: '20px',
//                 zIndex: 2,
//                 width: '100%',
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center'
//             }}>
//                 <ContentWithLinksAndMentions
//                     content={content}
//                     expanded={expanded}
//                     toggleReadMore={toggleReadMore}
//                     mentions={mentions}
//                     onHashtagPress={onHashtagPress}
//                     hasBackground={true}
//                     textStyle={textStyle}
//                 />
//             </div>

//             {/* Gradient overlay */}
//             <div 
//                 style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: 0,
//                     backgroundColor: `${backgroundColor}22`,
//                     opacity: 0.1,
//                     zIndex: 1,
//                 }}
//             />
//         </div>
//     );
// };

// ContentWithLinksAndMentions component for parsing and rendering interactive content
const ContentWithLinksAndMentions: React.FC<{
    content: string;
    expanded: boolean;
    toggleReadMore: () => void;
    mentions: MentionUser[];
    onHashtagPress: (hashtag: string) => void;
    hasBackground?: boolean;
    textStyle?: React.CSSProperties;
}> = ({ content, expanded, toggleReadMore, mentions = [], onHashtagPress, hasBackground = false, textStyle }) => {
    const navigate = useNavigate();

    const parsedContent = React.useMemo(() => {
        if (!content) return [];

        let displayContent = content;

        // Replace user IDs with usernames
        const userIdRegex = /@([a-f\d]{24})/g;
        let match;
        const processedIds = new Set<string>();

        while ((match = userIdRegex.exec(content)) !== null) {
            const userId = match[1];
            if (!processedIds.has(userId)) {
                processedIds.add(userId);
                const user = mentions.find(u => u._id === userId);

                if (user) {
                    const idRegex = new RegExp(`@${userId}`, 'g');
                    displayContent = displayContent.replace(idRegex, `@${user.username}`);
                } else {
                    const idRegex = new RegExp(`@${userId}`, 'g');
                    displayContent = displayContent.replace(idRegex, '@deleted-user');
                }
            }
        }

        const parts: ContentPart[] = [];
        let lastIndex = 0;

        const patterns = [
            { type: 'url' as const, regex: URL_REGEX },
            { type: 'mention' as const, regex: MENTION_REGEX },
            { type: 'hashtag' as const, regex: HASHTAG_REGEX }
        ];

        const matches: Array<{
            type: 'url' | 'mention' | 'hashtag';
            content: string;
            index: number;
            length: number;
            groups: RegExpExecArray;
        }> = [];

        patterns.forEach(pattern => {
            const regex = new RegExp(pattern.regex.source, 'gi');
            let match: RegExpExecArray | null;

            while ((match = regex.exec(displayContent)) !== null) {
                matches.push({
                    type: pattern.type,
                    content: match[0],
                    index: match.index,
                    length: match[0].length,
                    groups: match
                });
            }
        });

        matches.sort((a, b) => a.index - b.index);

        matches.forEach(match => {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: displayContent.slice(lastIndex, match.index)
                });
            }

            if (match.type === 'url') {
                parts.push({
                    type: 'link',
                    content: match.content
                });
            } else if (match.type === 'mention') {
                const username = match.content.slice(1);

                if (username === 'deleted-user') {
                    parts.push({
                        type: 'text',
                        content: match.content,
                        style: { color: '#999', fontStyle: 'italic' }
                    });
                } else {
                    const mentionedUser = mentions.find(user => user.username === username);

                    if (mentionedUser) {
                        parts.push({
                            type: 'mention',
                            content: match.content,
                            user: mentionedUser
                        });
                    } else {
                        parts.push({
                            type: 'text',
                            content: match.content
                        });
                    }
                }
            } else if (match.type === 'hashtag') {
                const hashtagName = match.content.slice(1);
                parts.push({
                    type: 'hashtag',
                    content: match.content,
                    hashtag: hashtagName
                });
            }

            lastIndex = match.index + match.length;
        });

        if (lastIndex < displayContent.length) {
            parts.push({
                type: 'text',
                content: displayContent.slice(lastIndex)
            });
        }

        return parts;
    }, [content, mentions]);

    const displayContent = React.useMemo(() => {
        if (expanded || content.length <= MAX_CONTENT_LENGTH) {
            return parsedContent;
        } else {
            let totalLength = 0;
            let cutoffIndex = 0;

            for (let i = 0; i < parsedContent.length; i++) {
                totalLength += parsedContent[i].content.length;
                if (totalLength >= MAX_CONTENT_LENGTH) {
                    cutoffIndex = i;
                    break;
                }
            }

            const truncated = parsedContent.slice(0, cutoffIndex + 1);

            if (truncated.length > 0 && truncated[cutoffIndex].type === 'text') {
                const lastItem = { ...truncated[cutoffIndex] };
                const remainingLength = MAX_CONTENT_LENGTH - (totalLength - lastItem.content.length);
                lastItem.content = lastItem.content.substring(0, remainingLength) + '...';
                truncated[cutoffIndex] = lastItem;
            }

            return truncated;
        }
    }, [parsedContent, expanded, content.length]);

    const handleMentionPress = React.useCallback((user: MentionUser) => {
        navigate(`${domain}/user/${user.username}`);
    }, [navigate]);

    const handleHashtagPress = React.useCallback((hashtag: string) => {
        onHashtagPress(hashtag);
    }, [onHashtagPress]);

    const getLinkStyle = () => ({
        color: hasBackground ? 'white' : 'var(--primary)',
        textDecoration: 'underline',
        cursor: 'pointer',
        ...textStyle
    });

    const getMentionStyle = () => ({
        color: hasBackground ? 'white' : 'var(--primary)',
        fontWeight: hasBackground ? 700 : 500,
        cursor: 'pointer',
        ...textStyle
    });

    const getHashtagStyle = () => ({
        color: hasBackground ? 'white' : 'var(--primary)',
        fontWeight: hasBackground ? 700 : 500,
        textDecoration: 'underline',
        cursor: 'pointer',
        ...textStyle
    });

    const getTextStyle = (itemStyle?: React.CSSProperties) => ({
        color: hasBackground ? 'white' : 'var(--card-foreground)',
        ...textStyle,
        ...itemStyle
    });

    return (
        <div style={hasBackground ? { textAlign: 'center' } : {}}>
            {displayContent.map((item, index) => {
                if (item.type === 'link') {
                    return (
                        <span
                            key={index}
                            style={getLinkStyle()}
                            onClick={() => window.open(item.content.startsWith('http') ? item.content : `https://${item.content}`, '_blank')}
                        >
                            {item.content}
                        </span>
                    );
                } else if (item.type === 'mention') {
                    return (
                        <span
                            key={index}
                            style={getMentionStyle()}
                            onClick={() => handleMentionPress(item.user!)}
                        >
                            {item.content}
                        </span>
                    );
                } else if (item.type === 'hashtag') {
                    return (
                        <span
                            key={index}
                            style={getHashtagStyle()}
                            onClick={() => handleHashtagPress(item.hashtag!)}
                        >
                            {item.content}
                        </span>
                    );
                } else {
                    return (
                        <span
                            key={index}
                            style={getTextStyle(item.style)}
                        >
                            {item.content}
                        </span>
                    );
                }
            })}

            {content.length > MAX_CONTENT_LENGTH && (
                <div style={{ marginTop: '5px' }}>
                    <span
                        style={{
                            color: hasBackground ? 'white' : 'var(--primary)',
                            cursor: 'pointer',
                            fontWeight: hasBackground ? 700 : 500,
                            ...textStyle
                        }}
                        onClick={toggleReadMore}
                    >
                        {expanded ? 'Show less' : 'Read more'}
                    </span>
                </div>
            )}
        </div>
    );
};

// Create a separate SharedPostContent component
const SharedPostContent = ({ sharedPost, handleNavigation }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const expandable = sharedPost?.content?.slice(0, 360);
    const [width, setWidth] = useState(window.innerWidth);
    const [date, setDate] = useState("");
    const [_profile, setProfile] = useState(undefined);
    const [fullname, setFullname] = useState(undefined);
    const [contentExpanded, setContentExpanded] = useState(false);
    const touchStartTime = useRef(0);
    const touchStartPos = useRef({ x: 0, y: 0 });

    const navigateToPost = () => navigate(`/post/${sharedPost?._id}?type=post`)

    const toggleReadMore = React.useCallback(() => {
        setContentExpanded(prev => !prev);
    }, []);

    const handleHashtagPress = React.useCallback((hashtag: string) => {
        navigate(`/hashtags-feed/${hashtag}`);
    }, [navigate]);

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        touchStartTime.current = Date.now();
        touchStartPos.current = {
            x: touch.clientX,
            y: touch.clientY
        };
    };

    const handleTouchEnd = (e) => {
        if (!handleNavigation) return;

        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime.current;

        // Get final touch position
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

        // 2. Movement is less than 10px in any direction (not a scroll)
        if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
            e.preventDefault();
            e.stopPropagation();
            if (sharedPost?.media?.[0]?.type == 'video') {
                handleNavigation();
            } else {
                navigateToPost()
            }
        }
    };

    const handleClick = (e) => {
        if (sharedPost?.media?.[0]?.type == 'video') {
            handleNavigation();
        } else {
            navigateToPost()
        }
    };

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth);
        });
        return () => window.removeEventListener("resize", () => { });
    }, []);

    useEffect(() => {
        if (sharedPost) {
            let date = format(sharedPost.createdAt ?? Date.now(), 'MMM d, yyy h:mm a');
            setProfile(sharedPost?.target?.profile);
            setFullname(sharedPost?.target?.firstname + sharedPost?.target?.lastname);
            setDate(date);
        }
    }, [sharedPost]);

    const handleCardPress = () => {
        if (!sharedPost) return;

        const navigation = sharedPost?.type === "group"
            ? `${domain}/group/${sharedPost.target.handle}`
            : sharedPost?.type === "page"
                ? `${domain}/page/${sharedPost.target.handle}`
                : `${domain}/user/${sharedPost.target.username}`;

        console.log(navigation, 'this is navigation')
        // navigate(navigation);
    };

    if (!sharedPost) return null;

    let navigation = sharedPost?.type == 'user' ? sharedPost?.target?.username : sharedPost?.target?.handle;

    return (
        <Card className="w-full border-muted bg-muted/30">
            <CardHeader className='p-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex gap-2' onClick={handleCardPress} style={{ cursor: 'pointer' }}>
                        {sharedPost.type == 'group'
                            ?
                            <div className='relative '>
                                <Link to={navigation && `${domain}/${sharedPost?.type}/${navigation}`}>
                                    <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                        <Avatar className='font-normal'>
                                            <AvatarImage src={_profile} alt="Avatar" />
                                            <AvatarFallback>{(sharedPost?.target?.name ? (sharedPost?.target?.name[0]?.toUpperCase()) + sharedPost?.target?.name[1]?.toUpperCase() : "D")}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </Link>
                                <Link to={sharedPost?.user?.username && `${domain}/user/${sharedPost?.user?.username}`}>
                                    <div className='absolute -bottom-1 border border-accent -right-1 bg-accent w-8 h-8 flex items-center justify-center rounded-full overflow-hidden'>
                                        <Avatar className='font-normal'>
                                            <AvatarImage src={sharedPost.user.profile} alt="Avatar" />
                                            <AvatarFallback>{(sharedPost?.user?.firstname ? sharedPost?.user?.firstname[0]?.toUpperCase() : "D")}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </Link>
                            </div>
                            :
                            <Link to={navigation && `${domain}/${sharedPost?.type}/${navigation}`}>
                                <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                    {sharedPost?.type !== 'user' ?
                                        <Avatar className='font-normal'>
                                            <AvatarImage src={_profile} alt="Avatar" />
                                            <AvatarFallback>{(sharedPost?.target?.name ? (sharedPost?.target?.name[0]?.toUpperCase()) + sharedPost?.target?.name[1]?.toUpperCase() : "D")}</AvatarFallback>
                                        </Avatar>
                                        :
                                        <Avatar className='font-normal'>
                                            <AvatarImage src={_profile} alt="Avatar" />
                                            <AvatarFallback>{(sharedPost?.target?.firstname ? (sharedPost?.target?.firstname[0]?.toUpperCase()) + (sharedPost?.target?.lastname && sharedPost?.target?.lastname[0]?.toUpperCase()) : "D")}</AvatarFallback>
                                        </Avatar>
                                    }
                                </div>
                            </Link>
                        }

                        <div className='flex flex-col gap-1'>
                            {sharedPost.type == 'group' ?
                                <h3 className='text-card-foreground flex gap-2 text-sm font-normal'>
                                    <Link to={sharedPost?.user?.username && `${domain}/user/${sharedPost?.user?.username}`}>
                                        {sharedPost?.user?.firstname + " " + sharedPost?.user?.lastname}
                                    </Link>
                                    <Link to={navigation && `${domain}/${sharedPost?.type}/${navigation}`}>
                                        ({sharedPost?.target?.name || "Deleted"})
                                    </Link>
                                </h3>
                                :
                                navigation ?
                                    <Link to={`${domain}/${sharedPost?.type}/${navigation}`}>
                                        <h3 className='text-card-foreground flex gap-2 text-sm font-normal'>{(sharedPost?.target?.firstname ? (sharedPost?.target?.firstname + " " + sharedPost?.target?.lastname) : sharedPost?.target?.name)}</h3>
                                    </Link>
                                    :
                                    <div>
                                        <h3 className='text-card-foreground flex gap-2 text-sm font-normal'>{(sharedPost?.target?.firstname ? (sharedPost?.target?.firstname + " " + sharedPost?.target?.lastname) : sharedPost?.target?.name || 'Deleted')}</h3>
                                    </div>
                            }
                            <span className='text-muted-foreground text-xs font-normal'>{date}</span>
                        </div>

                        {/* Reel Badge */}
                        {sharedPost?.postType === 'reel' && (
                            <div className="flex gap-1 items-center bg-blue-600/80 px-3 rounded-full ml-3 shadow-sm">
                                <FilmIcon size={16} color='white' />
                                <span className="text-white text-xs font-semibold tracking-wide">Reel</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm p-0 sm:px-3 font-normal"
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}

            >
                <div className='text-sm font-normal px-2 sm:px-0'>
                    {/* Background post rendering for shared posts */}
                    {sharedPost?.backgroundColor ? (
                        <BackgroundPost
                            content={sharedPost.content}
                            backgroundColor={sharedPost.backgroundColor}
                            mentions={sharedPost.populatedMentions || []}
                            onHashtagPress={handleHashtagPress}
                            expanded={contentExpanded}
                            toggleReadMore={toggleReadMore}
                        />
                    ) : (
                        <ContentWithLinksAndMentions
                            content={sharedPost?.content || ''}
                            expanded={contentExpanded}
                            toggleReadMore={toggleReadMore}
                            mentions={sharedPost.populatedMentions || []}
                            onHashtagPress={handleHashtagPress}
                        />
                    )}
                </div>

                {/* Reel Rendering */}
                {sharedPost?.postType === 'reel' && (
                    <div className="flex justify-center py-2">
                        <ReelItem
                            reel={sharedPost}
                            onPress={(reel) => {
                                navigate(`/reels/${reel._id}`, {
                                    state: {
                                        sourceMode: 'sharedPost',
                                        initialReelId: reel._id,
                                        reelData: reel
                                    }
                                });
                            }}
                        />
                    </div>
                )}

                {/* Regular Media Rendering (only if not a reel and no background) */}
                {sharedPost?.postType !== 'reel' && !sharedPost?.backgroundColor && sharedPost && sharedPost.media && (
                    <div className='overflow-hidden aspect-auto max-w-xl flex items-center justify-center bg-background'>
                        {width > 540 ?
                            (sharedPost.media.length > 1 ?
                                <PostMediaCarousel media={sharedPost?.media} /> :
                                sharedPost.media[0]?.type == 'video' ?
                                    <AutoPlayVideo handleNavigation={handleNavigation} postId={sharedPost?._id} src={sharedPost?.media && sharedPost?.media[0]?.url} /> :
                                    <img className='object-contain max-h-[400px]' src={sharedPost?.media[0]?.url} alt="" />
                            ) :
                            <PostMediaCarousel mobile={true} media={sharedPost?.media} />
                        }
                    </div>
                )}
            </CardContent>
            <CardFooter className='flex justify-between p-2 font-normal'>
                <div className='flex gap-2 text-sm'>
                    <span className='cursor-pointer'>
                        {sharedPost?.likesCount > 0 && "Likes " + sharedPost?.likesCount}
                    </span>
                    <span className='cursor-pointer'>
                        {sharedPost?.commentsCount > 0 && "Comments " + sharedPost?.commentsCount}
                    </span>
                </div>

                <div className='flex gap-2 text-sm font-normal'>
                    {
                        sharedPost?.sharesCount > 0 &&
                        <span className='relative text-sm whitespace-nowrap cursor-pointer'>
                            {"Shares " + sharedPost?.sharesCount}
                        </span >
                    }
                    {
                        sharedPost?.videoViewsCount > 0 &&
                        <span className='relative text-sm whitespace-nowrap cursor-pointer'>
                            {"Views " + sharedPost?.videoViewsCount}
                        </span >
                    }
                </div>
            </CardFooter>
        </Card>
    );
};

const Post: React.FC<PostProps> = ({ postIndex, pageIndex, postData, model, useLikePost, useBookmarkPost, type, fetchNextPage, self, profile, isAdmin, isSearch, query, scrollRef }) => {
    const [shareState, setShareState] = useState(null)
    const [ref, inView] = useInView()
    const [date, setDate] = useState("")
    const [modelTrigger, setModelTrigger] = useState(false)
    const [confirmModelState, setConfirmModelState] = useState(false)
    const [reportModelState, setReportModelState] = useState(false)
    const [editPostModelState, setEditPostModelState] = useState(false)
    const [_profile, setProfile] = useState(undefined)
    const [fullname, setFullname] = useState(undefined)
    const { user } = useAppSelector((state) => state.user)
    const shareRef = useRef(null)
    const [expanded, setExpanded] = useState(false)
    const [contentExpanded, setContentExpanded] = useState(false)
    const expandable = postData?.content?.slice(0, 360)
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [likesModelState, setLikesModelState] = useState(false)
    const [bottomCommentsState, setBottomCommentsState] = useState(false)

    const { mutate } = useLikePost(isSearch ? query : type + "Posts", postData?.targetId)
    const bookmarkMutation = useBookmarkPost(isSearch ? query : type + "Posts", postData?.targetId, isSearch)
    const updatePost = useUpdatePost(type + "Posts", postData?.targetId)
    const removePost = useRemovePost(type + "Posts", postData?.targetId)

    const toggleReadMore = React.useCallback(() => {
        setContentExpanded(prev => !prev);
    }, []);

    const handleHashtagPress = React.useCallback((hashtag: string) => {
        navigate(`/hashtags-feed/${hashtag}`);
    }, [navigate]);

    const deletePost = async () => {
        removePost.mutate({ postId: postData?._id, postIndex, pageIndex, media: postData?.media, })
        toast.success("Post deleted")
    }

    const _updatePost = async ({ visibility, content, selectedMedia, formData, media, setModelTrigger }) => {
        let _media = media.filter((media) => {
            if (!media?.file) {
                return media
            }
        })

        let postDetails = { visibility, content, media: _media, type, postId: postData._id }
        formData.append("postData", JSON.stringify(postDetails))
        updatePost.mutate({ content, formData, selectedMedia, pageIndex, postIndex, postId: postData?._id, media })
        setModelTrigger(false)
    }

    const dispatch = useDispatch()
    const [postPromotion, setPostPromotion] = useState(false)
    const [width, setWidth] = useState(window.innerWidth)

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth)
        })
    }, [])

    useEffect(() => {
        let viewPost = async () => {
            const { data } = await axiosClient.post("/posts/view", {
                postId: postData?._id,
                type: "promotion"
            })
        }

        if (inView && fetchNextPage) {
            fetchNextPage()
        }

        if (inView && postData?.promotion?.length > 0 && postData?.promotion[0]?.active == 1) {
            // dispatch(insertViewedPost(postData._id))
            // viewPost()
        }
    }, [inView])

    useEffect(() => {
        if (postData) {
            let date = format(postData.createdAt ?? Date.now(), 'MMM d, yyy h:mm a')
            setProfile(postData?.target?.profile)
            setFullname(postData?.firstname + postData?.lastname)
            setDate(date)
        }
    }, [postData]);

    const handleNavigation = () => {
        navigate(`/reels/${postData._id}`, {
            state: {
                sourceMode: 'videosFeed',
                initialReelId: postData._id,
                reelData: {
                    ...postData,
                    _navigationTimestamp: Date.now()
                }
            }
        });
    }

    const videoRef = useRef(null)
    const { isOpen, id, click } = useAppSelector(state => state.postModel)

    useEffect(() => {
        if (isOpen && videoRef.current?.pause && postData._id == id && click == 'comment') {
            videoRef.current.play()
        }

        if (isOpen && videoRef.current?.pause && postData._id == id && click !== 'comment') {
            videoRef.current.pause()
        }
    }, [isOpen, videoRef.current])

    let navigation = postData?.type == "user" ? postData?.target?.username : postData?.target?.handle

    // Check if the post has a shared post
    const hasSharedPost = postData?.sharedPost && Object.keys(postData.sharedPost).length > 0;

    if (postData?.isUploaded == false) {
        return (
            <div className='max-w-xl w-full bg-card flex gap-4 p-3 sm:min-w-[420px]' >
                <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24">
                    <path
                        d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                        stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path
                        d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                        stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    </path>
                </svg>
                Uploading...
            </div>
        )
    }

    const params = isSearch ? { ...query, postId: postData?._id } : { type: type + "Posts", targetId: postData?.targetId, postId: postData?._id }

                                            console.log(postData.target)


    return (
        <div className='max-w-xl w-full sm:min-w-[420px]' ref={ref} key={postData && postData._id}>
            {
                editPostModelState &&
                <CPostModal isShared={true} setModelTrigger={setEditPostModelState} editPost={true} postDetails={postData} updatePost={_updatePost} />
            }
            {searchParams.get("model") == "post" && width > 540 &&
                modelTrigger &&
                <PostModel params={params} useLikePost={useLikePost} useBookmarkPost={useBookmarkPost} postIndex={postIndex} pageIndex={pageIndex} postId={postData?._id} postData={postData} setModelTrigger={setModelTrigger} type={type} />
            }
            {likesModelState &&
                <LikesModel postId={postData?._id} setLikesModelState={setLikesModelState} />
            }

            {
                reportModelState &&
                <ReportModel postId={postData?._id} setModelTrigger={setReportModelState} />
            }

            {
                postPromotion &&
                <PostPromotionModel postId={postData?._id} setPostPromotion={setPostPromotion} />
            }

            {bottomCommentsState && width < 540 &&
                <BottomComments pageIndex={pageIndex} params={params} postData={postData} postId={postData?._id} isOpen={bottomCommentsState} setOpen={setBottomCommentsState} />
            }
            <Card className="w-full border-muted" ref={scrollRef}>
                <CardHeader className='p-3' >
                    <div className='flex items-center justify-between'>
                        <div className='flex gap-2'>
                            {postData.type == 'group'
                                ?
                                <div className='relative'>
                                    <Link to={navigation && `${domain}/${postData?.type}/${navigation}`}>
                                        <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                            <Avatar >
                                                <AvatarImage src={_profile} alt="Avatar" />
                                                <AvatarFallback>{(postData?.target?.name ? (postData?.target?.name[0]?.toUpperCase()) + postData?.target?.name[1]?.toUpperCase() : "D")}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </Link>
                                    <Link to={postData?.user?.username && `${domain}/user/${postData?.user?.username}`}>
                                        <div className='absolute -bottom-1 border border-accent -right-1 bg-accent w-8 h-8 flex items-center justify-center rounded-full overflow-hidden'>
                                            <Avatar >
                                                <AvatarImage src={postData.user.profile} alt="Avatar" />
                                                <AvatarFallback>{(postData?.user?.firstname ? postData?.user?.firstname[0]?.toUpperCase() : "D")}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </Link>
                                </div>
                                :
                                <Link to={navigation && `${domain}/${postData?.type}/${navigation}`}>

                                    <div className='bg-accent w-10 h-10 flex items-center justify-center rounded-full overflow-hidden'>
                                        {postData?.type !== 'user' ?
                                            <Avatar>
                                                <AvatarImage src={_profile} alt="Avatar" />
                                                <AvatarFallback>{(postData?.target?.name ? (postData?.target?.name[0]?.toUpperCase()) + postData?.target?.name[1]?.toUpperCase() : "D")}</AvatarFallback>
                                            </Avatar>
                                            :
                                            <>
                                                {self ?
                                                    <Avatar >
                                                        <AvatarImage src={profile} alt="Avatar" />
                                                        <AvatarFallback>{(postData?.target?.firstname ? (postData?.target?.firstname[0]?.toUpperCase()) + (postData?.target?.lastname && postData?.target?.lastname[0]?.toUpperCase()) : "D")}</AvatarFallback>
                                                    </Avatar> :
                                                    <Avatar >
                                                        <AvatarImage src={_profile} alt="Avatar" />
                                                        <AvatarFallback>{(postData?.target?.firstname ? (postData?.target?.firstname[0]?.toUpperCase()) + (postData?.target?.lastname && postData?.target?.lastname[0]?.toUpperCase()) : "D")}</AvatarFallback>
                                                    </Avatar>
                                                }
                                            </>

                                        }
                                    </div>
                                </Link>

                            }

                            <div className='flex flex-col gap-1'>
                                {postData.type == 'group' ?
                                    <h3 className='text-card-foreground flex gap-2 text-sm'>
                                        <Link to={postData?.user?.username && `${domain}/user/${postData?.user?.username}`}>
                                            {postData?.user?.firstname + " " + postData?.user?.lastname}
                                        </Link>
                                        <Link to={navigation && `${domain}/${postData?.type}/${navigation}`}>
                                            ({postData?.target?.name || "Deleted"})
                                        </Link>
                                    </h3>
                                    :
                                    navigation ?
                                        <Link className='flex gap-2 items-center' to={`${domain}/${postData?.type}/${navigation}`}>

                                            <h3 className='text-card-foreground flex gap-2 text-sm'>{(postData?.target?.firstname ? (postData?.target?.firstname + " " + postData?.target?.lastname) : postData?.target?.name)}{isAdmin && <div className='p-1  bg-primary rounded-md text-xs text-white'>admin</div>}</h3>


                                            <EnvironmentalContributorTag
                                                data={{
                                                    plantation: postData?.target?.environmentalProfile?.['plantation'] && 1,
                                                    garbage_collection: postData?.target?.environmentalProfile?.['garbage_collection'] && 1,
                                                    water_ponds: postData?.target?.environmentalProfile?.['water_ponds'] && 1,
                                                    rain_water: postData?.target?.environmentalProfile?.['rain_water'] && 1,
                                                }}
                                                hideCount={true}
                                            />
                                        </Link>
                                        :
                                        <div className='flex gap-2'>
                                            <h3 className='text-card-foreground flex gap-2 text-sm'>{(postData?.target?.firstname ? (postData?.target?.firstname + " " + postData?.target?.lastname) : postData?.target?.name || 'Deleted')}{isAdmin && <div className='p-1  bg-primary rounded-md text-xs text-white'>admin</div>}</h3>

                                            <EnvironmentalContributorTag
                                                data={{
                                                    plantation: postData?.target?.environmentalProfile?.['plantation'] && 1,
                                                    garbage_collection: postData?.target?.environmentalProfile?.['garbage_collection'] && 1,
                                                    water_ponds: postData?.target?.environmentalProfile?.['water_ponds'] && 1,
                                                    rain_water: postData?.target?.environmentalProfile?.['rain_water'] && 1,
                                                }}
                                                hideCount={true}
                                            />
                                        </div>

                                }
                                <span className='text-muted-foreground text-xs'>{postData?.promotion?.length > 0 ? "sponsored" : date}</span>
                            </div>
                        </div>
                        <DropdownMenuMain deletePost={deletePost} setConfirmModelState={setConfirmModelState} setReportModelState={setReportModelState} reportModelState={reportModelState} postPromotion={postPromotion} setPostPromotion={setPostPromotion} setEditPostModelState={setEditPostModelState} postBy={postData?.user == user._id || postData?.user?._id == user._id} copyPost={() => {
                            navigator.clipboard.writeText(postData.content);
                            toast.info("Post Copied")
                        }} />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-2xl p-0 sm:px-3 font-bold">
                    <div className='text-sm font-normal px-2 sm:px-0'>
                        {/* Background post rendering */}
                        {postData?.backgroundColor ? (
                            <BackgroundPost
                                content={postData.content}
                                backgroundColor={postData.backgroundColor}
                                mentions={postData.mentions || postData.populatedMentions || []}
                                onHashtagPress={handleHashtagPress}
                                expanded={contentExpanded}
                                toggleReadMore={toggleReadMore}
                            />
                        ) : (
                            /* Regular content with links and mentions */
                            <ContentWithLinksAndMentions
                                content={postData?.content || ''}
                                expanded={contentExpanded}
                                toggleReadMore={toggleReadMore}
                                mentions={postData.mentions || postData.populatedMentions || []}
                                onHashtagPress={handleHashtagPress}
                            />
                        )}
                    </div>

                    {/* Media content - only show if no background color or if there are media files */}
                    {(!postData?.backgroundColor || postData?.media?.length > 0) && postData && postData.media && (
                        <div className=' overflow-hidden aspect-auto max-w-xl flex items-center justify-center bg-background' onClick={() => {
                            if (postData?.media?.[0]?.type == 'video') {
                                return
                            }
                            if (!model && width > 540) {
                                dispatch(setOpen({ click: 'comment', id: postData._id }))
                                setModelTrigger(true)
                                if (location.pathname.startsWith('/search')) {
                                    navigate(location.search + "&" + "model=post")
                                    return
                                }
                                navigate("?model=post")
                            }
                        }}>
                            {width > 540 &&
                                <>
                                    {model ?
                                        <PostMediaCarousel media={postData?.media} />
                                        :
                                        postData.media[0]?.type == 'video' ?
                                            <div className="video-container" onClick={() => {
                                                navigate(`/reels/${postData._id}`, {
                                                    state: {
                                                        sourceMode: 'videosFeed',
                                                        initialReelId: postData._id,
                                                        reelData: {
                                                            ...postData,
                                                            _navigationTimestamp: Date.now()
                                                        }
                                                    }
                                                });
                                            }}>
                                                <AutoPlayVideo handleNavigation={handleNavigation} postId={postData?._id} src={postData?.media && postData?.media[0]?.url} />
                                            </div>
                                            :
                                            <img className='object-contain max-h-[500px]' src={postData?.media[0]?.url} alt="" />
                                    }
                                </>
                            }

                            {width < 540 &&
                                <>
                                    <PostMediaCarousel postData={postData} mobile={true} media={postData?.media} />
                                </>
                            }
                        </div>
                    )}

                    {/* Display shared post if it exists */}
                    {hasSharedPost && (
                        <div className="px-2 sm:px-0 my-2">
                            <SharedPostContent
                                sharedPost={postData.sharedPost}
                                handleNavigation={handleNavigation}
                            />
                        </div>
                    )}
                </CardContent>
                <CardFooter className='py-2 gap-2 px-3 md:p-4 select-none flex flex-col'>
                    {postData?.media?.length > 1 &&
                        <div className='flex gap-2 p-2'>
                            {postData?.media.map((_, index) => (
                                <div key={index} className='w-[6px] h-[6px] sm:w-2 sm:h-2 rounded-full bg-foreground'>
                                </div>
                            ))}
                        </div>
                    }
                    <div className='flex  w-full justify-between'>
                        <div className='flex gap-2 items-center w-full'>
                            {postData?.likesCount > 0 && <span className='text-sm cursor-pointer' onClick={() => {
                                setLikesModelState(true)
                            }}>
                                {"Likes " + postData?.likesCount}
                            </span>}
                            {postData?.commentsCount > 0 && <span onClick={() => {
                                if (!model && width > 540) {
                                    dispatch(setOpen({ click: '', id: postData._id }))
                                    navigate("?model=post")
                                    setModelTrigger(true)
                                    return
                                }
                                setBottomCommentsState(true)
                            }} className='text-sm cursor-pointer'>
                                {"Comments " + postData?.commentsCount}
                            </span >}
                        </div>
                        <div className='flex gap-2'>
                            {
                                postData?.sharesCount > 0 &&
                                <span className='relative text-sm whitespace-nowrap cursor-pointer'>
                                    {"Shares " + postData?.sharesCount}
                                </span >
                            }
                            {
                                postData?.videoViewsCount > 0 &&
                                <span className='relative text-sm whitespace-nowrap cursor-pointer'>
                                    {"Views " + postData?.videoViewsCount}
                                </span >
                            }
                        </div>
                    </div>
                    <div className='flex items-center justify-between w-full'>
                        <LikeButton mutate={mutate} pageIndex={pageIndex} postIndex={postIndex} postData={postData} />

                        <div className='flex gap-0 items-center cursor-pointer' onClick={() => {
                            if (!model && width > 540) {
                                dispatch(setOpen({ click: '', id: postData._id }))
                                navigate("?model=post")
                                setModelTrigger(true)
                                return
                            }
                            setBottomCommentsState(true)

                        }}>
                            <div className='flex flex-col items-center justify-center sm:flex-row'>
                                <svg className="w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] stroke-foreground dark:stroke-foreground" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M13.8829 7.91666H24.4517C27.6778 7.94105 30.2735 10.5758 30.2498 13.8019V20.9475C30.2612 22.497 29.6566 23.9876 28.5689 25.0913C27.4812 26.195 25.9996 26.8214 24.4501 26.8327H13.8829L8.08317 30.0833V13.8019C8.07179 12.2524 8.67645 10.7618 9.76412 9.65807C10.8518 8.55436 12.3334 7.92795 13.8829 7.91666Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                                <span className='text-xs sm:text-sm'>Comment</span>

                            </div>
                        </div>
                        <div className='flex gap-0 items-center cursor-pointer' onClick={async () => {
                            bookmarkMutation.mutate({ postId: postData._id, pageIndex, postIndex, targetId: postData?.targetId, type })
                        }}>
                            <div className='flex flex-col sm:flex-row items-center justify-center'>

                                <svg className={`w-[28px] h-[28px] sm:w-[34px] sm:h-[34px] ${postData?.isBookmarkedByUser ? " fill-black dark:fill-white" : "stroke-foreground"} dark:stroke-foreground`} viewBox="0 0 39 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M29.3447 28.1251V8.54816C29.3518 7.79031 29.0222 7.06097 28.4283 6.52057C27.8345 5.98018 27.025 5.67302 26.178 5.66666H13.5113C12.6643 5.67302 11.8548 5.98018 11.261 6.52057C10.6671 7.06097 10.3375 7.79031 10.3447 8.54816V28.1251C10.2694 28.6903 10.5796 29.241 11.1322 29.5231C11.6847 29.8053 12.3724 29.764 12.878 29.4185L18.8947 24.7704C19.437 24.3324 20.2618 24.3324 20.8042 24.7704L26.8113 29.4199C27.3172 29.7657 28.0053 29.8069 28.558 29.5244C29.1108 29.2418 29.4207 28.6906 29.3447 28.1251Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                                <span className='text-xs sm:text-sm'>Bookmark</span>
                            </div>
                        </div>

                        <div className='relative flex gap-0 items-center cursor-pointer'>
                            <div className='flex flex-col gap-[2px] sm:gap-1 sm:flex-row items-center justify-center' onClick={() => {
                                console.log('share clicked')
                                if (!shareState) {
                                    setShareState(true)
                                }
                            }}>
                                <PiShareFatLight className='size-[24px] sm:size-[32px]' strokeWidth={1.2} />

                                <span className='text-xs sm:text-sm' >Share</span>
                            </div>
                            {shareState && width < 640 &&
                                <ShareBottomSheet
                                    isReel={false}
                                    key={'user' + "Posts"}
                                    isOpen={true}
                                    sharedPost={postData}
                                    postId={postData._id}
                                    postType={postData.type}
                                    // handleDownload={downloadVideo}
                                    onClose={() => setShareState(false)}
                                />
                            }

                            {shareState && width >= 640 &&
                                <ShareModal
                                    isReel={false}
                                    key={'user' + "Posts"}
                                    isOpen={true}
                                    sharedPost={postData}
                                    postId={postData._id}
                                    postType={postData.type}
                                    // handleDownload={downloadVideo}
                                    onClose={() => setShareState(false)}
                                />
                            }
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div >
    )

}

export default React.memo(Post)