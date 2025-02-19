export const sendMessage = (socket, channel, data) => {
  if (socket) {
    socket.emit(channel, data);
  }
};
