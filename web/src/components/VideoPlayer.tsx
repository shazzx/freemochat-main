import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const VideoPlayer = ({ src, ref, isVisible }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (ref.current.paused) {
      ref.current.play();
      setIsPlaying(true);
    } else {
      ref.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video
        ref={ref}
        src={src}
        className={`w-full ${isVisible ? 'opacity-100' : 'opacity-50'} w-full max-h-[500px] h-full transition-opacity duration-300`}
        onClick={togglePlay}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={togglePlay}
      >
        {!isPlaying && (
          <button className="p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-opacity">
            <Play size={24} />
          </button>
        )}
      </div>
      {isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          onClick={togglePlay}
        >
          <button className="p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-opacity">
            <Pause size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;