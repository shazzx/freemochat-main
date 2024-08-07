import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timer = useRef(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (mediaRecorder.current) mediaRecorder.current.stop();
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      audioChunks.current = [];
      onRecordingComplete(audioBlob);
    };

    mediaRecorder.current.start();
    setIsRecording(true);
    setRecordingTime(0);

    timer.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timer.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      {isRecording ? (
        <div className="flex items-center">
          <div className="w-12 h-1 bg-red-500 animate-pulse rounded-full"></div>
          <div className="text-lg font-semibold mx-4">
            {formatTime(recordingTime)}
          </div>
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300 ease-in-out"
          >
            Stop
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="bg-blue-500 text-white p-4 rounded-full hover:bg-blue-600 transition duration-300 ease-in-out"
        >
          🎙️
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;