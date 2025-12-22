'use client';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    onConfirm,
    onCancel,
    type = 'warning'
}: ConfirmDialogProps) {
    const getIcon = () => {
        switch (type) {
            case 'danger':
                return (
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100">
                        <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                        <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'info':
                return (
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                    onClick={onCancel}
                ></div>

                {/* Dialog */}
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                    <div className="text-center">
                        {getIcon()}
                        <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{message}</p>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 ${getConfirmButtonStyle()} text-white font-semibold py-3 px-4 rounded-xl transition-all focus:outline-none focus:ring-2`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
