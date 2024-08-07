import { AudioRecorder } from 'react-audio-voice-recorder';

const addAudioElement = (blob) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);
};

function VoiceRecorder() {
    return (
        <div><AudioRecorder
            onRecordingComplete={addAudioElement}
            audioTrackConstraints={{
                noiseSuppression: true,
                echoCancellation: true,
            }}
            downloadOnSavePress={true}
            downloadFileExtension="webm"
        /></div>
    )
}

export default VoiceRecorder