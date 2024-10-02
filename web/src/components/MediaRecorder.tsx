import { v4 as uuidv4 } from 'uuid';
import React, { useRef, useState } from 'react';
import { axiosClient } from '@/api/axiosClient';
import VoiceMessagePlayer from './AudioPlayer';
import { MdRecordVoiceOver } from 'react-icons/md';
import { Mic, Mic2 } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { toast } from 'react-toastify';

const AudioRecorder = ({ onRecordingComplete, setIsRecordingMain }) => {
    const [recordedUrl, setRecordedUrl] = useState('');
    const [recordedAudio, setRecordedAudio] = useState(undefined);
    const { user } = useAppSelector((data) => data.user)
    const mediaStream = useRef(null);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);
    const timer = useRef(null)
    const [isRecording, setIsRecording] = useState(false)
    const recordingTime = useRef(0)
    const [_recordingTime, setRecordingTime] = useState(0)
    const uploadState = useRef(false)
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(
                { audio: true }
            );
            mediaStream.current = stream;
            mediaRecorder.current = new MediaRecorder(stream);
            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };
            mediaRecorder.current.onstop = async () => {
                const recordedBlob = new Blob(
                    chunks.current, { type: 'audio/webm' }
                );
                chunks.current = [];
                setRecordedAudio(recordedBlob)
                onRecordingComplete(recordedBlob, uploadState.current, recordingTime.current)
                setRecordingTime(0)
            };
            mediaRecorder.current.start();
            setIsRecording(true)
            setIsRecordingMain(true)
            recordingTime.current = 0;

            timer.current = setInterval(() => {
                recordingTime.current = recordingTime.current + 1
                setRecordingTime((prev) => prev + 1)

                if(recordingTime.current >= 30){
                    uploadState.current = false
                    recordingTime.current = 0;
                    setRecordingTime(0)
                    stopRecording()
                    toast.info("voice message must not exceed 30 seconds")
                }
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };
    const stopRecording = async () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();

        }
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach((track) => {
                track.stop();
            });
        }

        setIsRecording(false);
        setIsRecordingMain(false)
        clearInterval(timer.current);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    return (
        <div>
            {isRecording ?
                <div className="flex px-4 py-1 flex-grow items-center justify-between bottom-0 bg-card max-w-4xl w-full">
                    <div className="w-40 sm:w-80 flex-grow h-3 bg-red-500 animate-pulse rounded-full"></div>
                    <div className="text-lg font-semibold mx-4">
                        {formatTime(_recordingTime)}
                    </div>
                    <div className='flex gap-2'>

                        <button
                            onClick={() => {
                                uploadState.current = false
                                recordingTime.current = 0;
                                setRecordingTime(0)
                                stopRecording()
                            }}
                            className="bg-red-500 p-[4px] px-2 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
                        >
                            <Mic fill='red' />
                        </button>

                        <svg width="42" className="stroke-white dark:stroke-white" onClick={() => {
                            uploadState.current = true
                            stopRecording()

                        }} height="42" viewBox="0 0 47 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.5" y="1" width="46" height="48" rx="4" fill="#433FFA" />
                            <rect x="0.5" y="1" width="46" height="48" rx="4" stroke="#433FFA" stroke-linejoin="bevel" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M30.8815 24.0836L15.7861 17.1726C15.3917 16.963 14.909 16.3339431 14.4953 17.1194C14.0816 17.2957 13.7898 17.6456 13.715 18.0552C13.7201 18.1913 13.7562 18.3249 13.821 18.4477L16.6951 24.7566C16.8393 25.1756 16.9179 25.6109 16.9283 26.0497C16.9179 26.4886 16.8394 26.9239 16.6951 27.3428L13.821 33.6518C13.7562 33.7746 13.7201 33.9082 13.715 34.0443C13.7903 34.4533 14.082 34.8025 14.4953 34.9785C14.9086 35.1545 15.3906 35.1347 15.7848 34.9256L30.8815 28.0147C31.7234 27.6594 32.262 26.8926 32.262 26.0491C32.262 25.2057 31.7234 24.4389 30.8815 24.0836V24.0836Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                </div>
                :
                <button onClick={startRecording} className='border-primary p-[7px] rounded-md border-2 '>
                    <svg className='stroke-foreground' width="20" height="25" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.338 11.6263C14.338 12.7333 13.8955 13.7949 13.1078 14.5777C12.3202 15.3604 11.2519 15.8002 10.138 15.8002C9.02408 15.8002 7.95578 15.3604 7.16813 14.5777C6.38048 13.7949 5.93799 12.7333 5.93799 11.6263V5.78279C5.93799 4.67581 6.38048 3.61415 7.16813 2.83139C7.95578 2.04864 9.02408 1.60889 10.138 1.60889C11.2519 1.60889 12.3202 2.04864 13.1078 2.83139C13.8955 3.61415 14.338 4.67581 14.338 5.78279V11.6263Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M18.538 12.4609C18.5402 13.4482 18.3462 14.4261 17.9672 15.3386C17.588 16.2512 17.0312 17.0803 16.3287 17.7783C15.6262 18.4764 14.792 19.0298 13.8737 19.4065C12.9555 19.7833 11.9715 19.9761 10.978 19.974H9.29805C8.30463 19.9761 7.32057 19.7833 6.40235 19.4065C5.48413 19.0298 4.64984 18.4764 3.94739 17.7783C3.24493 17.0803 2.68816 16.2512 2.30902 15.3386C1.92988 14.4261 1.73584 13.4482 1.73806 12.4609" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10.1378 19.9741V23.3132" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
            }
        </div>
    );
};
export default AudioRecorder;