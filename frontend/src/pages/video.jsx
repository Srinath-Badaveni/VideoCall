import React, { useRef, useState, useEffect, useContext } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import { useAuth } from "../contexts/AuthContext"; // Adjust the import path to your AuthContext file

const server_url = process.env.REACT_APP_SERVER_URL;

var connections = {};

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

const getGridLayout = (participantCount) => {
    if (participantCount === 0) return { cols: 1, rows: 1 };
    if (participantCount === 1) return { cols: 1, rows: 1 };
    if (participantCount === 2) return { cols: 2, rows: 1 };
    if (participantCount === 3) return { cols: 3, rows: 1 };
    if (participantCount === 4) return { cols: 2, rows: 2 };
    if (participantCount === 5 || participantCount === 6) return { cols: 3, rows: 2 };
    if (participantCount >= 7 && participantCount <= 9) return { cols: 3, rows: 3 };
    if (participantCount >= 10 && participantCount <= 12) return { cols: 4, rows: 3 };
    return { cols: 4, rows: 4 };
};

export default function VideoMeet() {
    // 1. Get user from AuthContext
    const { user } = useAuth();
    const navigate = useNavigate();

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localStreamRef = useRef();
    const localVideoRef = useRef();
    const videoRefs = useRef({});
    const screenStreamRef = useRef();
    const dragRef = useRef(null);
    const animationFrameRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: window.innerWidth * 0.75 - 280, y: window.innerHeight - 270 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    // 2. Set the username from the context when the component mounts or user changes
    useEffect(() => {
        if (user && user.name) { // Assuming the user object has a 'name' property
            setUsername(user.name);
        }
    }, [user]);

    // Auto scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'VIDEO') return;
        setIsDragging(true);
        const rect = dragRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(() => {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const maxX = window.innerWidth * 0.75 - 240; // Account for 75% width
            const maxY = window.innerHeight - 176;
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(20, Math.min(newY, maxY - 100));
            setDragPosition({ x: constrainedX, y: constrainedY });
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const handleTouchStart = (e) => {
        if (e.target.tagName === 'VIDEO') return;
        setIsDragging(true);
        const touch = e.touches[0];
        const rect = dragRef.current.getBoundingClientRect();
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        });
        e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(() => {
            const newX = touch.clientX - dragOffset.x;
            const newY = touch.clientY - dragOffset.y;
            const maxX = window.innerWidth * 0.75 - 240;
            const maxY = window.innerHeight - 176;
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(20, Math.min(newY, maxY - 100));
            setDragPosition({ x: constrainedX, y: constrainedY });
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging, dragOffset]);

    useEffect(() => {
        const handleResize = () => {
            setDragPosition({
                x: window.innerWidth * 0.75 - 280,
                y: window.innerHeight - 270
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getPermissions = async () => {
        try {
            setPreviewLoading(true);
            setPreviewError("");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: true,
            });
            localStreamRef.current = stream;
            window.localStream = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.onloadedmetadata = () => {
                    localVideoRef.current.play()
                        .then(() => setVideoReady(true))
                        .catch((err) => console.error("Play error:", err));
                };
                localVideoRef.current.onerror = () => {
                    setPreviewError("Video playback error. Please refresh.");
                };
            }
            setVideoAvailable(true);
            setAudioAvailable(true);
            setPreviewLoading(false);
        } catch (err) {
            setVideoReady(false);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setPreviewError("❌ Camera permission denied. Please allow camera access in browser settings.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setPreviewError("❌ No camera found. Please connect a camera and refresh the page.");
            } else if (err.name === "NotReadableError") {
                setPreviewError("❌ Camera is already in use. Please close other apps using the camera.");
            } else {
                setPreviewError("❌ Error: " + err.message);
            }
            setVideoAvailable(false);
            setAudioAvailable(false);
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        getPermissions();
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext("2d").fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId]
                    .setRemoteDescription(new window.RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if (signal.sdp.type === "offer") {
                            connections[fromId]
                                .createAnswer()
                                .then((description) => {
                                    connections[fromId]
                                        .setLocalDescription(description)
                                        .then(() => {
                                            socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                                        })
                                        .catch(() => { });
                                })
                                .catch(() => { });
                        }
                    })
                    .catch(() => { });
            }
            if (signal.ice) {
                connections[fromId]
                    .addIceCandidate(new window.RTCIceCandidate(signal.ice))
                    .catch(() => { });
            }
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((oldMessages) => [
            ...oldMessages,
            { data: data, sender: sender, socketId: socketIdSender, timestamp: new Date() },
        ]);
    };

    const connectToSocketServer = () => {
        if (socketRef.current && socketRef.current.connected) return;
        socketRef.current = io(server_url, {
            secure: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketRef.current.on("connect", () => {
            setIsConnected(true);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit("join-room", window.location.href);
            socketRef.current.on("signal", gotMessageFromServer);
            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                console.log("User left:", id);
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                delete videoRefs.current[id];
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((userId) => {
                    connections[userId] = new window.RTCPeerConnection(peerConnectionConfig);
                    connections[userId].onicecandidate = (event) => {
                        if (event.candidate != null) {
                            socketRef.current.emit("signal", userId, JSON.stringify({ ice: event.candidate }));
                        }
                    };
                    connections[userId].onaddstream = (event) => {
                        setVideos((oldVideos) => {
                            let exists = oldVideos.some(v => v.socketId === userId);
                            let updated = exists
                                ? oldVideos.map(v =>
                                    v.socketId === userId ? { ...v, stream: event.stream } : v)
                                : [...oldVideos, { socketId: userId, stream: event.stream }];
                            return updated;
                        });
                    };
                    if (window.localStream !== undefined && window.localStream != null) {
                        connections[userId].addStream(window.localStream);
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[userId].addStream(window.localStream);
                    }
                });

                if (id !== socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (err) { }
                        connections[id2].createOffer().then((description) => {
                            connections[id2]
                                .setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections[id2].localDescription }));
                                })
                                .catch(() => { });
                        });
                    }
                }
            });
        });

        socketRef.current.on("disconnect", () => {
            setIsConnected(false);
        });
        socketRef.current.on("connect_error", () => { });
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideo(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudio(audioTrack.enabled);
            }
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (screenSharing) {
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach((track) => track.stop());
                }
                if (localStreamRef.current) {
                    for (let id in connections) {
                        connections[id].removeStream(screenStreamRef.current);
                        connections[id].addStream(localStreamRef.current);
                        connections[id].createOffer().then((description) => {
                            connections[id]
                                .setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
                                })
                                .catch(() => { });
                        });
                    }
                }
                setScreenSharing(false);
            } else {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: false,
                });
                screenStreamRef.current = screenStream;
                for (let id in connections) {
                    connections[id].removeStream(localStreamRef.current);
                    connections[id].addStream(screenStream);
                    connections[id].createOffer().then((description) => {
                        connections[id]
                            .setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
                            })
                            .catch(() => { });
                    });
                }
                screenStream.getTracks()[0].onended = () => {
                    setScreenSharing(false);
                    for (let id in connections) {
                        connections[id].removeStream(screenStream);
                        connections[id].addStream(localStreamRef.current);
                        connections[id].createOffer().then((description) => {
                            connections[id]
                                .setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
                                })
                                .catch(() => { });
                        });
                    }
                };
                setScreenSharing(true);
            }
        } catch (err) {
            console.error("Error sharing screen:", err);
        }
    };

    const handleLeave = () => {
        if (socketRef.current) socketRef.current.disconnect();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        for (let id in connections) connections[id].close();
        connections = {};
        setAskForUsername(true);
        setUsername("");
        setVideos([]);
        setIsConnected(false);
        socketIdRef.current = null;
        setVideoReady(false);
        setScreenSharing(false);
        setMessages([]);
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        videoRefs.current = {};
        getPermissions();
        navigate('/dashboard');
    };

    const handleJoin = async () => {
        if (username.trim() !== "") {
            if (!videoReady) {
                setPreviewError("⏳ Please wait for camera to load...");
                return;
            }
            setAskForUsername(false);
            setVideo(true);
            setAudio(true);
            if (!localStreamRef.current) {
                await getPermissions();
            }
            setTimeout(() => {
                connectToSocketServer();
                if (localVideoRef.current && window.localStream) {
                    localVideoRef.current.srcObject = window.localStream;
                    localVideoRef.current.play().catch(() => { });
                }
            }, 300);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() !== "" && socketRef.current) {
            socketRef.current.emit("chat-message", message, username, socketIdRef.current);
            setMessage("");
        }
    };

    const totalParticipants = videos.length + 1;
    const gridLayout = getGridLayout(videos.length);

    // 3. The JSX remains the same, the `value` of the input will be pre-filled
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 font-sans">
            {askForUsername ? (
                <div className="flex items-center justify-center min-h-screen p-6">
                    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Left Side: Video Preview */}
                        <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {videoReady && (
                                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                                    <span className="text-white text-xs font-medium">You</span>
                                </div>
                            )}
                            <div className={`absolute inset-0 flex items-center justify-center bg-black/50 ${videoReady ? 'hidden' : ''}`}>
                                {previewLoading ? (
                                    <p className="text-white">Loading Camera...</p>
                                ) : (
                                    <p className="text-white text-center p-4">{previewError || "Camera is off or not available."}</p>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Join Form */}
                        <div className="bg-white rounded-3xl shadow-2xl p-10 transform transition-all hover:scale-[1.02]">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                                    <span className="text-3xl">📹</span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Meeting</h2>
                                <p className="text-sm text-gray-500">Enter your name to get started</p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-5 py-4 text-lg bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all placeholder:text-gray-400"
                                    onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                                />

                                <button
                                    onClick={handleJoin}
                                    disabled={username.trim() === "" || !videoReady}
                                    className={`w-full py-4 text-lg font-semibold rounded-xl transition-all transform ${username.trim() === "" || !videoReady
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                        }`}
                                >
                                    {previewLoading ? "Loading Camera..." : videoReady ? "Join Meeting →" : "Camera Loading..."}
                                </button>
                            </div>

                            <div className="mt-6 text-center">
                                {previewError && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl mb-4 text-sm font-medium">
                                        {previewError}
                                    </div>
                                )}
                                <div className={`flex items-center justify-center gap-2 text-sm font-medium ${videoReady ? "text-green-600" : "text-gray-500"}`}>
                                    <span className="text-lg">{videoReady ? "✅" : "⏳"}</span>
                                    <span>{videoReady ? "Camera Ready" : "Loading Camera..."}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-screen flex bg-black overflow-hidden">
                    {/* Video Section - 75% */}
                    <div className="w-3/4 relative">
                        {/* Top Info Bar */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                            <div>
                                <p className="text-white font-semibold text-sm">{username}</p>
                                <p className="text-gray-300 text-xs">
                                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Time Display */}
                        <div className="absolute top-4 right-4 z-20">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
                                <span className="text-white text-sm font-medium">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Grid Video Area */}
                        <div className="h-full p-4 pb-28">
                            {videos.length === 0 ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="text-center space-y-6">
                                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 rounded-full">
                                            <span className="text-6xl">👋</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-semibold text-white mb-2">Waiting for others to join</p>
                                            <p className="text-gray-400 max-w-md mx-auto">Share the meeting link to invite participants</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="h-full w-full grid gap-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
                                        gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
                                    }}
                                >
                                    {videos.map((participant, index) => (
                                        <div
                                            key={participant.socketId}
                                            className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl transition-all group"
                                        >
                                            <video
                                                ref={(el) => {
                                                    if (el && participant.stream && el.srcObject !== participant.stream) {
                                                        el.srcObject = participant.stream;
                                                        el.play().catch(() => { });
                                                    }
                                                    videoRefs.current[participant.socketId] = el;
                                                }}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-sm font-medium">
                                                    Participant {index + 1}
                                                </span>
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Draggable Local Video */}
                        <div
                            ref={dragRef}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleTouchStart}
                            style={{
                                left: `${dragPosition.x}px`,
                                top: `${dragPosition.y}px`,
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                willChange: 'transform',
                            }}
                            className={`fixed w-60 h-44 overflow-hidden shadow-2xl bg-black group z-50 select-none ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
                                } transition-all`}
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover pointer-events-none"
                            />
                            {!video && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 pointer-events-none">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                                            <span className="text-3xl">👤</span>
                                        </div>
                                        <p className="text-white font-medium text-sm">{username}</p>
                                        <p className="text-gray-400 text-xs">Camera off</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="absolute bottom-2 left-2 right-2">
                                    <span className="text-white text-xs font-medium drop-shadow-lg">You ({username})</span>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                    {!audio && (
                                        <div className="w-6 h-6 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white text-xs">🔇</span>
                                        </div>
                                    )}
                                    {!video && (
                                        <div className="w-6 h-6 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white text-xs">📴</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`absolute top-2 left-2 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} pointer-events-none`}>
                                <span className="text-white text-xs font-medium drop-shadow-lg bg-black/50 px-2 py-1 rounded">
                                    {isDragging ? '🤏 Dragging...' : '✋ Drag me'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom Control Bar */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
                            <div className="flex items-center gap-4 px-4 py-3">
                                <button
                                    onClick={toggleAudio}
                                    className={`group relative w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all transform hover:scale-110 active:scale-95 ${audio ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"
                                        }`}
                                    title={audio ? "Mute" : "Unmute"}
                                >
                                    {audio ? "🎤" : "🔇"}
                                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                                        {audio ? "Mute" : "Unmute"}
                                    </span>
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`group relative w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all transform hover:scale-110 active:scale-95 ${video ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"
                                        }`}
                                    title={video ? "Stop Camera" : "Start Camera"}
                                >
                                    {video ? "📹" : "📴"}
                                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                                        {video ? "Stop video" : "Start video"}
                                    </span>
                                </button>
                                <button
                                    onClick={toggleScreenShare}
                                    className={`group relative w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all transform hover:scale-110 active:scale-95 ${screenSharing ? "bg-blue-500 hover:bg-blue-600" : "bg-white/10 hover:bg-white/20"
                                        }`}
                                    title={screenSharing ? "Stop Sharing" : "Share Screen"}
                                >
                                    🖥️
                                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                                        {screenSharing ? "Stop sharing" : "Share screen"}
                                    </span>
                                </button>
                                <button
                                    onClick={handleLeave}
                                    className="group relative w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl transition-all transform hover:scale-110 active:scale-95 shadow-lg"
                                    title="Leave Call"
                                >
                                    ☎️
                                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                                        Leave call
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chat Section - 25% */}
                    <div className="w-1/4 bg-gray-900 flex flex-col">
                        {/* Chat Header */}
                        <div className="px-4 py-4 bg-gray-800">
                            <h3 className="text-white font-bold text-lg">Meeting Chat</h3>
                            <p className="text-gray-400 text-xs">Send messages to everyone</p>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    <p className="text-4xl mb-2">💬</p>
                                    <p className="text-sm">No messages yet</p>
                                    <p className="text-xs">Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`${msg.socketId === socketIdRef.current
                                            ? "ml-auto bg-blue-600"
                                            : "mr-auto bg-gray-700"
                                            } max-w-[85%] rounded-lg p-3 break-words`}
                                    >
                                        <p className="text-xs text-gray-300 font-semibold mb-1">{msg.sender}</p>
                                        <p className="text-white text-sm">{msg.data}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 bg-gray-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={message.trim() === ""}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${message.trim() === ""
                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                >
                                    ➤
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

