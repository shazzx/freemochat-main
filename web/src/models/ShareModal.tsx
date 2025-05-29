import React, { useCallback, useState } from "react";
import { Share, Download, X, Check, MoreHorizontal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateSharedPost } from "@/hooks/Post/usePost";
import { useAppSelector } from "@/app/hooks";
import { toast } from "react-toastify";
import { WhatsappIcon, WhatsappShareButton } from "react-share";
import { domain } from "@/config/domain";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedPost: any;
  postId: string;
  postType: string;
  postIndexDetails?: any;
  setPostIndex?: (index: any) => void;
  isReel?: boolean;
  handleDownload?: () => void;
  downloadState?: {
    isDownloading: boolean;
    downloadedUri: string | null;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  sharedPost,
  postId,
  postType,
  postIndexDetails,
  setPostIndex,
  isReel = false,
  handleDownload,
  downloadState
}) => {
  const [inputText, setInputText] = useState("");
  const { user: userData } = useAppSelector((state) => state.user);

  const createSharedPost = useCreateSharedPost("userPosts", userData?._id);

  const sharePost = async () => {
    try {
      let postDetails = {
        sharedPostId: sharedPost?._id,
        content: inputText.trim(),
        type: "user",
        postType: sharedPost?.postType || "post",
        visibility: 'public',
        sharedPost,
        target: sharedPost.target,
        ...postIndexDetails
      };

      createSharedPost.mutate(postDetails);

      toast.success(isReel ? "Reel shared successfully!" : "Post shared successfully!");
      if (setPostIndex) {
        setPostIndex(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to share post");
    }

    setInputText("");
    onClose();
  };

  const handleSharePress = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `Check out this ${isReel ? 'reel' : 'post'}`,
        url: `https://www.freedombook.co/post/${sharedPost?._id}?type=${sharedPost?.type}`
      });
    } else {
      navigator.clipboard.writeText(`https://www.freedombook.co/post/${sharedPost?._id}?type=${sharedPost?.type}`);
      toast.info("Link copied to clipboard!");
    }
  }, [sharedPost?._id, sharedPost?.type, isReel]);

  const quickCaptions = [
    "Check this out! 🔥",
    "Thoughts? 👀",
    "Must watch! ✨",
    "Can't believe this! 😱",
    "This is a must read! 📚",
    "Mind-blowing content! 🤯",
    "So inspiring! ✨",
    "Just wow! 🙌",
    "Absolutely love this! ❤️",
    "Big news! 📢",
    "Trend alert! 📈",
    "Worth sharing! 👍",
    "Take a look at this 👇",
  ];

  return (
    <>
      {/* Share Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0 overflow-hidden overflow-y-auto">
          <div className="flex flex-col h-full ">
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">
                  Share {isReel ? "Reel" : "Post"}
                </DialogTitle>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                {/* Reel Preview (if it's a reel) */}
                {isReel && sharedPost && (
                  <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <div className="relative w-20 h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
                      {sharedPost.media?.[0]?.url && (
                        <>
                          <img
                            src={sharedPost.media[0].thumbnail}
                            alt="Reel thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-8 h-8 text-white" fill="white" />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={sharedPost.target?.profile} />
                          <AvatarFallback>
                            {sharedPost.target?.firstname?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">
                          {sharedPost.target?.firstname} {sharedPost.target?.lastname}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {sharedPost.content}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Captions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Quick Captions</h3>
                  <div className="flex flex-wrap gap-2">
                    {quickCaptions.map((caption, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputText(caption)}
                        className="text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {caption}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Text Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Add your caption</label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="What's on your mind about this post?"
                    className="min-h-[120px] resize-none border-2 focus:border-primary"
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {inputText.length}/500
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer with Action Buttons */}
            <div className="px-6 py-4 border-t bg-muted/20">
              <div className="space-y-3">
                {/* Main Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={sharePost}
                    className="flex-1 h-11 font-semibold"
                  >
                    <Share className="w-4 h-4 mr-2" />
                  </Button>

                  <Button
                    className="flex-1 h-11 font-semibold"
                  >
                    <WhatsappShareButton
                      url={`${domain}/post/${postId}?type=${sharedPost?.postType}`}>
                      <div className="flex gap-2 items-center justify-center p-4 rounded-lg w-full">
                        <WhatsappIcon borderRadius={60} size={22} />
                        <span className="text-sm font-medium">WhatsApp</span>
                      </div>
                    </WhatsappShareButton>
                  </Button>


                  {isReel && handleDownload && (
                    <Button
                      onClick={handleDownload}
                      variant={downloadState?.downloadedUri ? "default" : "secondary"}
                      className="flex-1 h-11 font-semibold"
                      disabled={downloadState?.isDownloading}
                    >
                      {downloadState?.downloadedUri ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {downloadState?.downloadedUri
                        ? "Downloaded"
                        : downloadState?.isDownloading
                          ? "Downloading..."
                          : "Download"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareModal;