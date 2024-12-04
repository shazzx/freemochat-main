import { useState, useRef, useEffect } from 'react';
import { CiPause1, CiPlay1 } from "react-icons/ci";

const AudioPlayer = ({ src, duration }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    // audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('end', () => {
      console.log('end')
    })
    return () => {
      // audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  useEffect(() => {
    console.log(currentTime, duration)
    if((currentTime > duration) || (currentTime > (duration - 0.05))){
      setCurrentTime(0)
      setIsPlaying(false)
    }
  },[currentTime])

  // const onLoadedMetadata = () => {
  //   setDuration(audioRef.current.duration);
  // };

  const onTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-card p-2 rounded-md w-fit">
      <div className='flex gap-2'>
        <audio ref={audioRef} src={src} />
        <button className='rounded-full p-1 border border-foreground flex items-center justify-center text-foreground' onClick={togglePlayPause}>
          {isPlaying ? <CiPause1 size={22} /> : <CiPlay1 size={22} />}
        </button>
        <div className='flex items-center justify-center gap-1 '>
          <span className='text-xs text-foreground'>
            {formatTime(currentTime)}
          </span>
          <div>
            <input
              className='w-40'
              type="range"

              min="0"
              color='black'
              value={(currentTime / duration) * 100 || 0}
              onChange={onSeek}
            />
          </div>


          <span className='text-xs text-foreground'>
            {formatTime(duration)}
          </span>
          <div className='flex justify-between w-full'>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AudioPlayer;