// // src/components/Reels/ReelOverlayUI.tsx
// import React from 'react';
// import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
// import { Link } from 'react-router-dom'; // Assuming react-router
// import { format } from 'date-fns'; // Reusing date-fns

// // Import your existing icons or use new ones
// import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Eye } from 'lucide-react'; // Example icons

// interface ReelOverlayUIProps {
//     reelData: any; // Use the ReelData interface from useReelsFeed
//     onLikeClick: () => void;
//     onCommentClick: () => void;
//     onShareClick: () => void;
//     onBookmarkClick: () => void;
//     onDotsClick: () => void; // For the 3-dots menu
// }

// const ReelOverlayUI: React.FC<ReelOverlayUIProps> = ({
//     reelData,
//     onLikeClick,
//     onCommentClick,
//     onShareClick,
//     onBookmarkClick,
//     onDotsClick,
// }) => {
//     const [expanded, setExpanded] = React.useState(false);
//     const expandableContent = reelData?.content?.slice(0, 150); // Shorter for Reels caption

//     let navigation = reelData?.user?.username; // Assuming user type for simplicity

//     // Reuse date formatting logic if needed, though less common for timestamp on Reels feed
//     // const formattedDate = format(reelData.createdAt ?? Date.now(), 'MMM d, yyy h:mm a');

//     return (
//         <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 text-white pointer-events-none">
//             {/* Gradient Overlay for readability */}
//             <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

//             {/* Content Area (Profile, Caption, Audio) */}
//             <div className="relative flex items-end justify-between pointer-events-auto">
//                  <div className="flex flex-col gap-2 mb-4">
//                      {/* Profile Info */}
//                      <Link to={navigation ? `/user/${navigation}` : '#'} className="flex items-center gap-2 pointer-events-auto">
//                          <Avatar className="w-10 h-10">
//                              <AvatarImage src={reelData?.user?.profile} alt="Avatar" />
//                              <AvatarFallback>{(reelData?.user?.firstname?.[0]?.toUpperCase() || '') + (reelData?.user?.lastname?.[0]?.toUpperCase() || '')}</AvatarFallback>
//                          </Avatar>
//                          <span className="font-semibold text-lg drop-shadow">{reelData?.user?.username}</span> {/* Or full name */}
//                      </Link>

//                      {/* Caption */}
//                      {reelData?.content && (
//                          <div className="text-sm drop-shadow max-w-xs">
//                             {expanded ?
//                                  <p style={{ whiteSpace: "pre-wrap" }} className='break-words'>
//                                      {reelData.content}
//                                  </p>
//                                  :
//                                  <p style={{ whiteSpace: "pre-wrap" }} className='break-words'>
//                                      {expandableContent}
//                                      {reelData.content.length > 150 && <>...{' '} <span className='text-gray-300 text-xs cursor-pointer pointer-events-auto' onClick={() => setExpanded(true)}>Show more</span></>}
//                                  </p>
//                             }
//                          </div>
//                      )}

//                      {/* Optional: Audio Source Info */}
//                      {/* <div className="flex items-center gap-1 text-xs drop-shadow">
//                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
//                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.442-1.442L13.5 18l1.183-.394a2.25 2.25 0 0 0 1.442-1.442L16.5 15.75l.394 1.183a2.25 2.25 0 0 0 1.442 1.442L20.5 18l-1.183.394a2.25 2.25 0 0 0-1.442 1.442Z" />
//                          </svg>
//                          <span className=''>Original audio by {reelData?.audioSource || 'user'}</span>
//                      </div> */}
//                  </div>


//                  {/* Action Buttons (Vertical Stack) */}
//                  <div className="flex flex-col items-center gap-4 mb-4 pointer-events-auto">
//                      <div className="flex flex-col items-center cursor-pointer" onClick={onLikeClick}>
//                          <Heart className={`w-8 h-8 ${reelData?.isLikedByUser ? 'fill-red-500 stroke-red-500' : 'stroke-white'}`} strokeWidth={1.5} />
//                          <span className="text-xs drop-shadow">{reelData?.likesCount || 0}</span>
//                      </div>
//                      <div className="flex flex-col items-center cursor-pointer" onClick={onCommentClick}>
//                          <MessageCircle className="w-8 h-8 stroke-white" strokeWidth={1.5} />
//                          <span className="text-xs drop-shadow">{reelData?.commentsCount || 0}</span>
//                      </div>
//                      <div className="flex flex-col items-center cursor-pointer" onClick={onShareClick}>
//                          <Share2 className="w-8 h-8 stroke-white" strokeWidth={1.5} />
//                          <span className="text-xs drop-shadow">{reelData?.sharesCount || 0}</span> {/* Shares on profile/feed count */}
//                      </div>
//                       <div className="flex flex-col items-center cursor-pointer" onClick={onBookmarkClick}>
//                          <Bookmark className={`w-8 h-8 ${reelData?.isBookmarkedByUser ? 'fill-white stroke-white' : 'stroke-white'}`} strokeWidth={1.5} />
//                          {/* Bookmark count is less common on the main feed */}
//                          {/* <span className="text-xs drop-shadow">{reelData?.bookmarksCount || 0}</span> */}
//                      </div>
//                      <div className="flex flex-col items-center cursor-pointer" onClick={onDotsClick}>
//                          <MoreVertical className="w-8 h-8 stroke-white" strokeWidth={1.5} />
//                      </div>
//                  </div>
//             </div>

//              {/* Views Count (Can be positioned elsewhere, e.g., near action buttons) */}
//              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 text-sm drop-shadow pointer-events-auto">
//                  <Eye className="w-5 h-5 stroke-white" strokeWidth={1.5} />
//                  <span>{reelData?.viewsCount || 0}</span>
//              </div>

//             {/* Optional: Progress Bar */}
//             {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
//                 <div style={{ width: `${(reelData.currentTime / reelData.duration) * 100}%` }} className="h-full bg-white"></div>
//             </div> */}
//         </div>
//     );
// };

// export default ReelOverlayUI;