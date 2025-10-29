import React, { useState, useEffect } from 'react';

const MessageModal = () => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('success'); // 'success' or 'error'
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Listen for custom event
        const handleShowMessage = (event) => {
            const { msg, msgType } = event.detail;
            setMessage(msg);
            setType(msgType);
            setVisible(true);

            // Auto-hide after 4 seconds
            setTimeout(() => {
                setVisible(false);
            }, 4000);
        };

        window.addEventListener('showMessage', handleShowMessage);
        return () => window.removeEventListener('showMessage', handleShowMessage);
    }, []);

    if (!visible) return null;

    return (
        <div className={`fixed top-6 right-6 z-50 max-w-sm w-96 rounded-lg shadow-2xl border-l-4 ${type === 'success'
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
            } p-6 animate-slideIn`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {type === 'success' ? (
                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                        {message}
                    </p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="ml-3 text-gray-400 hover:text-gray-600"
                >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
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
      `}</style>
        </div>
    );
};

export default MessageModal;
