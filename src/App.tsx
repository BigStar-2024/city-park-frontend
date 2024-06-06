import { useEffect } from "react";
import AuthRoutes from "./routes/AuthRoutes";
import { io } from "socket.io-client";

function App() {
  useEffect(() => {
    const newSocket = io("https://city-park-lot.run.place");

    newSocket.on("receive_message", (message: string) => {
      console.log(message);
    });
  }, []);

  return (
    <div className="w-full min-w-[300px] h-full min-h-screen relative font-roboto">
      <AuthRoutes />
    </div>
  );
}


export default App;
