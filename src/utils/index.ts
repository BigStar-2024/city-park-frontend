// import { toast } from "react-toastify";

// export const showToast = (msg: string, success: boolean = false) => {
//     const fn = success ? toast.info : toast.error
//     fn(msg, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//         theme: "colored",
//     });
// }
import { toast } from "react-toastify";

export const showToast = (msg: string, success: boolean = false) => {
  const fn = success ? toast.info : toast.error;
  fn(msg, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
};

import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Replace with your actual server URL

let socket: Socket;

export const connectSocket = () => {
  socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const sendMessage = (message: string) => {
  if (socket) socket.emit("send_message", message);
};

export const subscribeToMessages = (callback: () => void) => {
  if (!socket) return;

  socket.on("receive_message", callback);
};

export const unsubscribeFromMessages = () => {
  if (socket) socket.off("receive_message");
};
