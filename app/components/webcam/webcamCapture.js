'use client';

import { useEffect, useRef, useState } from 'react';

export default function WebcamCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      setImage(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline width={400} height={300} />
      {/* <button onClick={startCamera}>Kamerayı Aç</button>
      <button onClick={captureImage}>Fotoğraf Çek</button> */}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{ display: 'none' }}
      />
      {image && <img src={image} alt="Captured" />}
    </div>
  );
}
