import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export type CallType = "audio" | "video";
export type CallPhase = "idle" | "outgoing" | "incoming" | "active";

export interface IncomingCall {
    callId: string;
    callerId: string;
    callType: CallType;
}

const BASE_ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
];

const TURN_URL = import.meta.env.VITE_TURN_URL as string | undefined;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME as string | undefined;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL as
    | string
    | undefined;

function buildIceServers(): RTCIceServer[] {
    if (!TURN_URL) return BASE_ICE_SERVERS;
    const server: RTCIceServer = {
        urls: TURN_URL,
    };
    if (TURN_USERNAME && TURN_CREDENTIAL) {
        server.username = TURN_USERNAME;
        server.credential = TURN_CREDENTIAL;
    }
    return [...BASE_ICE_SERVERS, server];
}

const ICE_SERVERS = buildIceServers();

interface UseWebRTCParams {
    socket: Socket | null;
    roomId: string;
    currentUserId: string | null;
    otherUserId?: string;
    onNotify?: (type: "error" | "success" | "info", message: string) => void;
}

export function useWebRTC({
    socket,
    roomId,
    currentUserId,
    otherUserId,
    onNotify,
}: UseWebRTCParams) {
    const [phase, setPhase] = useState<CallPhase>("idle");
    const phaseRef = useRef<CallPhase>("idle");
    const setPhaseSafe = useCallback((p: CallPhase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);
    const [callType, setCallType] = useState<CallType>("video");
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callIdRef = useRef<string | null>(null);
    const peerIdRef = useRef<string | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const remoteDescSetRef = useRef(false);
    const notifyRef = useRef(onNotify);

    useEffect(() => {
        notifyRef.current = onNotify;
    }, [onNotify]);

    const cleanup = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.onicecandidate = null;
            peerRef.current.ontrack = null;
            peerRef.current.close();
            peerRef.current = null;
        }
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        setIncomingCall(null);
        setPhaseSafe("idle");
        setCallType("video");
        setMuted(false);
        setCameraOff(false);
        callIdRef.current = null;
        peerIdRef.current = null;
        pendingCandidatesRef.current = [];
        remoteDescSetRef.current = false;
    }, [setPhaseSafe]);

    const getLocalStream = useCallback(
        async (type: CallType): Promise<MediaStream | null> => {
            if (!navigator.mediaDevices?.getUserMedia) {
                console.error(
                    "getUserMedia indisponível (contexto não seguro).",
                );
                notifyRef.current?.(
                    "error",
                    "Acesso à câmera/microfone não disponível neste contexto. Acesse via HTTPS ou localhost.",
                );
                return null;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia(
                    type === "video"
                        ? { video: true, audio: true }
                        : { video: false, audio: true },
                );
                localStreamRef.current = stream;
                setLocalStream(stream);
                return stream;
            } catch (error) {
                console.error("getUserMedia falhou:", error);
                const name = error instanceof DOMException ? error.name : "";
                const message =
                    name === "NotAllowedError"
                        ? "Permissão de câmera/microfone negada. Permita o acesso nas configurações do navegador e tente novamente."
                        : name === "NotFoundError"
                          ? type === "video"
                              ? "Nenhuma câmera ou microfone foi encontrado."
                              : "Nenhum microfone foi encontrado."
                          : name === "NotReadableError"
                            ? "A câmera/microfone está em uso por outro aplicativo."
                            : "Não foi possível acessar câmera/microfone.";
                notifyRef.current?.("error", message);
                return null;
            }
        },
        [],
    );

    const createPeer = useCallback(() => {
        if (peerRef.current) return peerRef.current;
        const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        peer.onicecandidate = (e) => {
            if (!e.candidate || !callIdRef.current || !peerIdRef.current)
                return;
            socket?.emit("webrtc:ice-candidate", {
                callId: callIdRef.current,
                targetId: peerIdRef.current,
                payload: e.candidate.toJSON(),
            });
        };

        peer.ontrack = (e) => {
            const stream = e.streams[0];
            if (stream) setRemoteStream(stream);
        };

        peerRef.current = peer;
        return peer;
    }, [socket]);

    const addLocalTracks = useCallback(
        (peer: RTCPeerConnection, stream: MediaStream) => {
            for (const track of stream.getTracks()) {
                peer.addTrack(track, stream);
            }
        },
        [],
    );

    const setRemote = useCallback(
        async (
            peer: RTCPeerConnection,
            description: RTCSessionDescriptionInit,
        ) => {
            await peer.setRemoteDescription(description);
            remoteDescSetRef.current = true;
            for (const candidate of pendingCandidatesRef.current) {
                try {
                    await peer.addIceCandidate(candidate);
                } catch {
                    // candidato inválido
                }
            }
            pendingCandidatesRef.current = [];
        },
        [],
    );

    const startCall = useCallback(
        async (type: CallType) => {
            if (!socket || !otherUserId || phaseRef.current !== "idle") return;
            const stream = await getLocalStream(type);
            if (!stream) return;

            setCallType(type);
            socket.emit(
                "call:initiate",
                { roomId, calleeId: otherUserId, callType: type },
                (res: { error?: string; callId?: string }) => {
                    if (res?.error) {
                        cleanup();
                        notifyRef.current?.("error", res.error);
                        return;
                    }
                    if (res?.callId) {
                        callIdRef.current = res.callId;
                        peerIdRef.current = otherUserId;
                        setPhaseSafe("outgoing");
                    }
                },
            );
        },
        [socket, otherUserId, roomId, getLocalStream, cleanup, setPhaseSafe],
    );

    const acceptCall = useCallback(async () => {
        if (!socket || !incomingCall) return;
        const stream = await getLocalStream(incomingCall.callType);
        if (!stream) {
            // Sem stream não há como aceitar a chamada; sair do estado "incoming"
            // para o usuário poder tentar novamente ou recusar.
            cleanup();
            return;
        }

        callIdRef.current = incomingCall.callId;
        peerIdRef.current = incomingCall.callerId;
        setCallType(incomingCall.callType);
        setPhaseSafe("active");

        const peer = createPeer();
        addLocalTracks(peer, stream);

        socket.emit(
            "call:accept",
            { callId: incomingCall.callId, calleeId: currentUserId },
            (res: { error?: string }) => {
                if (res?.error) {
                    cleanup();
                    notifyRef.current?.("error", res.error);
                }
            },
        );

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("webrtc:offer", {
                callId: incomingCall.callId,
                targetId: incomingCall.callerId,
                payload: offer,
            });
        } catch {
            cleanup();
        }
    }, [
        socket,
        incomingCall,
        currentUserId,
        getLocalStream,
        createPeer,
        addLocalTracks,
        cleanup,
        setPhaseSafe,
    ]);

    const rejectCall = useCallback(() => {
        if (!socket || !incomingCall) return;
        socket.emit("call:reject", {
            callId: incomingCall.callId,
            calleeId: currentUserId,
        });
        cleanup();
    }, [socket, incomingCall, currentUserId, cleanup]);

    const endCall = useCallback(() => {
        if (socket && callIdRef.current) {
            socket.emit("call:end", { callId: callIdRef.current });
        }
        cleanup();
    }, [socket, cleanup]);

    const toggleMute = useCallback(() => {
        const track = localStreamRef.current
            ?.getAudioTracks()
            .find((t) => t.kind === "audio");
        if (track) track.enabled = !track.enabled;
        setMuted((prev) => !prev);
    }, []);

    const toggleCamera = useCallback(() => {
        const track = localStreamRef.current
            ?.getVideoTracks()
            .find((t) => t.kind === "video");
        if (track) track.enabled = !track.enabled;
        setCameraOff((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleIncoming = (data: IncomingCall & { roomId: string }) => {
            if (data.roomId !== roomId) return;
            setIncomingCall({
                callId: data.callId,
                callerId: data.callerId,
                callType: data.callType,
            });
            setPhaseSafe("incoming");
        };

        const handleAccepted = (data: {
            callId: string;
            roomId: string;
            callType: CallType;
        }) => {
            if (data.roomId !== roomId || data.callId !== callIdRef.current)
                return;
            setCallType(data.callType);
            const peer = createPeer();
            const stream = localStreamRef.current;
            if (stream) addLocalTracks(peer, stream);
            setPhaseSafe("active");
        };

        const handleRejected = (data: { callId: string; roomId: string }) => {
            if (data.callId !== callIdRef.current) return;
            notifyRef.current?.("info", "Chamada não atendida.");
            cleanup();
        };

        const handleEnded = (data: { callId: string; roomId: string }) => {
            if (
                data.callId !== callIdRef.current &&
                phaseRef.current !== "incoming"
            )
                return;
            cleanup();
        };

        const handleOffer = async (data: {
            callId: string;
            roomId: string;
            from: string;
            payload: unknown;
        }) => {
            if (data.callId !== callIdRef.current) return;
            const peer = createPeer();
            const stream = localStreamRef.current;
            if (stream) addLocalTracks(peer, stream);
            if (phaseRef.current === "outgoing") setPhaseSafe("active");
            try {
                await setRemote(
                    peer,
                    data.payload as RTCSessionDescriptionInit,
                );
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit("webrtc:answer", {
                    callId: data.callId,
                    targetId: data.from,
                    payload: answer,
                });
            } catch {
                cleanup();
            }
        };

        const handleAnswer = async (data: {
            callId: string;
            roomId: string;
            from: string;
            payload: unknown;
        }) => {
            if (data.callId !== callIdRef.current) return;
            const peer = peerRef.current;
            if (!peer) return;
            try {
                await setRemote(
                    peer,
                    data.payload as RTCSessionDescriptionInit,
                );
            } catch {
                cleanup();
            }
        };

        const handleIce = async (data: {
            callId: string;
            roomId: string;
            from: string;
            payload: unknown;
        }) => {
            if (data.callId !== callIdRef.current) return;
            const peer = peerRef.current;
            if (!peer) return;
            const candidate = data.payload as RTCIceCandidateInit;
            if (remoteDescSetRef.current) {
                try {
                    await peer.addIceCandidate(candidate);
                } catch {
                    // candidato inválido
                }
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:accepted", handleAccepted);
        socket.on("call:rejected", handleRejected);
        socket.on("call:ended", handleEnded);
        socket.on("webrtc:offer", handleOffer);
        socket.on("webrtc:answer", handleAnswer);
        socket.on("webrtc:ice-candidate", handleIce);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:accepted", handleAccepted);
            socket.off("call:rejected", handleRejected);
            socket.off("call:ended", handleEnded);
            socket.off("webrtc:offer", handleOffer);
            socket.off("webrtc:answer", handleAnswer);
            socket.off("webrtc:ice-candidate", handleIce);
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, roomId]);

    return {
        phase,
        callType,
        incomingCall,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
    };
}
