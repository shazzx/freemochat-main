import { useState, useEffect } from 'react';

const CallSecondsCounter = ({ isCallActive }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let intervalId;

    if (isCallActive) {
      intervalId = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCallActive]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="calling-counter">
      {isCallActive ? `${formatTime(seconds)}` : 'Call not active'}
    </div>
  );
};

export default CallSecondsCounter;