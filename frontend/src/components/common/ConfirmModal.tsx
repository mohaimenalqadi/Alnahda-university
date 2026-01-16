'use client';

import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl",
                            variant === 'danger' ? "bg-red-500/10 text-red-500" :
                                variant === 'warning' ? "bg-amber-500/10 text-amber-500" :
                                    "bg-blue-500/10 text-blue-500"
                        )}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-300 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "w-full sm:w-auto px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50",
                            variant === 'danger' ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20" :
                                variant === 'warning' ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20" :
                                    "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                        )}
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
