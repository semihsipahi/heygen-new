'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001'; // Socket.io sunucu adresi

export function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'], // WebSocket protokolünü kullan
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket.io bağlandı:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io bağlantısı kesildi.');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return socket;
}
