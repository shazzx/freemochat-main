import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag, Settings, Pencil } from "lucide-react";
import { useDeleteReel } from "@/hooks/Reels/useReels";
import { MdDelete } from "react-icons/md";

interface ThreeDotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onReportPost: () => void;
  onShowAutoScrollSettings: () => void;
  isReel?: boolean;
  isProfileAndOwner?: boolean;
  setUpdateReelActive?: Function;
}

const ThreeDotsModal: React.FC<ThreeDotsModalProps> = ({
  isOpen,
  onClose,
  postId,
  onReportPost,
  onShowAutoScrollSettings,
  isReel = false,
  isProfileAndOwner = false,
  setUpdateReelActive,
}) => {
  const deleteReel = useDeleteReel();

  const handleAction = (action: string) => {
    onClose();

    if (action === 'autoscroll') {
      onShowAutoScrollSettings();
    } else if (action === 'report') {
      onReportPost();
    } else if (action === 'edit') {
      setUpdateReelActive?.(true);
    } else if (action === 'delete') {
      deleteReel.mutate({
        postId
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full max-w-sm mx-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Post Options
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-2 py-4">
          {isReel && (
            <Button
              variant="outline"
              onClick={() => handleAction('autoscroll')}
              className="w-full justify-start h-12 hover:bg-accent hover:text-accent-foreground rounded-lg"
            >
              <Settings className="mr-3 h-4 w-4" />
              Autoscroll Settings
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => handleAction('report')}
            className="w-full justify-start h-12 hover:bg-accent hover:text-accent-foreground rounded-lg"
          >
            <Flag className="mr-3 h-4 w-4" />
            Report Post
          </Button>

          {isReel && isProfileAndOwner && (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction('edit')}
                className="w-full justify-start h-12 hover:bg-accent hover:text-accent-foreground rounded-lg"
              >
                <Pencil className="mr-3 h-4 w-4" />
                Edit Reel
              </Button>

              <Button
                variant="outline"
                onClick={() => handleAction('delete')}
                className="w-full justify-start h-12 hover:bg-destructive hover:text-destructive-foreground rounded-lg text-destructive"
              >
                <MdDelete className="mr-3 h-4 w-4" />
                Delete Reel
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThreeDotsModal;