// import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
// import { X, ImagePlus, Video, Palette, Check, Hash, AtSign, Users, Camera, Play } from 'lucide-react';
// import { useCreatePost, useUpdatePost } from "@/hooks/Post/usePost";
// import { useAppSelector } from "@/app/hooks";
// import { useCreateReel, useUpdateReel } from '@/hooks/Reels/useReels';
// import { fetchUserMentionSuggestions } from './CPostModal';

// // Types and Interfaces
// interface MentionReference {
//   _id: string;
//   username: string;
//   firstname: string;
//   lastname: string;
//   profile: string;
// }

// interface UserSuggestion extends MentionReference {
//   isSpecial?: boolean;
// }

// interface MediaItem {
//   uri: any;
//   fileName: string;
//   mimeType: string;
//   type: string;
//   url?: string;
//   thumbnail?: string;
//   remove?: boolean;
//   file?: File; // Add actual File object for web
// }

// interface PostDetails {
//   _id: string;
//   content: string;
//   media: MediaItem[];
//   mentions: MentionReference[];
//   backgroundColor?: string;
//   type: string;
// }

// interface CreatePostProps {
//   postKey: string;
//   postType: string;
//   targetId?: string;
//   target?: string;
//   edit?: boolean;
//   isVisible: boolean;
//   onClose: () => void;
//   postDetails?: PostDetails;
//   postIndex?: number;
//   pageIndex?: number;
// }

// // Background color options
// const BACKGROUND_COLORS = [
//   { name: 'None', color: null, gradient: null },
//   { name: 'Blue', color: '#4A90E2', gradient: ['#4A90E2', '#357ABD'] },
//   { name: 'Purple', color: '#7B68EE', gradient: ['#7B68EE', '#6A5ACD'] },
//   { name: 'Pink', color: '#FF69B4', gradient: ['#FF69B4', '#FF1493'] },
//   { name: 'Orange', color: '#FF8C42', gradient: ['#FF8C42', '#FF6B35'] },
//   { name: 'Green', color: '#32CD32', gradient: ['#32CD32', '#228B22'] },
//   { name: 'Red', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF5252'] },
//   { name: 'Teal', color: '#20B2AA', gradient: ['#20B2AA', '#008B8B'] },
//   { name: 'Gold', color: '#FFD700', gradient: ['#FFD700', '#FFA500'] },
// ];

// // Text length limits
// const TEXT_LIMITS = {
//   WITH_BACKGROUND: 280,
//   WITHOUT_BACKGROUND: 2000,
// };

// const extractHashtags = (text: string): string[] => {
//   if (!text) return [];
//   const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
//   const hashtags = [];
//   let match;

//   while ((match = hashtagRegex.exec(text)) !== null) {
//     const hashtag = match[1].toLowerCase();
//     if (hashtag && !hashtags.includes(hashtag)) {
//       hashtags.push(hashtag);
//     }
//   }

//   return hashtags;
// };

// // ContentWithLinksAndMentions Component
// const ContentWithLinksAndMentions: React.FC<{
//   content: string;
//   mentions?: MentionReference[];
//   navigation?: any;
//   onHashtagPress?: (hashtag: string) => void;
//   hasBackground?: boolean;
//   expanded?: boolean;
//   toggleReadMore?: () => void;
//   maxLength?: number;
//   showReadMore?: boolean;
// }> = ({
//   content,
//   mentions = [],
//   navigation,
//   onHashtagPress,
//   hasBackground = false,
//   expanded = true,
//   toggleReadMore,
//   maxLength = 150,
//   showReadMore = true,
// }) => {
//   const URL_REGEX = /(?:(?:https?|ftp):\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
//   const MENTION_REGEX = /@(\w+)/g;
//   const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g;

//   const parsedContent = useMemo(() => {
//     if (!content) return [];

//     let displayContent = content;

//     // Replace user IDs with usernames
//     const userIdRegex = /@([a-f\d]{24})/g;
//     let match;
//     const processedIds = new Set();

//     while ((match = userIdRegex.exec(content)) !== null) {
//       const userId = match[1];
//       if (!processedIds.has(userId)) {
//         processedIds.add(userId);
//         const user = mentions.find(u => u._id === userId);
        
//         if (user) {
//           const idRegex = new RegExp(`@${userId}`, 'g');
//           displayContent = displayContent.replace(idRegex, `@${user.username}`);
//         } else {
//           const idRegex = new RegExp(`@${userId}`, 'g');
//           displayContent = displayContent.replace(idRegex, '@deleted-user');
//         }
//       }
//     }

//     const parts = [];
//     let lastIndex = 0;

//     const patterns = [
//       { type: 'url', regex: URL_REGEX },
//       { type: 'mention', regex: MENTION_REGEX },
//       { type: 'hashtag', regex: HASHTAG_REGEX }
//     ];

//     const matches: any[] = [];

//     patterns.forEach(pattern => {
//       const regex = new RegExp(pattern.regex.source, 'gi');
//       let match;

//       while ((match = regex.exec(displayContent)) !== null) {
//         matches.push({
//           type: pattern.type,
//           content: match[0],
//           index: match.index,
//           length: match[0].length,
//           groups: match
//         });
//       }
//     });

//     matches.sort((a, b) => a.index - b.index);

//     matches.forEach(match => {
//       if (match.index > lastIndex) {
//         parts.push({
//           type: 'text',
//           content: displayContent.slice(lastIndex, match.index)
//         });
//       }

//       if (match.type === 'url') {
//         parts.push({
//           type: 'link',
//           content: match.content
//         });
//       } else if (match.type === 'mention') {
//         const username = match.content.slice(1);

//         if (username === 'deleted-user') {
//           parts.push({
//             type: 'text',
//             content: match.content,
//             style: { color: '#999', fontStyle: 'italic' }
//           });
//         } else if (username === 'followers') {
//           parts.push({
//             type: 'special-mention',
//             content: match.content,
//             username: username
//           });
//         } else {
//           const mentionedUser = mentions.find(user => user.username === username);
//           if (mentionedUser) {
//             parts.push({
//               type: 'mention',
//               content: match.content,
//               user: mentionedUser
//             });
//           } else {
//             parts.push({
//               type: 'text',
//               content: match.content
//             });
//           }
//         }
//       } else if (match.type === 'hashtag') {
//         const hashtagName = match.content.slice(1);
//         parts.push({
//           type: 'hashtag',
//           content: match.content,
//           hashtag: hashtagName
//         });
//       }

//       lastIndex = match.index + match.length;
//     });

//     if (lastIndex < displayContent.length) {
//       parts.push({
//         type: 'text',
//         content: displayContent.slice(lastIndex)
//       });
//     }

//     return parts;
//   }, [content, mentions]);

//   const displayContent = useMemo(() => {
//     if (expanded || content.length <= maxLength || !showReadMore) {
//       return parsedContent;
//     } else {
//       let totalLength = 0;
//       let cutoffIndex = 0;

//       for (let i = 0; i < parsedContent.length; i++) {
//         totalLength += parsedContent[i].content.length;
//         if (totalLength >= maxLength) {
//           cutoffIndex = i;
//           break;
//         }
//       }

//       const truncated = parsedContent.slice(0, cutoffIndex + 1);

//       if (truncated.length > 0 && truncated[cutoffIndex].type === 'text') {
//         const lastItem = { ...truncated[cutoffIndex] };
//         const remainingLength = maxLength - (totalLength - lastItem.content.length);
//         lastItem.content = lastItem.content.substring(0, remainingLength) + '...';
//         truncated[cutoffIndex] = lastItem;
//       }

//       return truncated;
//     }
//   }, [parsedContent, expanded, content.length, maxLength, showReadMore]);

//   const handleLinkPress = (url: string) => {
//     let formattedUrl = url;
//     if (!url.startsWith('http://') && !url.startsWith('https://')) {
//       formattedUrl = `https://${url}`;
//     }
//     window.open(formattedUrl, '_blank');
//   };

//   const handleMentionPress = (user: MentionReference) => {
//     if (navigation?.navigate) {
//       navigation.navigate('otherUser', { username: user.username });
//     }
//   };

//   const handleHashtagPress = (hashtag: string) => {
//     if (onHashtagPress) {
//       onHashtagPress(hashtag);
//     } else if (navigation?.navigate) {
//       navigation.navigate('hashtags-feed', { hashtag });
//     }
//   };

//   const hasBackgroundStyles = hasBackground ? 'text-lg font-bold' : '';

//   return (
//     <div className="inline">
//       {displayContent.map((item: any, index: number) => {
//         if (item.type === 'link') {
//           return (
//             <span
//               key={index}
//               className={`cursor-pointer underline text-blue-600 hover:text-blue-800 ${hasBackgroundStyles}`}
//               onClick={() => handleLinkPress(item.content)}
//             >
//               {item.content}
//             </span>
//           );
//         } else if (item.type === 'mention') {
//           return (
//             <span
//               key={index}
//               className={`cursor-pointer font-medium text-blue-600 hover:text-blue-800 ${hasBackgroundStyles}`}
//               onClick={() => handleMentionPress(item.user)}
//             >
//               {item.content}
//             </span>
//           );
//         } else if (item.type === 'special-mention') {
//           return (
//             <span
//               key={index}
//               className={`inline-block px-1 py-0.5 rounded text-blue-600 bg-blue-100 font-semibold ${hasBackgroundStyles}`}
//             >
//               {item.content}
//             </span>
//           );
//         } else if (item.type === 'hashtag') {
//           return (
//             <span
//               key={index}
//               className={`cursor-pointer font-medium underline text-blue-600 hover:text-blue-800 ${hasBackgroundStyles}`}
//               onClick={() => handleHashtagPress(item.hashtag)}
//             >
//               {item.content}
//             </span>
//           );
//         } else {
//           return (
//             <span
//               key={index}
//               className={`text-foreground ${hasBackgroundStyles}`}
//               style={item.style}
//             >
//               {item.content}
//             </span>
//           );
//         }
//       })}

//       {showReadMore && content.length > maxLength && toggleReadMore && (
//         <div
//           className="cursor-pointer font-medium mt-1 inline-block text-blue-600 hover:text-blue-800"
//           onClick={toggleReadMore}
//         >
//           {expanded ? 'Show less' : 'Read more'}
//         </div>
//       )}
//     </div>
//   );
// };

// // BackgroundPost Component
// const BackgroundPost: React.FC<{
//   content: string;
//   backgroundColor: string;
//   containerWidth: number;
//   onPress?: () => void;
//   mentions?: MentionReference[];
//   navigation?: any;
//   ContentWithLinksAndMentions?: React.ComponentType<any>;
//   onHashtagPress?: (hashtag: string) => void;
//   isShared?: boolean;
//   expanded?: boolean;
//   toggleReadMore?: () => void;
// }> = ({
//   content,
//   backgroundColor,
//   containerWidth,
//   onPress,
//   mentions = [],
//   navigation,
//   ContentWithLinksAndMentions,
//   onHashtagPress,
//   isShared = false,
//   expanded = false,
//   toggleReadMore
// }) => {
//   if (!backgroundColor || !content?.trim()) {
//     return null;
//   }

//   const getTextStyle = () => {
//     const textLength = content.length;
//     let fontSize = 24;

//     if (textLength > 200) fontSize = 18;
//     else if (textLength > 150) fontSize = 20;
//     else if (textLength > 100) fontSize = 22;
//     else if (textLength > 50) fontSize = 24;

//     return { fontSize };
//   };

//   const textStyle = getTextStyle();
//   const postHeight = Math.min(Math.max(200, textStyle.fontSize * 8), 400);

//   return (
//     <div
//       className={`relative overflow-hidden cursor-pointer ${isShared ? 'mx-2 my-2' : 'my-1'} flex items-center justify-center`}
//       style={{
//         backgroundColor: backgroundColor,
//         height: postHeight,
//         borderRadius: '8px'
//       }}
//       onClick={onPress}
//     >
//       <div className="flex-1 flex items-center justify-center z-10 w-full px-5 py-5">
//         <div
//           className="text-center font-bold text-white text-shadow"
//           style={{ fontSize: textStyle.fontSize, lineHeight: textStyle.fontSize * 1.3 }}
//         >
//           {ContentWithLinksAndMentions ? (
//             <ContentWithLinksAndMentions
//               content={content}
//               hasBackground={true}
//               expanded={expanded}
//               toggleReadMore={toggleReadMore || (() => {})}
//               mentions={mentions}
//               navigation={navigation}
//               onHashtagPress={onHashtagPress}
//             />
//           ) : (
//             <span style={{ fontSize: textStyle.fontSize, lineHeight: textStyle.fontSize * 1.3 }}>
//               {content}
//             </span>
//           )}
//         </div>
//       </div>

//       <div
//         className="absolute inset-0 z-0 opacity-10"
//         style={{ backgroundColor: `${backgroundColor}22` }}
//       />
//     </div>
//   );
// };

// // MentionsInput Component
// const MentionsInput: React.FC<{
//   value: string;
//   onChangeText: (text: string, mentionUserIds: string[], mentionReferences: MentionReference[]) => void;
//   placeholder?: string;
//   style?: any;
//   textColor?: string;
//   backgroundColor?: string;
//   multiline?: boolean;
//   numberOfLines?: number;
//   maxHeight?: number;
//   onSuggestionsFetch?: (query: string) => Promise<UserSuggestion[]>;
//   suggestionsPosition?: 'top' | 'bottom' | 'auto';
//   initialReferences?: MentionReference[];
// }> = ({
//   value,
//   onChangeText,
//   placeholder,
//   style,
//   textColor,
//   backgroundColor,
//   multiline = true,
//   numberOfLines = 8,
//   maxHeight = 160,
//   onSuggestionsFetch,
//   suggestionsPosition = 'auto',
//   initialReferences = [],
// }) => {
//   const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [currentMentionQuery, setCurrentMentionQuery] = useState('');
//   const [mentionStartIndex, setMentionStartIndex] = useState(-1);
//   const [cursorPosition, setCursorPosition] = useState(0);
//   const [mentionReferences, setMentionReferences] = useState<MentionReference[]>(initialReferences);
//   const [displayText, setDisplayText] = useState(value);
//   const [internalText, setInternalText] = useState(value);

//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const convertDisplayToInternal = useCallback((display: string, references: MentionReference[]): string => {
//     let internal = display;
    
//     const sortedRefs = [...references].sort((a, b) => {
//       const aPos = display.indexOf(`@${a.username}`);
//       const bPos = display.indexOf(`@${b.username}`);
//       return bPos - aPos;
//     });

//     for (const ref of sortedRefs) {
//       const usernameRegex = new RegExp(`@${ref.username}\\b`, 'g');
//       internal = internal.replace(usernameRegex, `@${ref._id}`);
//     }

//     return internal;
//   }, []);

//   const convertInternalToDisplay = useCallback((internal: string, references: MentionReference[]): string => {
//     let display = internal;
    
//     for (const ref of references) {
//       const userIdRegex = new RegExp(`@${ref._id}`, 'g');
//       display = display.replace(userIdRegex, `@${ref.username}`);
//     }

//     return display;
//   }, []);

//   const fetchSuggestions = useCallback(async (query: string) => {
//     if (debounceTimeoutRef.current) {
//       clearTimeout(debounceTimeoutRef.current);
//     }

//     debounceTimeoutRef.current = setTimeout(async () => {
//       if (query.length >= 0 && onSuggestionsFetch) {
//         try {
//           const userResults = await onSuggestionsFetch(query);
          
//           const followersOption = {
//             _id: 'followers',
//             username: 'followers',
//             firstname: 'All',
//             lastname: 'Followers',
//             profile: '',
//             isSpecial: true
//           };

//           const shouldShowFollowers = query === '' || 'followers'.toLowerCase().includes(query.toLowerCase());
          
//           const allSuggestions = shouldShowFollowers 
//             ? [followersOption, ...userResults]
//             : userResults;

//           setSuggestions(allSuggestions);
//         } catch (error) {
//           console.error('Error fetching suggestions:', error);
//           setSuggestions([]);
//         }
//       } else {
//         setSuggestions([]);
//       }
//     }, 300);
//   }, [onSuggestionsFetch]);

//   useEffect(() => {
//     if (value) {
//       const referencesToUse = mentionReferences.length > 0 ? mentionReferences : initialReferences;
      
//       if (referencesToUse.length > 0) {
//         const display = convertInternalToDisplay(value, referencesToUse);
//         setDisplayText(display);
//         setInternalText(value);
        
//         if (mentionReferences.length === 0 && initialReferences.length > 0) {
//           setMentionReferences(initialReferences);
//         }
//       } else {
//         setDisplayText(value);
//         setInternalText(value);
//       }
//     } else {
//       setDisplayText('');
//       setInternalText('');
//       setMentionReferences([]);
//     }
//   }, [value, initialReferences, mentionReferences, convertInternalToDisplay]);

//   const handleTextChange = (text: string) => {
//     setDisplayText(text);

//     let mentionStart = -1;
//     for (let i = cursorPosition - 1; i >= 0; i--) {
//       if (text[i] === '@') {
//         if (i === 0 || /\s/.test(text[i - 1])) {
//           mentionStart = i;
//           break;
//         }
//       } else if (/\s/.test(text[i])) {
//         break;
//       }
//     }

//     if (mentionStart !== -1) {
//       const mentionEnd = cursorPosition;
//       const mentionText = text.substring(mentionStart + 1, mentionEnd);

//       if (!mentionText.includes(' ') && mentionText.length >= 0) {
//         setCurrentMentionQuery(mentionText);
//         setMentionStartIndex(mentionStart);
//         setShowSuggestions(true);
//         fetchSuggestions(mentionText);
//       } else {
//         setShowSuggestions(false);
//         setSuggestions([]);
//       }
//     } else {
//       setShowSuggestions(false);
//       setSuggestions([]);
//     }

//     const internal = convertDisplayToInternal(text, mentionReferences);
//     setInternalText(internal);

//     const userIdRegex = /@([a-f\d]{24})/g;
//     const foundUserIds: string[] = [];
//     const activeReferences: MentionReference[] = [];
//     let match;

//     while ((match = userIdRegex.exec(internal)) !== null) {
//       const userId = match[1];
//       if (!foundUserIds.includes(userId)) {
//         foundUserIds.push(userId);
//         const existingRef = mentionReferences.find(ref => ref._id === userId);
//         if (existingRef) {
//           activeReferences.push(existingRef);
//         }
//       }
//     }

//     if (foundUserIds.length !== mentionReferences.length || 
//         !foundUserIds.every(id => mentionReferences.some(ref => ref._id === id))) {
//       setMentionReferences(activeReferences);
//     }

//     onChangeText(internal, foundUserIds, activeReferences);
//   };

//   const handleSuggestionPress = (suggestion: UserSuggestion) => {
//     if (suggestion.isSpecial) {
//       const mentionText = `@${suggestion.username}`;
//       const beforeMention = displayText.substring(0, mentionStartIndex);
//       const afterMention = displayText.substring(cursorPosition);
//       const newText = beforeMention + mentionText + ' ' + afterMention;

//       setShowSuggestions(false);
//       setSuggestions([]);
//       setCurrentMentionQuery('');
//       setMentionStartIndex(-1);

//       const newCursorPosition = beforeMention.length + mentionText.length + 1;
//       setCursorPosition(newCursorPosition);

//       setDisplayText(newText);
//       setInternalText(newText);

//       const userIdRegex = /@([a-f\d]{24})/g;
//       const foundUserIds: string[] = [];
//       const activeReferences: MentionReference[] = [];
//       let match;

//       while ((match = userIdRegex.exec(newText)) !== null) {
//         const userId = match[1];
//         if (!foundUserIds.includes(userId)) {
//           foundUserIds.push(userId);
//           const existingRef = mentionReferences.find(ref => ref._id === userId);
//           if (existingRef) {
//             activeReferences.push(existingRef);
//           }
//         }
//       }

//       setMentionReferences(activeReferences);
//       onChangeText(newText, foundUserIds, activeReferences);

//       setTimeout(() => {
//         textareaRef.current?.focus();
//       }, 100);
      
//       return;
//     }

//     const displayMentionText = `@${suggestion.username}`;
//     const beforeMentionDisplay = displayText.substring(0, mentionStartIndex);
//     const afterMentionDisplay = displayText.substring(cursorPosition);
//     const newDisplayText = beforeMentionDisplay + displayMentionText + ' ' + afterMentionDisplay;

