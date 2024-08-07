import React, { useState, useRef, useEffect } from 'react';

const VoiceMessagePlayer = ({ audioBlob }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const playHeadRef = useRef(null);
  // deprecated component
  useEffect(() => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = audioRef.current;
      audio.src = audioUrl;

      audio.onloadedmetadata = () => {
        console.log("Audio metadata loaded. Duration:", audio.duration);
        setDuration(audio.duration);
        setIsLoading(false);
      };

      audio.onerror = (e) => {
        console.error("Audio error:", e);
        setError("Failed to load audio.");
        setIsLoading(false);
      };

      return () => {
        URL.revokeObjectURL(audioUrl);
        audio.onloadedmetadata = null;
        audio.onerror = null;
      };
    }
  }, [audioBlob]);

  useEffect(() => {
    const audio = audioRef.current;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      updatePlayHead();
    };

    audio.onended = () => setIsPlaying(false);

    return () => {
      audio.ontimeupdate = null;
      audio.onended = null;
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => {
        console.error("Play failed:", e);
        setError("Failed to play audio.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    const progress = progressBarRef.current;
    if (!progress || !audio.duration) return;

    const percent = (e.nativeEvent.offsetX / progress.offsetWidth) * 100;
    audio.currentTime = (percent / 100) * audio.duration;
    updatePlayHead();
  };

  const updatePlayHead = () => {
    const playHead = playHeadRef.current;
    const progress = progressBarRef.current;
    if (!playHead || !progress || !duration) return;

    const percent = (currentTime / duration) * 100;
    playHead.style.left = `${percent}%`;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return <div className="text-red-500 p-3">{error}</div>;
  }

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-xl shadow-md">
      {isLoading ? (
        <div className="w-full flex justify-center items-center p-4">
          <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition duration-300 ease-in-out"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          <div className="flex-grow mx-4 relative">
            <div
              ref={progressBarRef}
              onClick={seek}
              className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer relative"
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-100 ease-out absolute top-0 left-0"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
              <div
                ref={playHeadRef}
                className="w-3 h-3 bg-blue-500 rounded-full absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-md"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <audio ref={audioRef} className="hidden" />
        </>
      )}
    </div>
  );
};

export default VoiceMessagePlayer;