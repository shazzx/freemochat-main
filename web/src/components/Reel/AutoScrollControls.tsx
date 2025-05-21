import React, { useState, useCallback, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Clock, Pause, Play } from 'lucide-react';
import { useToast } from '../Toast';
import { toast } from 'react-toastify';
import { updateUser } from '@/app/features/user/userSlice';

interface AutoScrollSettings {
  autoScroll: boolean;
  autoScrollDelay: number | null;
}

interface AutoScrollControlsProps {
  autoScrollSettings: AutoScrollSettings;
  onSettingsChange: (settings: AutoScrollSettings) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

/**
 * AutoScrollControls - A component to display and control auto-scroll settings
 * 
 * @param {object} autoScrollSettings - The current auto-scroll settings object
 * @param {function} onSettingsChange - Callback when settings are changed
 * @param {boolean} isVisible - Whether the controls are visible
 * @param {function} setIsVisible - Function to set visibility
 */
const AutoScrollControls: React.FC<AutoScrollControlsProps> = ({ 
  autoScrollSettings, 
  onSettingsChange, 
  isVisible = true, 
  setIsVisible 
}) => {
  // Create a deep copy of autoScrollSettings for local state
  const [newSettings, setNewSettings] = useState<AutoScrollSettings>({
    autoScroll: autoScrollSettings?.autoScroll || false,
    autoScrollDelay: autoScrollSettings?.autoScrollDelay || null,
  });

  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.user);

  // Sync local state with props when autoScrollSettings changes
  useEffect(() => {
    setNewSettings({
      autoScroll: autoScrollSettings?.autoScroll || false,
      autoScrollDelay: autoScrollSettings?.autoScrollDelay || null,
    });
  }, [autoScrollSettings]);

  // Toggle auto-scroll on/off
  const toggleAutoScroll = useCallback(() => {
    setNewSettings(prev => ({
      ...prev,
      autoScroll: !prev.autoScroll
    }));
  }, []);

  const cycleDelay = useCallback(() => {
    let newDelay;

    if (!newSettings.autoScrollDelay) newDelay = 5;
    else if (newSettings.autoScrollDelay === 5) newDelay = 6;
    else if (newSettings.autoScrollDelay === 6) newDelay = 7;
    else if (newSettings.autoScrollDelay === 7) newDelay = 8;
    else if (newSettings.autoScrollDelay === 8) newDelay = 9;
    else if (newSettings.autoScrollDelay === 9) newDelay = 10;
    else if (newSettings.autoScrollDelay === 10) newDelay = 12;
    else if (newSettings.autoScrollDelay === 12) newDelay = 15;
    else if (newSettings.autoScrollDelay === 15) newDelay = 18;
    else if (newSettings.autoScrollDelay === 18) newDelay = 25;
    else if (newSettings.autoScrollDelay === 25) newDelay = 36;
    else newDelay = null;

    setNewSettings(prev => ({
      ...prev,
      autoScrollDelay: newDelay
    }));
  }, [newSettings.autoScrollDelay]);

  // Format the delay text
  const getDelayText = useCallback(() => {
    if (newSettings.autoScrollDelay === null) {
      return 'On Video End';
    } else {
      return `${newSettings.autoScrollDelay}s`;
    }
  }, [newSettings.autoScrollDelay]);

  // Save settings callback
  const saveAutoScrollSettings = useCallback(async () => {
    try {
      // Create a proper FormData object
      const formData = new FormData();

      // Convert the settings object to a string since FormData can't handle JSON directly
      const updatedData = JSON.stringify({ autoScrollSettings: newSettings });
      formData.append('userData', updatedData);

      // Log what's being sent
      console.log("Sending settings:", updatedData);

      const { data, status } = await axiosClient.post("/user/update", formData, {
        headers: { "Content-Type": 'multipart/form-data' }
      });

      // Log response for debugging
      console.log("API response:", data, status);

      // Update Redux store with new settings
      dispatch(updateUser({ ...user, autoScrollSettings: newSettings }));

      // Notify parent component of change
      onSettingsChange(newSettings);

      // Show success message
      toast.success("AutoScroll settings saved successfully");
      setTimeout(() => {
        toast.success("Changes will take effect from next reel");
      }, 2000);

      // Close the controls
      setIsVisible(false);
    } catch (error) {
      console.log("Error saving AutoScroll settings:", error);
      console.log("Error details:", error.response?.data);
      toast.error("Failed to save AutoScroll settings");
    }
  }, [dispatch, user, newSettings, onSettingsChange, setIsVisible]);

  // If not visible at all, return null
  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-1/3 left-2 max-w-sm mx-auto right-2 bg-black/70 rounded-xl overflow-hidden z-40 border border-white/20
                 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}
    >
      {/* Compact view - always visible */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center flex-1 ml-2">
          <div 
            className={`w-2 h-2 rounded-full mr-1.5 ${newSettings.autoScroll ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-white text-sm font-medium">
            AutoScroll: {newSettings.autoScroll ? 'ON' : 'OFF'}
          </span>
        </div>

        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center ${newSettings.autoScroll ? 'bg-green-500' : 'bg-gray-600'}`}
          onClick={toggleAutoScroll}
        >
          {newSettings.autoScroll ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm">Scroll After:</span>
          <button
            className="flex items-center bg-white/20 px-3 py-1.5 rounded-full"
            onClick={cycleDelay}
          >
            <span className="text-white mr-1.5 text-sm">{getDelayText()}</span>
            <Clock className="w-4 h-4 text-white" />
          </button>
        </div>

        <p className="text-white/70 text-xs italic mb-4">
          {newSettings.autoScrollDelay === null
            ? 'Videos will auto-scroll when they finish playing'
            : `Videos will auto-scroll after ${newSettings.autoScrollDelay} seconds`}
        </p>

        <div className="flex justify-between mt-2">
          <Button
            variant="outline"
            className="flex-1 mr-2 bg-white text-black hover:bg-gray-200"
            onClick={() => setIsVisible(false)}
          >
            Cancel
          </Button>

          <Button
            variant="default"
            className="flex-1 ml-2 bg-primary text-white hover:bg-primary/90"
            onClick={saveAutoScrollSettings}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutoScrollControls;