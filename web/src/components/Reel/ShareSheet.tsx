// ShareSheet.tsx
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle, Facebook, Twitter, Link, Download } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { toast } from 'react-toastify';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sharedPost: any;
  isReel?: boolean;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  sharedPost,
  isReel = true
}) => {

  // Generate post URL
  const getPostUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${isReel ? 'reels' : 'posts'}/${sharedPost?._id}`;
  };

  // Copy link to clipboard
  const copyLink = () => {
    const url = getPostUrl();
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.info("Post link copied to clipboard");
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.info("Could not copy link to clipboard");
      });
  };

  // Share via platforms
  const shareViaPlatform = (platform: string) => {
    const url = encodeURIComponent(getPostUrl());
    const text = encodeURIComponent(`Check out this ${isReel ? 'reel' : 'post'} on Freedom Book!`);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text} ${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // Download video
  const downloadVideo = async () => {
    console.log('Downloading video for post:', sharedPost?._id);
    if (!sharedPost?.media || !sharedPost.media[0]?.watermarkUrl || !sharedPost.media[0]?.url) {
      toast.error("Download failed");
      return;
    }

    try {

      const response = await fetch(sharedPost.media[0]?.watermarkUrl ?? sharedPost.media[0]?.url);
      if (!response.ok) throw new Error('Failed to fetch video');

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freedombook-video-${sharedPost._id}.mp4`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.info("Your download will begin shortly");

    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || "An error occurred while downloading the video");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[50vh] flex flex-col p-0 sm:max-w-md sm:mx-auto">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-center">Share</SheetTitle>
        </SheetHeader>

        {/* Post preview */}
        {sharedPost && (
          <div className="p-4 border-b flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <img
                src={sharedPost.user?.profile || '/images/default-avatar.png'}
                alt={sharedPost.user?.firstname || 'User'}
                className="h-full w-full object-cover"
              />
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {sharedPost.user?.firstname} {sharedPost.user?.lastname}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {sharedPost.content || (isReel ? 'Reel' : 'Post')}
              </p>
            </div>
          </div>
        )}

        {/* Share options */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            {/* Share via messaging */}
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-3 gap-1"
              onClick={() => shareViaPlatform('whatsapp')}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">Message</span>
            </Button>

            {/* Share to Facebook */}
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-3 gap-1"
              onClick={() => shareViaPlatform('facebook')}
            >
              <Facebook className="h-6 w-6" />
              <span className="text-xs">Facebook</span>
            </Button>

            {/* Share to Twitter */}
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-3 gap-1"
              onClick={() => shareViaPlatform('twitter')}
            >
              <Twitter className="h-6 w-6" />
              <span className="text-xs">Twitter</span>
            </Button>

            {/* Copy link */}
            <Button
              variant="outline"
              className="flex flex-col items-center h-auto p-3 gap-1"
              onClick={copyLink}
            >
              <Link className="h-6 w-6" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>

          {/* Download option (only for videos/reels) */}
          {isReel && (
            <Button
              variant="outline"
              className="w-full mt-6 flex items-center gap-2"
              onClick={downloadVideo}
            >
              <Download className="h-5 w-5" />
              <span>Download Video</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareSheet;