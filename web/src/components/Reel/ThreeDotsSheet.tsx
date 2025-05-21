import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flag, Settings } from "lucide-react";

interface ThreeDotsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onReportPost: () => void;
  onShowAutoScrollSettings: () => void;
  isReel?: boolean;
}

const ThreeDotsSheet: React.FC<ThreeDotsSheetProps> = ({
  isOpen,
  onClose,
  postId,
  onReportPost,
  onShowAutoScrollSettings,
  isReel = false,
}) => {
  const handleAction = (action: string) => {
    onClose();

    if (action === 'autoscroll') {
      onShowAutoScrollSettings();
    } else if (action === 'report') {
      onReportPost();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-2xl p-4 bg-white"
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
                className="w-full mb-2 bg-gray-100 text-black hover:bg-gray-200 rounded-lg justify-start h-12"
              >
                <Settings className="mr-2 h-4 w-4" />
                Autoscroll Settings
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => handleAction('report')}
              className="w-full mb-2 bg-gray-100 text-black hover:bg-gray-200 rounded-lg justify-start h-12"
            >
              <Flag className="mr-2 h-4 w-4" />
              Report Post
            </Button>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ThreeDotsSheet;