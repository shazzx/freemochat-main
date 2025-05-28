import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flag, Settings } from "lucide-react";
import { useDeleteReel } from "@/hooks/Reels/useReels";

interface ThreeDotsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onReportPost: () => void;
  onShowAutoScrollSettings: () => void;
  isReel?: boolean;
  isProfileAndOwner?: boolean;
  setUpdateReelActive?: Function;
}

const ThreeDotsSheet: React.FC<ThreeDotsSheetProps> = ({
  isOpen,
  onClose,
  postId,
  onReportPost,
  onShowAutoScrollSettings,
  isReel = false,
  isProfileAndOwner = false,
  setUpdateReelActive ,
}) => {

  const deleteReel = useDeleteReel()

  const handleAction = (action: string) => {
    onClose();

    if (action === 'autoscroll') {
      onShowAutoScrollSettings();
    } else if (action === 'report') {
      onReportPost();
    } else if (action == 'edit') {
      setUpdateReelActive(true)
    } else if (action == 'delete') {
      deleteReel.mutate({
        postId
      })
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-4 bg-background text-foreground shadow-lg max-h-[80vh] overflow-y-auto"
      >
        <div className="flex flex-col w-full">
          {/* Handle/indicator */}
          <div className="w-full flex items-center justify-center mb-4">
            <div className="w-10 h-1.5 rounded-full bg-gray-300 my-2"></div>
          </div>

          <ScrollArea className="mt-2 max-h-60">
            {isReel && (
              <Button
                variant="outline"
                onClick={() => handleAction('autoscroll')}
                className="w-full mb-2 bg-background text-foreground hover:accent rounded-lg justify-start h-12"
              >
                <Settings className="mr-2 h-4 w-4" />
                Autoscroll Settings
              </Button>

            )}

            <Button
              variant="outline"
              onClick={() => handleAction('report')}
              className="w-full mb-2 bg-background text-foreground hover:accent rounded-lg justify-start h-12"
            >
              <Flag className="mr-2 h-4 w-4" />
              Report Post
            </Button>

            {isReel && isProfileAndOwner &&
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction('edit')}
                  className="w-full mb-2 bg-background text-foreground hover:accent rounded-lg justify-start h-12"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Reel
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAction('delete')}
                  className="w-full mb-2 bg-background text-foreground hover:accent rounded-lg justify-start h-12"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Delete Reel
                </Button>
              </>
            }
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ThreeDotsSheet;