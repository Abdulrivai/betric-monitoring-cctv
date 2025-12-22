'use client';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
            case 'error':
                return 'bg-gradient-to-r from-rose-500 to-rose-600 text-white';
            case 'warning':
                return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
            case 'info':
                return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className={`${getStyles()} rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[320px] max-w-md backdrop-blur-sm`}>
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm leading-relaxed">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
