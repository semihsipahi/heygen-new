'use client';

import { useEffect, useRef, useState } from 'react';

export default function WebcamCapture(props) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const recordedChunks = useRef([]);

  const [recordedURL, setRecordedURL] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    startCamera();
  }, []);

  useEffect(() => {
    if (props.startRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [props.startRecording]);

  useEffect(() => {
    if (recordedURL) {
      console.log(recordedURL);
    }
  }, [recordedURL]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const startRecording = () => {
    console.log('Web Cam Rec. Starting');

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const options = { mimeType: 'video/webm; codecs=vp9' };
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Kayıt bittikten sonra blob oluşturulur
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedURL(url);
        recordedChunks.current = []; // Bir sonraki kayıt için sıfırla
      };

      recorder.start();
      setMediaRecorder(recorder);
    }
  };

  const stopRecording = () => {
    console.log('Web Cam Rec. Stop');

    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline width={300} height={200} />
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        style={{ display: 'none' }}
      />
    </div>
  );
}
