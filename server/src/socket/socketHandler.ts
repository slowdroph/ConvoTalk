import { Server as SocketIOServer } from "socket.io";
import { registerConnectionAndLifecycle } from "./connectionHandler";

const socketHandler = (io: SocketIOServer): void => {
    registerConnectionAndLifecycle(io);
};

export default socketHandler;