//     const internalMentionText = `@${suggestion._id}`;
//     const beforeMention = internalText.substring(0, mentionStartIndex);
//     const afterMention = internalText.substring(cursorPosition);
//     const newInternalText = beforeMention + internalMentionText + ' ' + afterMention;

//     const newReference: MentionReference = suggestion;
//     const updatedReferences = mentionReferences.filter(ref => ref._id !== suggestion._id);
//     updatedReferences.push(newReference);

//     setShowSuggestions(false);
//     setSuggestions([]);
//     setCurrentMentionQuery('');
//     setMentionStartIndex(-1);

//     const newCursorPosition = beforeMentionDisplay.length + displayMentionText.length + 1;
//     setCursorPosition(newCursorPosition);

//     setDisplayText(newDisplayText);
//     setInternalText(newInternalText);
//     setMentionReferences(updatedReferences);

//     const userIdRegex = /@([a-f\d]{24})/g;
//     const finalUserIds: string[] = [];
//     let match;

//     while ((match = userIdRegex.exec(newInternalText)) !== null) {
//       const userId = match[1];
//       if (!finalUserIds.includes(userId)) {
//         finalUserIds.push(userId);
//       }
//     }

//     onChangeText(newInternalText, finalUserIds, updatedReferences);

//     setTimeout(() => {
//       textareaRef.current?.focus();
//     }, 100);
//   };

//   const handleSelectionChange = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
//     const target = event.target as HTMLTextAreaElement;
//     setCursorPosition(target.selectionStart);
//   };

//   return (
//     <div className="relative">
//       <textarea
//         ref={textareaRef}
//         value={displayText}
//         onChange={(e) => handleTextChange(e.target.value)}
//         onSelect={handleSelectionChange}
//         placeholder={placeholder}
//         className="w-full p-3 rounded-lg border border-border bg-card text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-card dark:text-foreground dark:border-border"
//         style={{
//           backgroundColor: backgroundColor,
//           color: textColor,
//           maxHeight: maxHeight,
//           ...style
//         }}
//         rows={numberOfLines}
//       />

//       {showSuggestions && suggestions.length > 0 && (
//         <div className="absolute z-50 w-full bg-card dark:bg-card border border-border dark:border-border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
//           {suggestions.map((suggestion, index) => (
//             <div
//               key={`${suggestion._id}-${index}`}
//               className="flex items-center px-4 py-3 hover:bg-muted dark:hover:bg-muted cursor-pointer border-b border-border dark:border-border last:border-b-0"
//               onClick={() => handleSuggestionPress(suggestion)}
//             >
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
//                 suggestion.isSpecial ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
//               }`}>
//                 {suggestion.isSpecial ? <Users size={16} /> : suggestion.username.charAt(0).toUpperCase()}
//               </div>
//               <div className="flex-1">
//                 <div className={`font-medium ${suggestion.isSpecial ? 'text-blue-600' : 'text-foreground dark:text-foreground'}`}>
//                   @{suggestion.username}
//                 </div>
//                 <div className={`text-xs ${suggestion.isSpecial ? 'text-blue-500 italic' : 'text-muted-foreground dark:text-muted-foreground'}`}>
//                   {suggestion.isSpecial ? 'Mention all your followers' : `${suggestion.firstname} ${suggestion.lastname}`}
//                 </div>
//               </div>
//               {suggestion.isSpecial && (
//                 <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
//                   Special
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // Main CreatePost Component
// const CreatePost: React.FC<CreatePostProps> = ({
//   postKey,
//   postType,
//   targetId,
//   target,
//   edit = false,
//   isVisible,
//   onClose,
//   postDetails,
//   postIndex,
//   pageIndex,
// }) => {
//   const { userData } = useAppSelector((state: any) => state.user);
  
//   const [inputText, setInputText] = useState(edit ? postDetails?.content ?? "" : "");
//   const [mentionUserIds, setMentionUserIds] = useState<string[]>(edit ? postDetails?.mentions?.map((m: any) => m._id) ?? [] : []);
//   const [mentionReferences, setMentionReferences] = useState<MentionReference[]>(edit ? postDetails?.mentions ?? [] : []);
//   const [extractedHashtags, setExtractedHashtags] = useState<string[]>([]);
//   const [selectedBackground, setSelectedBackground] = useState(
//     edit ? (postDetails?.backgroundColor ? BACKGROUND_COLORS.find(bg => bg.color === postDetails.backgroundColor) : BACKGROUND_COLORS[0]) : BACKGROUND_COLORS[0]
//   );
//   const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
//   const [media, setMedia] = useState<MediaItem[]>(edit ? postDetails?.media ?? [] : []);
//   const [expanded, setExpanded] = useState(false);

//   // Email modal states (for compatibility with mobile version)
//   const [emailModalVisible, setEmailModalVisible] = useState(true);
//   const [changeEmailModal, setChangeEmailModal] = useState(true);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const videoInputRef = useRef<HTMLInputElement>(null);

//   // Hooks
//   const createPost = useCreatePost(postKey, targetId);
//   const updatePost = useUpdatePost(postKey, targetId);
//   const createReel = useCreateReel(postKey, targetId);
//   const updateReel = useUpdateReel(postType, postKey, targetId);

//   // Initialize mention references for edit mode
//   useEffect(() => {
//     if (edit && postDetails?.mentions) {
//       const references: MentionReference[] = postDetails.mentions.map((user: any) => ({
//         _id: user._id,
//         username: user.username,
//         firstname: user.firstname,
//         lastname: user.lastname,
//         profile: user.profile
//       }));
//       setMentionReferences(references);
//     }
//   }, [edit, postDetails]);

//   // Request permissions when modal opens (Web equivalent - no-op for compatibility)
//   useEffect(() => {
//     if (isVisible) {
//       (async () => {
//         try {
//           // Web browsers handle file permissions automatically
//           // This effect exists for mobile compatibility
//           console.log('Modal opened - file permissions handled by browser');
//         } catch (error) {
//           console.error('Permission request error:', error);
//         }
//       })();
//     }
//   }, [isVisible]);

//   // Extract hashtags whenever text changes
//   useEffect(() => {
//     const hashtags = extractHashtags(inputText);
//     setExtractedHashtags(hashtags);
//   }, [inputText]);

//   // Reset background when media is added
//   useEffect(() => {
//     if (media.length > 0 && selectedBackground.color) {
//       setSelectedBackground(BACKGROUND_COLORS[0]);
//     }
//   }, [media.length]);

//   const isReelContent = () => {
//     return media.length === 1 && media[0].type === 'video';
//   };

//   const canUseBackground = () => {
//     return media.length === 0;
//   };

//   const getCurrentTextLimit = () => {
//     return selectedBackground.color && canUseBackground() ? TEXT_LIMITS.WITH_BACKGROUND : TEXT_LIMITS.WITHOUT_BACKGROUND;
//   };

//   const getPlaceholderText = () => {
//     if (selectedBackground.color && canUseBackground()) {
//       return "Share your thoughts... (max 280 characters)";
//     }
//     return "What's on your mind? Type @ to mention a user or # to add hashtags...";
//   };

//   const getHeaderText = () => {
//     if (edit) {
//       return "Update Post";
//     }
//     return "Create Post";
//   };

//   const handleClosePress = useCallback(() => {
//     if (onClose) {
//       onClose();
//     }
//   }, [onClose]);

//   const handleMentionsChange = (text: string, userIds: string[], references: MentionReference[]) => {
//     const textLimit = getCurrentTextLimit();

//     if (text.length <= textLimit) {
//       setInputText(text);
//       setMentionUserIds(userIds);
//       setMentionReferences(references);
//     } else {
//       alert(`Text limit exceeded! Maximum ${textLimit} characters allowed.`);
//     }
//   };

//   const handleFetchUserSuggestions = async (query: string): Promise<UserSuggestion[]> => {
//     try {
//       const results = await fetchUserMentionSuggestions(query);
//       return results;
//     } catch (error) {
//       console.error('Error fetching user suggestions:', error);
//       return [];
//     }
//   };

//   const handleBackgroundSelect = (background: any) => {
//     if (!canUseBackground() && background.color) {
//       alert("Remove media to use background colors");
//       return;
//     }

//     setSelectedBackground(background);

//     if (background.color) {
//       const limit = TEXT_LIMITS.WITH_BACKGROUND;
//       if (inputText.length > limit) {
//         const trimmedText = inputText.substring(0, limit);
//         setInputText(trimmedText);
//         alert(`Text trimmed to ${limit} characters for background post`);
//       }
//     }

//     setShowBackgroundPicker(false);
//   };

//   const handleFileSelect = (files: FileList | null, type: string) => {
//     if (!files) return;

//     Array.from(files).forEach(file => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const newMedia: MediaItem = {
//           uri: e.target?.result as string,
//           fileName: file.name,
//           mimeType: file.type,
//           type: type,
//           file: file, // Store actual File object for web FormData
//         };

//         if (type === 'video') {
//           setMedia([newMedia]);
//         } else {
//           setMedia(prev => [...prev, newMedia]);
//         }
//       };
//       reader.readAsDataURL(file);
//     });
//   };

//   const handleRemoveMedia = (index: number) => {
//     const updatedMedia = [...media];
//     if (updatedMedia[index]?.url) {
//       const targetUrl = updatedMedia[index].url;

//       const updatedPostMedia = postDetails?.media?.map(mediaItem =>
//         mediaItem.url === targetUrl
//           ? { ...mediaItem, remove: true }
//           : mediaItem
//       );

//       if (postDetails) {
//         postDetails.media = updatedPostMedia;
//       }
//     }
//     updatedMedia.splice(index, 1);
//     setMedia(updatedMedia);
//   };

//   const _createPost = async () => {
//     if (media.length === 0 && inputText.trim().length < 1) {
//       alert("Please write something or add media");
//       return;
//     }

//     const isCreatingReel = isReelContent();

//     try {
//       let formData: any = new FormData();

//       // Add files to FormData (web approach)
//       if (media.length > 0) {
//         if (isCreatingReel) {
//           if (media[0].file) {
//             formData.append('file', media[0].file);
//           }
//         } else {
//           media.forEach(item => {
//             if (item.file) {
//               formData.append('files', item.file);
//             }
//           });
//         }
//       }

//       const postData = {
//         visibility: 'public',
//         content: inputText.trim(),
//         selectedMedia: media,
//         mentions: mentionUserIds,
//         mentionReferences,
//         hashtags: extractedHashtags,
//         formData,
//         type: postType,
//         target,
//         isUploaded: false,
//         ...(selectedBackground.color && media.length === 0 && { backgroundColor: selectedBackground.color })
//       };

//       if (isCreatingReel) {
//         createReel.mutate(postData);
//       } else {
//         createPost.mutate(postData);
//       }

//       setMedia([]);
//       setMentionUserIds([]);
//       setMentionReferences([]);
//       setExtractedHashtags([]);
//       setSelectedBackground(BACKGROUND_COLORS[0]);
//     } catch (error) {
//       console.error(error);
//     }
//     setInputText("");
//     handleClosePress();
//   };

//   const _updatePost = async () => {
//     if (media.length === 0 && inputText.trim().length < 1) {
//       alert("Please write something or add media");
//       return;
//     }

//     try {
//       let formData: any = new FormData();

//       const isUpdatingReel = isReelContent();

//       // Add files to FormData (web approach)
//       if (media.length > 0) {
//         if (isUpdatingReel) {
//           media.forEach(item => {
//             if (item.file) {
//               formData.append("file", item.file);
//             }
//           });
//         } else {
//           media.forEach(item => {
//             if (item.file) {
//               formData.append("files", item.file);
//             }
//           });
//         }
//       }

//       if (isUpdatingReel) {
//         const updateData = {
//           visibility: "public",
//           content: inputText,
//           formData,
//           selectedMedia: media,
//           media: postDetails?.media,
//           postId: postDetails?._id,
//           mentions: mentionUserIds,
//           hashtags: extractedHashtags,
//         };

//         updateReel.mutate(updateData);

//         setMedia([]);
//         setMentionUserIds([]);
//         setMentionReferences([]);
//         setExtractedHashtags([]);
//         setSelectedBackground(BACKGROUND_COLORS[0]);
//         setInputText("");
//         onClose();
//         return;
//       } else {
//         const updateData = {
//           visibility: "public",
//           content: inputText.trim(),
//           formData,
//           selectedMedia: media,
//           media: postDetails?.media,
//           postId: postDetails?._id,
//           pageIndex: pageIndex || 0,
//           postIndex: postIndex || 0,
//           mentions: mentionUserIds,
//           hashtags: extractedHashtags,
//           ...(selectedBackground.color && media.length === 0 && { backgroundColor: selectedBackground.color })
//         };

//         updatePost.mutate(updateData);
//       }

//       setMedia([]);
//       setMentionUserIds([]);
//       setMentionReferences([]);
//       setExtractedHashtags([]);
//       setSelectedBackground(BACKGROUND_COLORS[0]);
//     } catch (error) {
//       console.error(error);
//     }
//     setInputText("");
//     onClose();
//   };

//   // Display hashtags in a readable format
//   const displayHashtags = useMemo(() => {
//     if (extractedHashtags.length === 0) return '';
//     return extractedHashtags.map(tag => `#${tag}`).join(', ');
//   }, [extractedHashtags]);

//   const hasVideo = media?.some(item => item.type === 'video');

//   if (!isVisible) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-card dark:bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border dark:border-border">
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
//           <button
//             onClick={handleClosePress}
//             className="p-2 hover:bg-muted dark:hover:bg-muted rounded-full transition-colors"
//           >
//             <X size={20} className="text-foreground dark:text-foreground" />
//           </button>
//           <h2 className="text-lg font-semibold text-foreground dark:text-foreground">
//             {getHeaderText()}
//           </h2>
//           <div className="w-8" />
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
//           {/* Email Modal - Web equivalent (commented out as not typically needed for web) */}
//           {/* {(!userData?.email && emailModalVisible && changeEmailModal) && (
//             <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//               <ChangeEmailModal 
//                 notice={true}
//                 setModal={setEmailModalVisible}
//                 setModalTrigger={setChangeEmailModal}
//               />
//             </div>
//           )} */}

//           {/* Text Input */}
//           <MentionsInput
//             value={inputText}
//             onChangeText={handleMentionsChange}
//             placeholder={getPlaceholderText()}
//             style={{ minHeight: '120px' }}
//             textColor="hsl(var(--foreground))"
//             backgroundColor="hsl(var(--card))"
//             multiline={true}
//             numberOfLines={8}
//             maxHeight={160}
//             onSuggestionsFetch={handleFetchUserSuggestions}
//             suggestionsPosition="auto"
//             initialReferences={edit ? (postDetails?.mentions?.map((user: any) => ({
//               _id: user._id,
//               username: user.username,
//               firstname: user.firstname,
//               lastname: user.lastname,
//               profile: user.profile
//             })) || []) : []}
//           />

//           {/* Character Count */}
//           <div className="flex justify-end">
//             <span
//               className={`text-sm ${inputText.length > getCurrentTextLimit() * 0.9 ? 'text-red-500' : 'text-muted-foreground'}`}
//             >
//               {inputText.length}/{getCurrentTextLimit()}
//             </span>
//           </div>

//           {/* Text Preview for Background Posts */}
//           {selectedBackground.color && canUseBackground() && (
//             <BackgroundPost
//               content={inputText || "Your text will appear here..."}
//               backgroundColor={selectedBackground.color}
//               containerWidth={800}
//               onPress={() => { }}
//               mentions={mentionReferences}
//               navigation={undefined}
//               ContentWithLinksAndMentions={ContentWithLinksAndMentions}
//               onHashtagPress={undefined}
//               isShared={false}
//               expanded={expanded}
//               toggleReadMore={() => setExpanded(!expanded)}
//             />
//           )}

//           {/* Background Color Picker */}
//           {canUseBackground() && (
//             <div className="space-y-2">
//               <button
//                 className="flex items-center gap-2 p-3 border border-border rounded-lg w-full hover:bg-muted dark:hover:bg-muted transition-colors bg-card dark:bg-card"
//                 onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
//               >
//                 <Palette size={20} className="text-blue-600" />
//                 <span className="flex-1 text-left text-foreground dark:text-foreground">
//                   Background: {selectedBackground.name}
//                 </span>
//                 <div
//                   className="w-6 h-6 rounded-full border border-border"
//                   style={{
//                     backgroundColor: selectedBackground.color || 'hsl(var(--border))'
//                   }}
//                 />
//               </button>

//               {showBackgroundPicker && (
//                 <div className="flex gap-2 overflow-x-auto p-2">
//                   {BACKGROUND_COLORS.map((bg, index) => (
//                     <button
//                       key={index}
//                       className={`w-12 h-12 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
//                         selectedBackground.name === bg.name ? 'border-blue-500' : 'border-border'
//                       }`}
//                       style={{ backgroundColor: bg.color || 'hsl(var(--card))' }}
//                       onClick={() => handleBackgroundSelect(bg)}
//                     >
//                       {!bg.color && (
//                         <span className="text-xs font-semibold text-foreground dark:text-foreground">
//                           None
//                         </span>
//                       )}
//                       {selectedBackground.name === bg.name && (
//                         <Check size={16} color="white" />
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Display current mentions count */}
//           {/* {mentionUserIds.length > 0 && (
//             <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
//               <div className="flex items-center gap-2">
//                 <AtSign size={16} className="text-blue-600" />
//                 <span className="text-sm text-foreground dark:text-foreground">
//                   {mentionUserIds.length} user{mentionUserIds.length !== 1 ? 's' : ''} mentioned: {mentionReferences.map(ref => `@${ref.username}`).join(', ')}
//                 </span>
//               </div>
//             </div>
//           )} */}

//           {/* Display current hashtags */}
//           {/* {extractedHashtags.length > 0 && (
//             <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded">
//               <div className="flex items-center gap-2">
//                 <Hash size={16} className="text-purple-600" />
//                 <span className="text-sm text-foreground dark:text-foreground">
//                   {extractedHashtags.length} hashtag{extractedHashtags.length !== 1 ? 's' : ''}: {displayHashtags}
//                 </span>
//               </div>
//             </div>
//           )} */}

//           {/* Media Display */}
//           {media.length > 0 && (
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//               {media.map((item, index) => (
//                 <div key={index} className="relative group">
//                   <button
//                     className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 z-10 hover:bg-opacity-80 transition-opacity"
//                     onClick={() => handleRemoveMedia(index)}
//                   >
//                     <X size={16} />
//                   </button>

//                   {item.type === 'video' && (
//                     <div className="absolute inset-0 flex items-center justify-center z-5">
//                       <div className="bg-black bg-opacity-60 rounded-full p-2">
//                         <Play className="text-white" size={20} />
//                       </div>
//                     </div>
//                   )}

//                   <img
//                     src={item.thumbnail || item.url || item.uri}
//                     alt="Media preview"
//                     className="w-full h-32 object-cover rounded-lg"
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Media Selection Buttons */}
//           <div className="flex gap-3 justify-center">
//             {(!postDetails?.media?.[0] || postDetails.media[0].type !== 'video') && (
//               <button
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   hasVideo 
//                     ? 'bg-muted text-muted-foreground cursor-not-allowed' 
//                     : 'bg-blue-500 text-white hover:bg-blue-600'
//                 }`}
//                 onClick={() => !hasVideo && fileInputRef.current?.click()}
//                 disabled={hasVideo}
//               >
//                 <ImagePlus size={20} />
//                 Images
//               </button>
//             )}

//             {(!postDetails?.media?.[0] || postDetails.media[0].type !== 'image') && (
//               <button
//                 className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//                 onClick={() => videoInputRef.current?.click()}
//               >
//                 <Video size={20} />
//                 Video
//               </button>
//             )}
//           </div>

//           {/* Hidden file inputs */}
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             multiple
//             className="hidden"
//             onChange={(e) => handleFileSelect(e.target.files, 'image')}
//           />
//           <input
//             ref={videoInputRef}
//             type="file"
//             accept="video/*"
//             className="hidden"
//             onChange={(e) => handleFileSelect(e.target.files, 'video')}
//           />
//         </div>

//         {/* Footer */}
//         <div className="border-t border-border dark:border-border p-4">
//           <button
//             onClick={() => {
//               if (edit) {
//                 _updatePost();
//                 return;
//               }
//               _createPost();
//             }}
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
//           >
//             {edit ? "Update" : "Create Post"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreatePost;