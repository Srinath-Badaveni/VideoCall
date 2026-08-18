import React, { useState, useEffect, useRef } from 'react';
import { socketManager } from '../../../services/socket/SocketManager';
import { useAuth } from '../../../contexts/AuthContext';

export function MeetingChat({ meetingCode }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const socket = socketManager.getSocket();
        if (!socket) return;

        const handleMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };

        socket.on("meeting:chat-message", handleMessage);
        
        return () => {
            socket.off("meeting:chat-message", handleMessage);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const socket = socketManager.getSocket();
        if (socket) {
            socket.emit("meeting:chat-message", { 
                meetingCode, 
                message: input, 
                sender: user?.name || 'Guest' 
            });
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-80 fixed right-0 top-0">
            <div className="px-4 py-4 bg-gray-800 shadow-md z-10">
                <h3 className="text-white font-bold text-lg">Meeting Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p className="text-4xl mb-2">💬</p>
                        <p className="text-sm">No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`max-w-[85%] rounded-lg p-3 break-words ${msg.sender === user?.name ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-gray-700 text-white"}`}>
                            <p className="text-xs text-gray-300 font-semibold mb-1">{msg.sender}</p>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button type="submit" disabled={!input.trim()} className="px-4 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                        ➤
                    </button>
                </div>
            </form>
        </div>
    );
}
