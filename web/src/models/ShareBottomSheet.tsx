import { domain } from '@/config/domain';
import { Copy, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhatsappIcon, WhatsappShareButton } from 'react-share';
import { toast } from 'react-toastify';
import CPostModal from './CPostModal';
import { useCreateSharedPost } from '@/hooks/Post/usePost';
import { PostType } from '@/utils/types/Post';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dispatch, SetStateAction } from 'react';

function ShareBottomSheet({
    isReel,
    key,
    sharedPost,
    postId,
    postType,
    setModelTrigger,
    handleDownload
}: {
    isReel?: boolean,
    key?: string,
    sharedPost: PostType,
    postId: string,
    postType: string,
    setModelTrigger: Dispatch<SetStateAction<"comments" | "share" | "options" | boolean>>
    handleDownload?: () => void
}) {

    const navigate = useNavigate()
    const createSharedPost = useCreateSharedPost(key, sharedPost?.targetId)

    const _createSharedPost = async ({ content, selectedMedia, formData, visibility }) => {
        let sharedPostDetails: { sharedPostId: string, content: string, type: string, visibility: string, sharedPost: any, target: any } = { 
            sharedPostId: sharedPost?._id, 
            content, 
            type: "user", 
            visibility: "public", 
            sharedPost, 
            target: sharedPost.target 
        }
        createSharedPost.mutate(sharedPostDetails)
        toast.success('shared successfully')
        setModelTrigger(null)
    }

    const isOpen = setModelTrigger !== null;

    return (
        <Sheet open={isOpen} onOpenChange={() => setModelTrigger(null)}>
            <SheetContent
                side="bottom"
                className="rounded-t-2xl p-0 bg-background text-foreground shadow-lg max-h-[85vh] overflow-hidden"
            >
                <div className="flex flex-col w-full">
                    {/* Handle/indicator */}
                    <div className="w-full flex items-center justify-center pt-4 pb-2">
                        <div className="w-10 h-1.5 rounded-full bg-gray-300"></div>
                    </div>

                    <SheetHeader className="px-4 pb-4">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-xl font-semibold">Share</SheetTitle>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-4">
                        <div className="space-y-4 pb-6">
                            {/* Share Post Section */}
                            {sharedPost && (
                                <div className="space-y-3">
                                    <div className="bg-muted/30 rounded-lg p-3">
                                        <CPostModal 
                                            createPost={_createSharedPost} 
                                            isShared={sharedPost?.sharedPost ? false : true} 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Share Options */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-medium">Share Options</h3>
                                <div className="grid grid-cols-3 gap-4 py-4">
                                    <WhatsappShareButton url={`${domain}/post/${postId}?type=${postType}`}>
                                        <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-lg hover:bg-accent transition-colors">
                                            <WhatsappIcon borderRadius={60} size={32} />
                                            <span className="text-sm font-medium">WhatsApp</span>
                                        </div>
                                    </WhatsappShareButton>

                                    <div 
                                        className="flex flex-col gap-2 items-center justify-center p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${domain}/post/${postId}?type=${postType}`);
                                            toast.info("URL Copied")
                                        }}
                                    >
                                        <div className="p-2 bg-blue-500 rounded-full">
                                            <Copy size={16} className="text-white" />
                                        </div>
                                        <span className="text-sm font-medium">Copy URL</span>
                                    </div>

                                    {isReel && (
                                        <div 
                                            className="flex flex-col gap-2 items-center justify-center p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                            onClick={handleDownload}
                                        >
                                            <div className="p-2 bg-green-500 rounded-full">
                                                <Download size={16} className="text-white" />
                                            </div>
                                            <span className="text-sm font-medium">Download</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Alternative Download Button for Reels */}
                            {isReel && (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 flex items-center gap-3 rounded-lg"
                                    onClick={handleDownload}
                                >
                                    <Download className="h-5 w-5" />
                                    <span className="font-medium">Download Video</span>
                                </Button>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default ShareBottomSheet