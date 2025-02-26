'use client';

import { generateGUID } from '@/app/lib/utils/pureGuid';
import { uploadVideo } from '@/app/service/commonService';
import { useEffect, useRef, useState } from 'react';

export default function WebcamCapture(props) {
  const videoRef = useRef(null);
  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);

  useEffect(() => {
    if (videoRef.current && !recording) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        });
    }
  }, [recording]);

  useEffect(() => {
    if (props.startRecording) {
      startRecording();
    }
  }, [props.startRecording]);

  useEffect(() => {
    if (props.stopRecording) {
      stopRecording();
    }
  }, [props.stopRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    videoRef.current.srcObject = stream;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      chunksRef.current = [];
      await uploadVideoInChunks(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    }
    console.log('BLOB: ', videoBlob);
  };

  const uploadChunkWithRetry = async (
    payload,
    attempt = 1,
    maxAttempts = 3
  ) => {
    try {
      const response = await uploadVideo(payload);
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt < maxAttempts) {
        console.warn(`Retrying chunk upload... Attempt ${attempt + 1}`);
        await uploadChunkWithRetry(payload, attempt + 1, maxAttempts);
      } else {
        console.error('Max upload attempts reached. Upload failed.', error);
      }
    }
  };

  // const uploadVideoInChunks = async (blob) => {
  //   let start = 0;

  //   console.log('Upload Video In Chunks', blob);

  //   const totalSize = blob.size;
  //   const chunkSize = 1024 * 1024 * 4; // 500 KB

  //   let chunkIndex = 0;

  //   const mimeType = blob.type;
  //   const trackId = generateGUID();
  //   const fileExtension = mimeType.split('/')[1];

  //   const seperate = totalSize / chunkSize;

  //   console.log('Upload Video In Chunks Total Size :', seperate);

  //   while (start < chunkSize) {
  //     const chunk = blob.slice(start, start + chunkSize);
  //     const reader = new FileReader();

  //     reader.readAsArrayBuffer(chunk);

  //     await new Promise((resolve) => {
  //       reader.onloadend = async () => {
  //         const payload = {
  //           trackId,
  //           fileExtension,
  //           currentChunk: chunkIndex + 1,
  //           bytes: Array.from(new Uint8Array(reader.result)),
  //           totalChunk: seperate,
  //           questionId: props.question?.id,
  //         };
  //         await uploadChunkWithRetry(payload);
  //         resolve();
  //       };
  //     });
  //     start += chunkSize;
  //     chunkIndex++;
  //   }
  // };

  const uploadVideoInChunks = async (blob) => {
    let start = 0;
    let chunkIndex = 0;

    const chunkSize = 1024 * 1024 * 4;
    const totalSize = blob.size;
    const mimeType = blob.type;
    const fileExtension = mimeType.split('/')[1];
    const trackId = generateGUID();
    const seperate = Math.ceil(totalSize / chunkSize);

    while (start < totalSize) {
      const chunk = blob.slice(start, start + chunkSize);
      const reader = new FileReader();
      reader.readAsDataURL(chunk);
      await new Promise((resolve) => {
        reader.onloadend = async () => {
          console.log(
            `Uploading chunk ${chunkIndex + 1} of ${Math.ceil(totalSize / chunkSize)}`
          );

          const payload = {
            trackId,
            fileExtension,
            currentChunk: chunkIndex + 1,
            bytes: reader.result.split(',')[1],
            totalChunk: seperate,
            questionId: props.question?.id,
          };

          await uploadChunkWithRetry(payload);
          resolve();
        };
      });
      start += chunkSize;
      chunkIndex++;
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={300}
        height={200}
        muted
      />
    </div>
  );
}
