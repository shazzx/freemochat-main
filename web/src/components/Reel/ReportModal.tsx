// // ReportModal.tsx
// import React, { useState } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
// import { Textarea } from "@/components/ui/textarea";

// interface ReportModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   postId: string | null;
//   userId: string | null;
//   isReel?: boolean;
// }

// const reportReasons = [
//   { id: 'spam', label: 'Spam' },
//   { id: 'nudity', label: 'Nudity or sexual content' },
//   { id: 'violence', label: 'Violence or dangerous content' },
//   { id: 'harassment', label: 'Harassment or bullying' },
//   { id: 'false_info', label: 'False information' },
//   { id: 'hate_speech', label: 'Hate speech' },
//   { id: 'other', label: 'Something else' }
// ];

// const ReportModal: React.FC<ReportModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   postId, 
//   userId,
//   isReel = false 
// }) => {
//   const [selectedReason, setSelectedReason] = useState<string>('');
//   const [additionalInfo, setAdditionalInfo] = useState<string>('');
//   // const { reportContent, isLoading, isSuccess } = useReportContent();
  
//   const handleSubmit = async () => {
//     if (!selectedReason || !postId || !userId) return;
    
//     await reportContent({
//       contentId: postId,
//       contentType: isReel ? 'reel' : 'post',
//       reporterId: userId,
//       reason: selectedReason,
//       additionalInfo: additionalInfo
//     });
//   };
  
//   // Reset form when dialog opens/closes
//   React.useEffect(() => {
//     if (!isOpen) {
//       setSelectedReason('');
//       setAdditionalInfo('');
//     }
//   }, [isOpen]);
  
//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Report {isReel ? 'Reel' : 'Post'}</DialogTitle>
//         </DialogHeader>
        
//         {isSuccess ? (
//           <div className="py-6 text-center space-y-4">
//             <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <h3 className="font-medium text-lg">Thank you for your report</h3>
//             <p className="text-muted-foreground">
//               We'll review this content and take appropriate action based on our community guidelines.
//             </p>
//             <Button
//               className="mt-4"
//               onClick={onClose}
//             >
//               Close
//             </Button>
//           </div>
//         ) : (
//           <>
//             <div className="py-4">
//               <p className="text-sm text-muted-foreground mb-4">
//                 Please select a reason for reporting this {isReel ? 'reel' : 'post'}:
//               </p>
              
//               <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-2">
//                 {reportReasons.map((reason) => (
//                   <div key={reason.id} className="flex items-center space-x-2">
//                     <RadioGroupItem id={reason.id} value={reason.id} />
//                     <Label htmlFor={reason.id} className="cursor-pointer">{reason.label}</Label>
//                   </div>
//                 ))}
//               </RadioGroup>
              
//               {selectedReason === 'other' && (
//                 <div className="mt-4">
//                   <Label htmlFor="additionalInfo">Please provide more details</Label>
//                   <Textarea
//                     id="additionalInfo"
//                     placeholder="Tell us more about the issue..."
//                     value={additionalInfo}
//                     onChange={(e) => setAdditionalInfo(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>
//               )}
//             </div>
            
//             <DialogFooter>
//               <Button variant="outline" onClick={onClose} disabled={isLoading}>
//                 Cancel
//               </Button>
//               <Button 
//                 onClick={handleSubmit} 
//                 disabled={!selectedReason || isLoading}
//               >
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Submitting...
//                   </>
//                 ) : 'Submit Report'}
//               </Button>
//             </DialogFooter>
//           </>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default ReportModal;