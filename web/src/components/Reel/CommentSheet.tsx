// import React, { useState, useEffect } from 'react';
// import { useComments } from '@/hooks/Post/useComments';
// import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
// import { Avatar } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Loader2, SendIcon } from "lucide-react";
// import { format } from 'date-fns';

// interface CommentsSheetProps {
//   isOpen: boolean;
//   onClose: () => void;
//   postId: string | null;
// }

// const CommentsSheet: React.FC<CommentsSheetProps> = ({ isOpen, onClose, postId }) => {
//   const [commentText, setCommentText] = useState('');
//   const { 
//     comments, 
//     isLoading, 
//     isFetchingNextPage,
//     hasNextPage, 
//     fetchNextPage,
//     addComment
//   } = useComments(postId);

//   // Auto-fetch more comments when user scrolls near bottom
//   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
//     const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
//     const scrollPosition = scrollTop + clientHeight;
//     const scrollThreshold = scrollHeight * 0.8;
    
//     if (scrollPosition >= scrollThreshold && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   // Handle submitting a new comment
//   const handleSubmitComment = async () => {
//     if (!commentText.trim() || !postId) return;
    
//     try {
//       await addComment({ postId, content: commentText });
//       setCommentText('');
//     } catch (error) {
//       console.error('Error adding comment:', error);
//     }
//   };

//   return (
//     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 sm:max-w-md sm:mx-auto">
//         <SheetHeader className="px-4 py-3 border-b">
//           <SheetTitle className="text-center">Comments</SheetTitle>
//         </SheetHeader>
        
//         {/* Comments area */}
//         <ScrollArea className="flex-1 p-4 overflow-y-auto" onScroll={handleScroll}>
//           {isLoading ? (
//             <div className="flex justify-center py-6">
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             </div>
//           ) : comments && comments.length > 0 ? (
//             <div className="space-y-4">
//               {comments.map((comment) => (
//                 <div key={comment._id} className="flex space-x-3">
//                   <Avatar className="h-8 w-8">
//                     <img
//                       src={comment.user?.profile || '/images/default-avatar.png'}
//                       alt={comment.user?.firstname || 'User'}
//                       className="h-full w-full object-cover"
//                     />
//                   </Avatar>
//                   <div className="flex-1">
//                     <div className="bg-muted p-3 rounded-lg">
//                       <div className="font-medium text-sm">
//                         {comment.user?.firstname} {comment.user?.lastname}
//                       </div>
//                       <p className="text-sm mt-1">{comment.content}</p>
//                     </div>
//                     <div className="flex items-center mt-1 text-xs text-muted-foreground">
//                       <span>{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
//                       <span className="mx-2">•</span>
//                       <button className="hover:text-foreground">Like</button>
//                       <span className="mx-2">•</span>
//                       <button className="hover:text-foreground">Reply</button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
              
//               {isFetchingNextPage && (
//                 <div className="flex justify-center py-2">
//                   <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-40 text-center">
//               <p className="text-muted-foreground">No comments yet</p>
//               <p className="text-sm">Be the first to comment on this post!</p>
//             </div>
//           )}
//         </ScrollArea>
        
//         {/* Comment input */}
//         <div className="border-t p-3 flex items-center space-x-2">
//           <Input
//             placeholder="Add a comment..."
//             value={commentText}
//             onChange={(e) => setCommentText(e.target.value)}
//             className="flex-1"
//             onKeyDown={(e) => {
//               if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSubmitComment();
//               }
//             }}
//           />
//           <Button 
//             size="icon" 
//             disabled={!commentText.trim()}
//             onClick={handleSubmitComment}
//           >
//             <SendIcon className="h-4 w-4" />
//           </Button>
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// };

// export default CommentsSheet;