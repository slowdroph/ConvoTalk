/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import type { CallPhase, CallType } from "../hooks/useWebRTC";

export interface WebRTCState {
    phase: CallPhase;
    callType: CallType;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    muted: boolean;
    cameraOff: boolean;
    callStartTime: number | null;
    toggleMute: () => void;
    toggleCamera: () => void;
    endCall: () => void;
}

const WebRTCStateContext = createContext<WebRTCState | null>(null);

export function useWebRTCState() {
    return useContext(WebRTCStateContext);
}

export { WebRTCStateContext };
