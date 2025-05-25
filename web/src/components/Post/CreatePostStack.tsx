import React, { useCallback } from "react";
import { Image, Film, Sun, Droplet, Trash2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface CreatePostStackProps {
  isOpen: boolean;
  onClose: () => void;
  handlePostClick: () => void;
  handleReelClick: () => void;
}

/**
 * CreatePostStack component that displays post creation options in a modal dialog
 */
const CreatePostStack: React.FC<CreatePostStackProps> = ({
  isOpen,
  onClose,
  handlePostClick,
  handleReelClick,
}) => {
  const handleClosePress = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="py-2 border-b border-gray-100 text-center">
            <h2 className="text-lg font-medium text-gray-800">Create New</h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Create Post Option */}
              <button
                onClick={handlePostClick}
                className="w-full flex items-center p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
              >
                <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center">
                  <Image size={24} color="white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 ml-4 text-left">
                  <h3 className="text-base font-medium text-gray-800">Create Post</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Create and share updates</p>
                </div>
                <ChevronRight size={20} className="text-gray-500 ml-2" strokeWidth={1.5} />
              </button>

              {/* Create Reel Option */}
              <button
                onClick={handleReelClick}
                className="w-full flex items-center p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
              >
                <div className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center">
                  <Film size={24} color="white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 ml-4 text-left">
                  <h3 className="text-base font-medium text-gray-800">Create Reel</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Create and share short videos</p>
                </div>
                <ChevronRight size={20} className="text-gray-500 ml-2" strokeWidth={1.5} />
              </button>

              {/* Create Plantation Option - Upcoming */}
              <button
                disabled
                className="w-full flex items-center p-4 rounded-xl opacity-80 cursor-not-allowed"
              >
                <div className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center">
                  <Sun size={24} color="white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 ml-4 text-left">
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-gray-800">Create Plantation</h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Upcoming
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Track & share tree planting locations on map
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-400 ml-2" strokeWidth={1.5} />
              </button>

              {/* Create Dams Option - Upcoming */}
              <button
                disabled
                className="w-full flex items-center p-4 rounded-xl opacity-80 cursor-not-allowed"
              >
                <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center">
                  <Droplet size={24} color="white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 ml-4 text-left">
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-gray-800">Create Dams</h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Upcoming
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Document water conservation projects on map
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-400 ml-2" strokeWidth={1.5} />
              </button>

              {/* Create Garbage Collection Option - Upcoming */}
              <button
                disabled
                className="w-full flex items-center p-4 rounded-xl opacity-80 cursor-not-allowed"
              >
                <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center">
                  <Trash2 size={24} color="white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 ml-4 text-left">
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-gray-800">Create Garbage Collection</h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Upcoming
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Log garbage bin placements on shared map
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-400 ml-2" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostStack;