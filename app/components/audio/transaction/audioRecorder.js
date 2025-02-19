import { useRef, useState } from 'react';

const AudioRecorder = (props) => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startStopButtonRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);

  // TODO :Bu Kısım Şimdilik Kapalı.Ses Kalitesine göre Tekrar Açılabilir.
  // useEffect(() => {
  //   //runSoundFilter();
  // }, []);

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
      startStopButtonRef.current.textContent = 'Konuşmaya Başla';
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
          startStopButtonRef.current.textContent = 'Konuşmayı Bitir';
        })
        .catch((err) => {
          console.error('Mikrofon erişimi hatası:', err);
        });
    }

    setIsRecording(!isRecording);
  };

  return (
    <div>
      <button
        style={{
          height: 40,
          width: 120,
          cursor: 'pointer',
          backgroundColor: 'green',
          color: 'white',
        }}
        ref={startStopButtonRef}
        onClick={handleStartStopClick}
      >
        Konuşmaya Başla
      </button>
    </div>
  );
};

export default AudioRecorder;
