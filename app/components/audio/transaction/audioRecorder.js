import { runSoundFilter } from '@/app/lib/utils/pureSound';
import { useEffect, useRef, useState } from 'react';
import WithIconMicrophone from '../mic/withIconMicrophone';

const AudioRecorder = (props) => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    runSoundFilter();
  }, []);

  const handleTranscribeResult = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log(data);

    return data;
  };

  const handleStartStopClick = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      if (props.ref.current) {
        const textSpan = props.ref.current.querySelector('.btn-text');
        if (textSpan) {
          textSpan.textContent = 'Konuşmaya Başla';
        }
        props.ref.current.style.backgroundColor = 'green';
      }
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: 'audio/wav',
            });

            const result = await handleTranscribeResult(audioBlob);

            audioChunksRef.current = [];
            props.onStop(result);
          };

          mediaRecorder.onstart = () => {
            props.onStart();
          };

          mediaRecorder.start();
          if (props.ref.current) {
            const textSpan = props.ref.current.querySelector('.btn-text');
            if (textSpan) {
              textSpan.textContent = 'Konuşmayı Bitir';
            }
            props.ref.current.style.backgroundColor = 'red';
          }
        })
        .catch((err) => {
          console.error('Mikrofon erişimi hatası:', err);
        });
    }
    setIsRecording(!isRecording);
  };

  return (
    <button ref={props.ref} className={'button'} onClick={handleStartStopClick}>
      <WithIconMicrophone />
      <span className="btn-text"></span>
    </button>
  );
};

export default AudioRecorder;

const styles = `
    .button {
        display: flex;
        align-items: center;
        gap: 10px;
        color: white;
        font-size: 15px;
        padding: 12px 24px;
        border: none;
        border-radius: 50px;
        cursor: pointer;
    }
    .icon {
        width: 20px;
        height: 20px;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
