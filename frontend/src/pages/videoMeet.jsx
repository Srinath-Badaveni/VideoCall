import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import server_api from "../config/api";

const server_url = server_api;

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

export default function VideoMeet() {
    // Refs
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localStreamRef = useRef();
    const previewVideoRef = useRef();
    const remoteVideoRef = useRef();
    const videoRef = useRef([]);
    const peersRef = useRef({});

    // States
    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [username, setUsername] = useState("");
    const [usernameInput, setUsernameInput] = useState("");
    const [roomId, setRoomId] = useState("");
    const [roomIdInput, setRoomIdInput] = useState("");
    const [videos, setVideos] = useState([]);
    const [userList, setUserList] = useState([]);
    const [callDuration, setCallDuration] = useState(0);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");
    const [showNotification, setShowNotification] = useState(null);
    const [inMeeting, setInMeeting] = useState(false);

    // Show notification
    const showNotif = (message, type = "info") => {
        setShowNotification({ message, type });
        setTimeout(() => setShowNotification(null), 4000);
    };

    // Get Permissions
    const getPermissions = async () => {
        try {
            setPreviewLoading(true);
            setPreviewError("");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            localStreamRef.current = stream;
            window.localStream = stream;

            if (previewVideoRef.current) {
                previewVideoRef.current.srcObject = stream;
                await previewVideoRef.current.play().catch((err) => {
                    console.warn("Autoplay prevented:", err.message);
                });
            }

            setVideoAvailable(true);
            setAudioAvailable(true);
            setVideo(true);
            setAudio(true);

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }

            setPreviewLoading(false);
        } catch (err) {
            console.error("Error accessing media devices.", err);

            if (
                err.name === "NotAllowedError" ||
                err.name === "PermissionDeniedError"
            ) {
                setPreviewError(
                    "Permissions denied. Please allow access to camera and microphone."
                );
            } else if (
                err.name === "NotFoundError" ||
                err.name === "DevicesNotFoundError"
            ) {
                setPreviewError(
                    "No camera or microphone found. Please connect a camera and microphone."
                );
            } else {
                setPreviewError("Error accessing media devices: " + err.message);
            }

            setVideoAvailable(false);
            setAudioAvailable(false);
            setPreviewLoading(false);
        }
    };

    // Load permissions on mount
    useEffect(() => {
        getPermissions();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Get User Media
    const getUserMedia = useCallback(async () => {
        try {
            if ((videoAvailable && video) || (audioAvailable && audio)) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: video,
                    audio: audio,
                });
                localStreamRef.current = stream;
                window.localStream = stream;

                if (previewVideoRef.current && !inMeeting) {
                    previewVideoRef.current.srcObject = stream;
                    await previewVideoRef.current.play().catch((err) => {
                        console.warn("Autoplay prevented:", err.message);
                    });
                }
            } else {
                try {
                    let tracks = localStreamRef.current?.srcObject?.getTracks();
                    tracks?.forEach((track) => track.stop());
                } catch (err) {
                    console.error("Error stopping media tracks.", err);
                }
            }
        } catch (error) {
            console.error("Error accessing media devices.", error);
            showNotif("Error accessing media devices", "error");
        }
    }, [video, audio, videoAvailable, audioAvailable, inMeeting]);

    // Update media when video/audio changes
    useEffect(() => {
        if (video !== undefined && audio !== undefined && !inMeeting) {
            getUserMedia();
        }
    }, [video, audio, getUserMedia, inMeeting]);

    // Connect to Socket Server
    const connectToSocketServer = useCallback(() => {
        socketRef.current = io.connect(server_url, {
            secure: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketIdRef.current = socketRef.current.id;

        socketRef.current.on("connect", () => {
            console.log("Connected to socket server:", socketRef.current.id);
            showNotif("Connected to server", "success");

            // Join room with username
            socketRef.current.emit("join-room", roomId);
            showNotif(`Joined room: ${roomId}`, "info");
        });

        setupSocketListeners();
    }, [roomId]);

    // Setup Socket Listeners
    const setupSocketListeners = useCallback(() => {
        if (!socketRef.current) return;

        // User joined
        socketRef.current.on("user-joined", (userId, userList) => {
            console.log("User joined:", userId, "User list:", userList);
            showNotif("A user joined the meeting", "info");

            setUserList(userList.filter((id) => id !== socketIdRef.current));

            // Create peer connection for the new user
            if (userId !== socketIdRef.current) {
                createPeerConnection(userId, true);
            }
        });

        // Receive signal from other peer
        socketRef.current.on("signal", (fromId, signal) => {
            console.log("Signal received from:", fromId);

            if (peersRef.current[fromId]) {
                peersRef.current[fromId].signal(signal);
            } else {
                // Create peer connection if it doesn't exist
                const peer = createPeerConnection(fromId, false);
                peer?.signal(signal);
            }
        });

        // Chat message
        socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
            console.log("Chat message received:", data, "from:", sender);

            setMessages((prev) => [
                ...prev,
                {
                    from: sender,
                    message: data,
                    socketId: socketIdSender,
                    isOwn: socketIdSender === socketIdRef.current,
                },
            ]);
            setNewMessages((prev) => prev + 1);
        });

        // User disconnected
        socketRef.current.on("user-disconnected", (userId, userList) => {
            console.log("User disconnected:", userId);
            showNotif("A user left the meeting", "info");

            // Close peer connection
            if (peersRef.current[userId]) {
                peersRef.current[userId].destroy();
                delete peersRef.current[userId];
            }

            setUserList(userList.filter((id) => id !== socketIdRef.current));
            setVideos((prev) => prev.filter((v) => v.socketId !== userId));
        });

        // Disconnect
        socketRef.current.on("disconnect", () => {
            console.log("Disconnected from socket server");
            showNotif("Disconnected from server", "error");
        });

        // Error
        socketRef.current.on("error", (error) => {
            console.error("Socket error:", error);
            showNotif("Socket error: " + error, "error");
        });
    }, []);

    // Create Peer Connection
    const createPeerConnection = useCallback((peerId, initiator) => {
        console.log("Creating peer connection with:", peerId, "Initiator:", initiator);

        // For demo purposes, using simple peer or WebRTC
        // You would typically use simple-peer library here
        // For now, we'll just manage the socket signals

        return {
            signal: (signal) => {
                // Send signal back to peer
                socketRef.current?.emit("signal", peerId, signal);
            },
            destroy: () => {
                // Clean up
            },
        };
    }, []);

    // Toggle Video
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            const newState = !video;
            videoTracks.forEach((track) => {
                track.enabled = newState;
            });
            setVideo(newState);
            showNotif(newState ? "Camera enabled" : "Camera disabled", "info");
        }
    };

    // Toggle Audio
    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            const newState = !audio;
            audioTracks.forEach((track) => {
                track.enabled = newState;
            });
            setAudio(newState);
            showNotif(newState ? "Microphone enabled" : "Microphone disabled", "info");
        }
    };

    // Toggle Screen Share
    const toggleScreenShare = async () => {
        if (!screenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });
                setScreenSharing(true);
                showNotif("Screen sharing started", "success");
            } catch (error) {
                console.error("Screen sharing failed:", error);
                showNotif("Screen sharing cancelled", "error");
            }
        } else {
            setScreenSharing(false);
            showNotif("Screen sharing stopped", "info");
        }
    };

    // Send Message
    const sendMessage = () => {
        if (!message.trim()) return;

        if (socketRef.current) {
            socketRef.current.emit("chat-message", message, username);

            setMessages((prev) => [
                ...prev,
                {
                    from: username,
                    message: message,
                    socketId: socketIdRef.current,
                    isOwn: true,
                },
            ]);
            setMessage("");
            setNewMessages(0);
        }
    };

    // Leave Meeting
    const leaveMeeting = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Close all peer connections
        Object.values(peersRef.current).forEach((peer) => {
            peer.destroy();
        });
        peersRef.current = {};

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        setInMeeting(false);
        setUsername("");
        setUsernameInput("");
        setRoomId("");
        setRoomIdInput("");
        setVideos([]);
        setMessages([]);
        setUserList([]);
        setCallDuration(0);

        setTimeout(() => {
            getPermissions();
        }, 500);
    };

    // Join Meeting Handler
    const handleJoinMeeting = useCallback(() => {
        if (!usernameInput.trim()) {
            showNotif("Please enter your name", "error");
            return;
        }

        if (!roomIdInput.trim()) {
            showNotif("Please enter a room ID", "error");
            return;
        }

        setUsername(usernameInput);
        setRoomId(roomIdInput);
        setInMeeting(true);
        showNotif("Joining meeting...", "info");

        // Connect to socket after setting username and room
        setTimeout(() => {
            connectToSocketServer();
        }, 500);
    }, [usernameInput, roomIdInput, connectToSocketServer]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Call duration timer
    useEffect(() => {
        let interval;
        if (inMeeting) {
            interval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [inMeeting]);

    // Notification Component
    const Notification = () => {
        if (!showNotification) return null;

        const { message, type } = showNotification;
        const bgColor = {
            success: "bg-green-500",
            error: "bg-red-500",
            info: "bg-blue-500",
        };
        const icon = {
            success: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            error: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            info: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        };

        return (
            <div
                className={`fixed top-4 right-4 ${bgColor[type]} text-white rounded-lg shadow-lg p-3 flex items-center gap-2 z-50 animate-slideIn max-w-xs text-xs`}
            >
                {icon[type]}
                <p className="font-semibold">{message}</p>
            </div>
        );
    };

    // ============= LOGIN PAGE =============
    if (!inMeeting) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50 p-2 sm:p-4">
                <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeInScale {
            animation: fadeInScale 0.4s ease-out;
          }
        `}</style>

                <Notification />

                <div className="w-full max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 items-center">
                        {/* Left Side - Video Preview */}
                        <div className="relative bg-gray-950 rounded-2xl md:rounded-3xl overflow-hidden border border-md:border-2 border-gray-700 shadow-2xl aspect-video md:aspect-auto md:h-96 lg:h-full lg:min-h-screen flex items-center justify-center animate-fadeInScale">
                            {previewLoading ? (
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-3 md:border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="text-gray-300 font-semibold text-xs md:text-sm">
                                        Initializing Camera...
                                    </p>
                                </div>
                            ) : previewError ? (
                                <div className="flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-8 text-center">
                                    <div className="bg-red-500 bg-opacity-20 p-2 md:p-4 rounded-full mb-1 md:mb-2">
                                        <svg
                                            className="w-8 h-8 md:w-12 md:h-12 text-red-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4v2m0 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-red-500 font-semibold mb-1 text-sm md:text-base">
                                            Camera Access Required
                                        </p>
                                        <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
                                            {previewError}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => getPermissions()}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-white font-semibold transition transform hover:scale-105 text-xs md:text-sm"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={previewVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50"></div>

                                    {/* Toggle Buttons - Top Right Corner */}
                                    <div className="absolute top-3 md:top-6 right-3 md:right-6 flex gap-2 md:gap-4 z-10">
                                        {/* Audio Toggle */}
                                        <button
                                            onClick={toggleAudio}
                                            className={`p-2 md:p-4 rounded-full transition-all duration-300 shadow-xl md:shadow-2xl hover:scale-110 transform ${audio
                                                    ? "bg-green-500 hover:bg-green-600 shadow-green-500/50"
                                                    : "bg-red-500 hover:bg-red-600 shadow-red-500/50"
                                                }`}
                                            title={audio ? "Mute" : "Unmute"}
                                        >
                                            {audio ? (
                                                <svg
                                                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3a2 2 0 11-4 0V8a1 1 0 012 0v5a4 4 0 004 4z" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M3.354 1.646a.5.5 0 00-.707.707l14 14a.5.5 0 00.707-.707l-14-14zM8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3a2 2 0 11-4 0V8a1 1 0 012 0v5a4 4 0 004 4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </button>

                                        {/* Video Toggle */}
                                        <button
                                            onClick={toggleVideo}
                                            className={`p-2 md:p-4 rounded-full transition-all duration-300 shadow-xl md:shadow-2xl hover:scale-110 transform ${video
                                                    ? "bg-green-500 hover:bg-green-600 shadow-green-500/50"
                                                    : "bg-red-500 hover:bg-red-600 shadow-red-500/50"
                                                }`}
                                            title={video ? "Turn off camera" : "Turn on camera"}
                                        >
                                            {video ? (
                                                <svg
                                                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M18.364 5.636l-3.536 3.536m0 5.172l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50 px-3 md:px-5 py-1.5 md:py-2.5 rounded-full flex items-center gap-2 md:gap-3">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        <p className="text-xs md:text-sm font-bold text-white">
                                            Camera Ready
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Side - Form */}
                        <div className="md:p-4 lg:p-8 animate-fadeInScale">
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-8 backdrop-blur-xl">
                                {/* Header */}
                                <div className="text-center mb-6 md:mb-8">
                                    <div className="inline-block mb-2 md:mb-4">
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 md:p-4 rounded-xl md:rounded-2xl">
                                            <svg
                                                className="w-5 h-5 md:w-8 md:h-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-1 md:mb-2">
                                        VideoCaller Pro
                                    </h1>
                                    <p className="text-gray-400 text-xs md:text-lg">
                                        Join a Video Meeting
                                    </p>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleJoinMeeting();
                                    }}
                                    className="space-y-4 md:space-y-6"
                                >
                                    {/* Username Input */}
                                    <div>
                                        <label className="block text-gray-300 mb-2 font-semibold text-xs md:text-sm">
                                            Your Name
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={usernameInput}
                                                onChange={(e) => setUsernameInput(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-gray-800 border border-md:border-2 border-gray-700 hover:border-gray-600 focus:border-blue-500 rounded-lg md:rounded-xl text-white placeholder-gray-500 focus:outline-none transition duration-300 text-xs md:text-sm"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Room ID Input */}
                                    <div>
                                        <label className="block text-gray-300 mb-2 font-semibold text-xs md:text-sm">
                                            Room ID
                                        </label>
                                        <div className="relative">
                                            <svg
                                                className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M8 10l3 3m0 0l3-3M11 13V1m0 0H9m2 0h2" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={roomIdInput}
                                                onChange={(e) => setRoomIdInput(e.target.value)}
                                                placeholder="Enter room ID"
                                                className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-gray-800 border border-md:border-2 border-gray-700 hover:border-gray-600 focus:border-blue-500 rounded-lg md:rounded-xl text-white placeholder-gray-500 focus:outline-none transition duration-300 text-xs md:text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Device Status */}
                                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl md:rounded-2xl p-3 md:p-5 space-y-3 md:space-y-4">
                                        <p className="text-gray-300 font-semibold text-xs md:text-sm mb-2 md:mb-4">
                                            Device Status
                                        </p>

                                        <div className="flex items-center justify-between p-2 md:p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div
                                                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${audio ? "bg-green-500" : "bg-red-500"
                                                        }`}
                                                ></div>
                                                <span className="text-gray-300 font-medium text-xs md:text-sm">
                                                    Microphone
                                                </span>
                                            </div>
                                            <span
                                                className={`text-xs md:text-sm font-bold ${audio ? "text-green-400" : "text-red-400"
                                                    }`}
                                            >
                                                {audio ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 md:p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div
                                                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${video ? "bg-green-500" : "bg-red-500"
                                                        }`}
                                                ></div>
                                                <span className="text-gray-300 font-medium text-xs md:text-sm">
                                                    Camera
                                                </span>
                                            </div>
                                            <span
                                                className={`text-xs md:text-sm font-bold ${video ? "text-green-400" : "text-red-400"
                                                    }`}
                                            >
                                                {video ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Join Button */}
                                    <button
                                        type="submit"
                                        disabled={previewLoading || !usernameInput.trim() || !roomIdInput.trim()}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-800 disabled:to-blue-800 disabled:opacity-50 text-white font-bold py-2 md:py-4 rounded-lg md:rounded-xl transition duration-300 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 disabled:hover:scale-100 text-xs md:text-lg"
                                    >
                                        {previewLoading ? "Preparing..." : "Join Meeting"}
                                    </button>

                                    {/* Info */}
                                    <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-2 md:p-4">
                                        <p className="text-blue-300 text-xs md:text-sm text-center flex items-start gap-1 md:gap-2">
                                            <svg
                                                className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Enter same Room ID to join an existing room
                                            </span>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============= MAIN MEETING VIEW =============
    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden">
            <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

            <Notification />

            {/* Main Video Area - 80% */}
            <div className="absolute inset-0 pb-20 md:pb-24 lg:pb-28 bg-black">
                {/* Remote Video - Full Screen */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Local Video - Corner (PiP) */}
                <div className="absolute bottom-24 md:bottom-28 lg:bottom-32 right-2 md:right-4 w-32 h-24 md:w-40 md:h-32 lg:w-48 lg:h-40 bg-gray-950 rounded-lg md:rounded-2xl overflow-hidden border border-md:border-2 border-gray-700 shadow-xl hover:border-blue-500 transition group">
                    <video
                        ref={(ref) => (videoRef.current[0] = ref)}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        srcObject={localStreamRef.current}
                    />

                    {/* Username Badge */}
                    <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 bg-gradient-to-r from-blue-500 to-blue-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                        <p className="text-xs font-bold flex items-center gap-0.5">
                            <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse"></span>
                            You
                        </p>
                    </div>

                    {/* PiP Controls */}
                    <div className="absolute top-1 md:top-2 right-1 md:right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                        <button
                            onClick={toggleAudio}
                            className={`p-1 md:p-2 rounded-full transition transform hover:scale-110 ${audio
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-red-500 hover:bg-red-600"
                                }`}
                            title={audio ? "Mute" : "Unmute"}
                        >
                            {audio ? (
                                <svg
                                    className="w-3 h-3 md:w-4 md:h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3a2 2 0 11-4 0V8a1 1 0 012 0v5a4 4 0 004 4z" />
                                </svg>
                            ) : (
                                <svg
                                    className="w-3 h-3 md:w-4 md:h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3.354 1.646a.5.5 0 00-.707.707l14 14a.5.5 0 00.707-.707l-14-14zM8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3a2 2 0 11-4 0V8a1 1 0 012 0v5a4 4 0 004 4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`p-1 md:p-2 rounded-full transition transform hover:scale-110 ${video
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-red-500 hover:bg-red-600"
                                }`}
                            title={video ? "Turn off camera" : "Turn on camera"}
                        >
                            {video ? (
                                <svg
                                    className="w-3 h-3 md:w-4 md:h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-3 h-3 md:w-4 md:h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M18.364 5.636l-3.536 3.536m0 5.172l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Header - Top Right */}
                <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-gray-900 bg-opacity-80 backdrop-blur-md border border-gray-700 rounded-lg px-2 md:px-4 py-1 md:py-2 flex items-center gap-2 md:gap-3 z-20">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-xs md:text-sm">
                            {formatTime(callDuration)}
                        </span>
                    </div>
                    <span className="w-px h-3 md:h-4 bg-gray-600"></span>
                    <span className="text-xs md:text-sm text-gray-300 truncate">
                        {username} (Room: {roomId})
                    </span>
                    <span className="text-xs md:text-sm text-gray-300">
                        • {userList.length + 1} users
                    </span>
                </div>
            </div>

            {/* Chat Panel - Right Side (20%) */}
            <div className="absolute right-0 top-0 bottom-20 md:bottom-24 lg:bottom-28 w-full sm:w-72 md:w-80 bg-gradient-to-b from-gray-900 to-black border-l border-gray-800 flex flex-col z-30 shadow-2xl hidden sm:flex">
                <div className="p-2 md:p-4 border-b border-gray-800">
                    <h3 className="text-sm md:text-lg font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4 md:w-5 md:h-5 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            Chat
                        </span>
                        {newMessages > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-bold">
                                {newMessages}
                            </span>
                        )}
                    </h3>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3">
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-xs md:text-sm text-center py-8">
                            No messages yet
                        </p>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-2 md:p-3 rounded-lg text-xs md:text-sm ${msg.isOwn
                                        ? "bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 ml-2 md:ml-4"
                                        : "bg-gray-800 mr-2 md:mr-4"
                                    }`}
                            >
                                <p className="font-semibold text-blue-400 mb-0.5 md:mb-1 text-xs md:text-sm">
                                    {msg.from}
                                </p>
                                <p className="text-gray-200 break-words text-xs md:text-sm">
                                    {msg.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Input */}
                <div className="p-2 md:p-4 border-t border-gray-800 space-y-2">
                    <div className="flex gap-1.5 md:gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Type..."
                            className="flex-1 px-2 md:px-3 py-1 md:py-2 bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-lg text-white placeholder-gray-500 focus:outline-none transition text-xs md:text-sm"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 hover:bg-blue-600 px-2 md:px-3 py-1 md:py-2 rounded-lg transition"
                            title="Send"
                        >
                            <svg
                                className="w-3 h-3 md:w-4 md:h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-3 md:p-6 z-20 animate-slideUp">
                <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                    {/* Microphone */}
                    <button
                        onClick={toggleAudio}
                        className={`p-2.5 md:p-4 rounded-full transition transform hover:scale-110 ${audio
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-red-600 hover:bg-red-700"
                            } shadow-lg`}
                        title={audio ? "Mute" : "Unmute"}
                    >
                        {audio ? (
                            <svg
                                className="w-4 h-4 md:w-6 md:h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3a2 2 0 11-4 0V8a1 1 0 012 0v5a4 4 0 004 4z" />
                            </svg>
                        ) : (
                            <svg
                                className="w-4 h-4 md:w-6 md:h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M3.354 1.646a.5.5 0 00-.707.707l14 14a.5.5 0 00.707-.707l-14-14zM8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3a2 2 0 11-4 0V8a1 1 0 012 0v5a4 4 0 004 4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </button>

                    {/* Camera */}
                    <button
                        onClick={toggleVideo}
                        className={`p-2.5 md:p-4 rounded-full transition transform hover:scale-110 ${video
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-red-600 hover:bg-red-700"
                            } shadow-lg`}
                        title={video ? "Turn off camera" : "Turn on camera"}
                    >
                        {video ? (
                            <svg
                                className="w-4 h-4 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-4 h-4 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 5.636l-3.536 3.536m0 5.172l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        )}
                    </button>

                    {/* Screen Share */}
                    {screenAvailable && (
                        <button
                            onClick={toggleScreenShare}
                            className={`p-2.5 md:p-4 rounded-full transition transform hover:scale-110 ${screenSharing
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : "bg-gray-700 hover:bg-gray-600"
                                } shadow-lg`}
                            title={screenSharing ? "Stop sharing" : "Share screen"}
                        >
                            <svg
                                className="w-4 h-4 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Leave Call */}
                    <button
                        onClick={leaveMeeting}
                        className="p-2.5 md:p-4 rounded-full bg-red-600 hover:bg-red-700 transition transform hover:scale-110 shadow-lg md:ml-2 lg:ml-4"
                        title="Leave call"
                    >
                        <svg
                            className="w-4 h-4 md:w-6 md:h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
