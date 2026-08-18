import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config/api';

export default function CalendarPage() {
    const { token } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        fetchUpcoming();
    }, [token]);

    const fetchUpcoming = async () => {
        try {
            const res = await fetch(`${API_BASE}/meetings/upcoming`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMeetings(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            const res = await fetch(`${API_BASE}/meetings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ title, scheduledAt })
            });
            const data = await res.json();
            if (data.success) {
                setMeetings([...meetings, data.data]);
                setShowModal(false);
                setTitle('');
                setDate('');
                setTime('');
            }
        } catch (error) {
            console.error('Error scheduling meeting:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-100 relative">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-100">Calendar</h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#5B5FC7] hover:bg-[#464EB8] text-white px-4 py-2 rounded-md font-semibold transition text-sm"
                >
                    + New meeting
                </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-gray-950">
                <div className="max-w-4xl mx-auto space-y-4">
                    <h2 className="text-lg font-bold text-gray-300 mb-4">Upcoming Meetings</h2>
                    
                    {loading ? (
                        <p className="text-gray-400">Loading schedule...</p>
                    ) : meetings.length === 0 ? (
                        <div className="text-center p-12 bg-gray-800 rounded-xl border border-gray-700">
                            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#6B7280" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </div>
                            <h3 className="text-gray-100 font-bold">No upcoming meetings</h3>
                            <p className="text-gray-400 mt-1">You have no scheduled meetings at this time.</p>
                        </div>
                    ) : (
                        meetings.map(m => (
                            <div key={m._id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-100 text-lg">{m.title}</h3>
                                    <p className="text-sm text-gray-400">
                                        Scheduled for: {new Date(m.scheduledAt).toLocaleString()}
                                    </p>
                                </div>
                                <button className="border border-[#5B5FC7] text-[#5B5FC7] hover:bg-gray-700 px-4 py-1.5 rounded-md font-semibold transition text-sm">
                                    Join
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-100">Schedule Meeting</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-300 transition">
                                <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSchedule} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Title</label>
                                <input 
                                    type="text" required value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full border border-gray-600 bg-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#5B5FC7]"
                                    placeholder="Add a title"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Date</label>
                                    <input 
                                        type="date" required value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full border border-gray-600 bg-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#5B5FC7]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Time</label>
                                    <input 
                                        type="time" required value={time} onChange={e => setTime(e.target.value)}
                                        className="w-full border border-gray-600 bg-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#5B5FC7]"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition">Cancel</button>
                                <button type="submit" className="bg-[#5B5FC7] hover:bg-[#464EB8] text-white px-4 py-2 rounded-md font-semibold text-sm transition">Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
