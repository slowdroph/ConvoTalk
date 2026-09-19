/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { playRingtone, stopRingtone } from "../utils/sound";
import type { CallType } from "../hooks/useWebRTC";

export interface IncomingCallData {
    callId: string;
    callerId: string;
    callType: CallType;
    roomId: string;
}

interface IncomingCallContextValue {
    incomingCall: IncomingCallData | null;
    setIncomingCall: (data: IncomingCallData | null) => void;
    pendingAcceptedCall: IncomingCallData | null;
    setPendingAcceptedCall: (data: IncomingCallData | null) => void;
}

const IncomingCallContext = createContext<IncomingCallContextValue | null>(null);

export function useIncomingCall() {
    const ctx = useContext(IncomingCallContext);
    if (!ctx) throw new Error("useIncomingCall must be used within IncomingCallProvider");
    return ctx;
}

export function IncomingCallProvider({
    socket,
    children,
}: {
    socket: Socket | null;
    children: ReactNode;
}) {
    const [incomingCall, setIncomingCallState] = useState<IncomingCallData | null>(null);
    const [pendingAcceptedCall, setPendingAcceptedCall] = useState<IncomingCallData | null>(null);
    const incomingCallRef = useRef<IncomingCallData | null>(null);

    const setIncomingCall = useCallback((data: IncomingCallData | null) => {
        incomingCallRef.current = data;
        setIncomingCallState(data);
        if (data) {
            playRingtone();
        } else {
            stopRingtone();
        }
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleIncoming = (data: IncomingCallData & { roomId: string }) => {
            setIncomingCall({
                callId: data.callId,
                callerId: data.callerId,
                callType: data.callType,
                roomId: data.roomId,
            });
        };

        const handleEnded = (data: { callId: string }) => {
            if (incomingCallRef.current?.callId === data.callId) {
                setIncomingCall(null);
            }
        };

        const handleRejected = (data: { callId: string }) => {
            if (incomingCallRef.current?.callId === data.callId) {
                setIncomingCall(null);
            }
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:ended", handleEnded);
        socket.on("call:rejected", handleRejected);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:ended", handleEnded);
            socket.off("call:rejected", handleRejected);
        };
    }, [socket, setIncomingCall]);

    return (
        <IncomingCallContext.Provider
            value={{
                incomingCall,
                setIncomingCall,
                pendingAcceptedCall,
                setPendingAcceptedCall,
            }}
        >
            {children}
        </IncomingCallContext.Provider>
    );
}
