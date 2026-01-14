// ===========================================
// Student Form Modal
// Creation and Editing of Student Records
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Mail, Calendar, Building2, GraduationCap, Loader2, Save } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
// Student Form Modal

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    student?: any; // If provided, we are in edit mode
    departments: any[];
    locale: string;
}

export default function StudentFormModal({ isOpen, onClose, student, departments, locale }: StudentFormModalProps) {
    const t = useTranslations('admin.students');
    const commonT = useTranslations('common');
    const queryClient = useQueryClient();
    const isRTL = locale === 'ar';

    const [formData, setFormData] = useState({
        fullNameAr: '',
        fullNameEn: '',
        email: '',
        dateOfBirth: '',
        departmentId: '',
        academicYear: 1,
        semesterLevel: 1,
        registrationNumber: '',
    });

    useEffect(() => {
        if (student) {
            setFormData({
                fullNameAr: student.fullNameAr || '',
                fullNameEn: student.fullNameEn || '',
                email: student.email || '',
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
                departmentId: student.departmentId || '',
                academicYear: student.academicYear || 1,
                semesterLevel: student.semesterLevel || 1,
                registrationNumber: student.registrationNumber || '',
            });
        } else {
            setFormData({
                fullNameAr: '',
                fullNameEn: '',
                email: '',
                dateOfBirth: '',
                departmentId: '',
                academicYear: 1,
                semesterLevel: 1,
                registrationNumber: '',
            });
        }
    }, [student, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (student) {
                return api.updateStudent(student.id, data);
            } else {
                return api.createStudent(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
            alert(t('saveSuccess'));
            onClose();
        },
        onError: (error: any) => {
            alert(error.message || 'Operation failed');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[20px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="px-4 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight">
                                {student ? t('editStudent') : t('addStudent')}
                            </h2>
                            <p className="text-[10px] md:text-sm text-slate-500 font-medium opacity-60">Academic Registration Form</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                {/* Form Body (Scrollable) */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 md:space-y-6 scrollbar-thin scrollbar-thumb-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Name Arabic */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 text-right block">{t('fullNameAr')}</label>
                            <input
                                required
                                dir="rtl"
                                type="text"
                                value={formData.fullNameAr}
                                onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Name English */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('fullNameEn')}</label>
                            <input
                                required
                                type="text"
                                value={formData.fullNameEn}
                                onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Registration Number */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('registrationNumber')}</label>
                            <input
                                required
                                type="text"
                                placeholder="12345678"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all font-mono text-sm"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('email')}</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('dateOfBirth')}</label>
                            <input
                                required
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('department')}</label>
                            <select
                                required
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm cursor-pointer"
                            >
                                <option value="">Select Department</option>
                                {departments?.map((dept: any) => (
                                    <option key={dept.id} value={dept.id}>
                                        {isRTL ? dept.nameAr : dept.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Semester Level */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                                {isRTL ? 'الفصل الدراسي' : 'Semester Level'}
                            </label>
                            <select
                                required
                                value={formData.semesterLevel}
                                onChange={(e) => setFormData({ ...formData, semesterLevel: parseInt(e.target.value) })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm cursor-pointer"
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {isRTL ? `الفصل الدراسي ${i + 1}` : `Semester ${i + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all"
                        >
                            {commonT('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center justify-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {commonT('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
