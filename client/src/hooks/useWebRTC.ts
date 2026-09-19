import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { stopRingtone } from "../utils/sound";
import api from "../services/api";
import type { TurnCredentialsResponse } from "../../../shared/types";
import { useIncomingCall, type IncomingCallData } from "../contexts/IncomingCallContext";

export type CallType = "audio" | "video";
export type CallPhase = "idle" | "outgoing" | "incoming" | "connecting" | "active";

export interface IncomingCall {
    callId: string;
    callerId: string;
    callType: CallType;
}

const STUN_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
];

let cachedIceServers: RTCIceServer[] | null = null;
let iceServersPromise: Promise<RTCIceServer[]> | null = null;
let iceServersCacheTimer: ReturnType<typeof setTimeout> | null = null;

async function fetchIceServers(): Promise<RTCIceServer[]> {
    if (cachedIceServers) return cachedIceServers;
    if (iceServersPromise) return iceServersPromise;

    iceServersPromise = (async () => {
        try {
            const res = await api.get("/webrtc/turn-credentials");
            const data: TurnCredentialsResponse = res.data;
            if (!data.urls?.length) {
                iceServersPromise = null;
                return STUN_SERVERS;
            }
            const servers: RTCIceServer[] = [
                ...STUN_SERVERS,
                {
                    urls: data.urls,
                    username: data.username,
                    credential: data.credential,
                },
            ];
            cachedIceServers = servers;
            if (iceServersCacheTimer) clearTimeout(iceServersCacheTimer);
            const cacheTtlMs = Math.max(0, (data.ttl - 300) * 1000);
            iceServersCacheTimer = setTimeout(() => {
                cachedIceServers = null;
                iceServersPromise = null;
            }, cacheTtlMs);
            return servers;
        } catch {
            iceServersPromise = null;
            return STUN_SERVERS;
        }
    })();

    return iceServersPromise;
}

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
    const [callStartTime, setCallStartTime] = useState<number | null>(null);

    useEffect(() => {
        void fetchIceServers();
    }, []);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callIdRef = useRef<string | null>(null);
    const incomingCallIdRef = useRef<string | null>(null);
    const peerIdRef = useRef<string | null>(null);
    const initiatingRef = useRef(false);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const remoteDescSetRef = useRef(false);
    const callStartTimeRef = useRef<number | null>(null);
    const iceRestartCountRef = useRef(0);
    const iceRestartInProgressRef = useRef(false);
    const negotiationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notifyRef = useRef(onNotify);
    const isCrossRoomAcceptRef = useRef(false);
    const { pendingAcceptedCall, setPendingAcceptedCall } = useIncomingCall();

    const MAX_ICE_RESTARTS = 2;
    const NEGOTIATION_TIMEOUT_MS = 30_000;

    useEffect(() => {
        notifyRef.current = onNotify;
    }, [onNotify]);

    const cleanup = useCallback(() => {
        stopRingtone();
        if (negotiationTimeoutRef.current) {
            clearTimeout(negotiationTimeoutRef.current);
            negotiationTimeoutRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.onicecandidate = null;
            peerRef.current.ontrack = null;
            peerRef.current.oniceconnectionstatechange = null;
            peerRef.current.onconnectionstatechange = null;
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
        incomingCallIdRef.current = null;
        peerIdRef.current = null;
        initiatingRef.current = false;
        pendingCandidatesRef.current = [];
        remoteDescSetRef.current = false;
        callStartTimeRef.current = null;
        setCallStartTime(null);
        iceRestartCountRef.current = 0;
    }, [setPhaseSafe]);

    useEffect(() => {
        if (negotiationTimeoutRef.current) {
            clearTimeout(negotiationTimeoutRef.current);
            negotiationTimeoutRef.current = null;
        }
        if (phase === "connecting") {
            negotiationTimeoutRef.current = setTimeout(() => {
                if (phaseRef.current === "connecting") {
                    notifyRef.current?.(
                        "error",
                        "Tempo limite de conexão excedido.",
                    );
                    cleanup();
                }
            }, NEGOTIATION_TIMEOUT_MS);
        }
        return () => {
            if (negotiationTimeoutRef.current) {
                clearTimeout(negotiationTimeoutRef.current);
            }
        };
    }, [phase, cleanup]);

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
                if (localStreamRef.current) {
                    localStreamRef.current
                        .getTracks()
                        .forEach((t) => t.stop());
                }
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

    const createPeer = useCallback(
        (force = false) => {
            if (peerRef.current && !force) return peerRef.current;
            if (peerRef.current) {
                peerRef.current.onicecandidate = null;
                peerRef.current.ontrack = null;
                peerRef.current.oniceconnectionstatechange = null;
                peerRef.current.onconnectionstatechange = null;
                peerRef.current.close();
            }
            const peer = new RTCPeerConnection({
                iceServers: cachedIceServers ?? STUN_SERVERS,
            });

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

        peer.oniceconnectionstatechange = () => {
            const state = peer.iceConnectionState;
            if (state === "failed") {
                if (iceRestartCountRef.current < MAX_ICE_RESTARTS) {
                    iceRestartCountRef.current++;
                    iceRestartInProgressRef.current = true;
                    peer.restartIce();
                    if (peerIdRef.current && callIdRef.current) {
                        peer
                            .createOffer({ iceRestart: true })
                            .then((offer) => peer.setLocalDescription(offer))
                            .then(() => {
                                socket?.emit("webrtc:offer", {
                                    callId: callIdRef.current!,
                                    targetId: peerIdRef.current!,
                                    payload: peer.localDescription,
                                });
                            })
                            .catch(() => cleanup())
                            .finally(() => {
                                iceRestartInProgressRef.current = false;
                            });
                    }
                } else {
                    notifyRef.current?.("error", "Conexão de chamada perdida.");
                    cleanup();
                }
            } else if (state === "disconnected") {
                notifyRef.current?.(
                    "info",
                    "Conexão instável, tentando reconectar...",
                );
            }
        };

        peer.onconnectionstatechange = () => {
            const state = peer.connectionState;
            if (state === "connected") {
                if (phaseRef.current === "connecting") {
                    callStartTimeRef.current = Date.now();
                    setCallStartTime(Date.now());
                    setPhaseSafe("active");
                }
            } else if (state === "failed" || state === "closed") {
                if (phaseRef.current !== "idle" && !iceRestartInProgressRef.current) {
                    cleanup();
                }
            }
        };

        peerRef.current = peer;
        return peer;
    }, [socket, cleanup, setPhaseSafe]);

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
            if (
                !socket ||
                !otherUserId ||
                phaseRef.current !== "idle" ||
                initiatingRef.current
            )
                return;
            initiatingRef.current = true;

            socket.emit(
                "call:initiate",
                { roomId, calleeId: otherUserId, callType: type },
                async (res: { error?: string; callId?: string }) => {
                    if (res?.error) {
                        initiatingRef.current = false;
                        notifyRef.current?.("error", res.error);
                        return;
                    }
                    if (res?.callId) {
                        callIdRef.current = res.callId;
                        peerIdRef.current = otherUserId;
                        setCallType(type);
                        setPhaseSafe("outgoing");

                        const stream = await getLocalStream(type);
                        if (!stream) {
                            initiatingRef.current = false;
                            socket.emit("call:end", { callId: res.callId });
                            return;
                        }
                        initiatingRef.current = false;
                    }
                },
            );
        },
        [socket, otherUserId, roomId, getLocalStream, setPhaseSafe],
    );

    const acceptCall = useCallback(async (call?: IncomingCallData | null) => {
        const targetCall = call || incomingCall;
        if (!socket || !targetCall) return;
        const stream = await getLocalStream(targetCall.callType);
        if (!stream) {
            notifyRef.current?.(
                "error",
                "Não foi possível acessar câmera/microfone. Tente novamente ou recuse a chamada.",
            );
            return;
        }

        callIdRef.current = targetCall.callId;
        incomingCallIdRef.current = null;
        peerIdRef.current = targetCall.callerId;
        setCallType(targetCall.callType);
        setPhaseSafe("connecting");

        const peer = createPeer();
        addLocalTracks(peer, stream);

        socket.emit(
            "call:accept",
            { callId: targetCall.callId, calleeId: currentUserId },
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
                callId: targetCall.callId,
                targetId: targetCall.callerId,
                payload: peer.localDescription,
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

        const handleAccepted = (data: {
            callId: string;
            roomId: string;
            callType: CallType;
        }) => {
            if (data.roomId !== roomId || data.callId !== callIdRef.current)
                return;
            if (phaseRef.current !== "outgoing") return;
            setCallType(data.callType);
            const peer = createPeer();
            if (localStreamRef.current) {
                addLocalTracks(peer, localStreamRef.current);
            }
            setPhaseSafe("connecting");
        };

        const handleRejected = (data: { callId: string; roomId: string }) => {
            if (data.callId !== callIdRef.current) return;
            notifyRef.current?.("info", "Chamada não atendida.");
            cleanup();
        };

        const handleEnded = (data: { callId: string; roomId: string }) => {
            const activeCallId = callIdRef.current ?? incomingCallIdRef.current;
            if (data.callId !== activeCallId) return;
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
            if (localStreamRef.current && peer.getSenders().length === 0) {
                addLocalTracks(peer, localStreamRef.current);
            }
            if (phaseRef.current === "outgoing") setPhaseSafe("connecting");
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
                    payload: peer.localDescription,
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

        socket.on("call:accepted", handleAccepted);
        socket.on("call:rejected", handleRejected);
        socket.on("call:ended", handleEnded);
        socket.on("webrtc:offer", handleOffer);
        socket.on("webrtc:answer", handleAnswer);
        socket.on("webrtc:ice-candidate", handleIce);

        return () => {
            socket.off("call:accepted", handleAccepted);
            socket.off("call:rejected", handleRejected);
            socket.off("call:ended", handleEnded);
            socket.off("webrtc:offer", handleOffer);
            socket.off("webrtc:answer", handleAnswer);
            socket.off("webrtc:ice-candidate", handleIce);
            if (callIdRef.current && socket.connected && !isCrossRoomAcceptRef.current) {
                socket.emit("call:end", { callId: callIdRef.current });
            }
            isCrossRoomAcceptRef.current = false;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, roomId]);

    useEffect(() => {
        if (!pendingAcceptedCall || !socket || phaseRef.current !== "idle" || pendingAcceptedCall.roomId !== roomId) return;

        const pending = pendingAcceptedCall;
        setPendingAcceptedCall(null);
        isCrossRoomAcceptRef.current = true;

        callIdRef.current = pending.callId;
        peerIdRef.current = pending.callerId;
        setCallType(pending.callType);
        setPhaseSafe("outgoing");

        const setupCall = async () => {
            const stream = await getLocalStream(pending.callType);
            if (!stream) {
                initiatingRef.current = false;
                socket.emit("call:end", { callId: pending.callId });
                isCrossRoomAcceptRef.current = false;
                return;
            }
            initiatingRef.current = false;

            socket.emit(
                "call:accept",
                { callId: pending.callId, calleeId: currentUserId },
                (res: { error?: string }) => {
                    if (res?.error) {
                        cleanup();
                        notifyRef.current?.("error", res.error);
                    }
                },
            );

            const peer = createPeer();
            addLocalTracks(peer, stream);
            setPhaseSafe("connecting");

            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit("webrtc:offer", {
                    callId: pending.callId,
                    targetId: pending.callerId,
                    payload: peer.localDescription,
                });
            } catch {
                cleanup();
            }
        };

        setupCall();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, roomId, pendingAcceptedCall, setPendingAcceptedCall]);

    return {
        phase,
        callType,
        incomingCall,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        callStartTime,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
    };
}
