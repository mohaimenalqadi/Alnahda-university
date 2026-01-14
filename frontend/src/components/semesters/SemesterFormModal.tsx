// ===========================================
// Semester Form Modal
// Creation and Editing of Academic Periods
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, Loader2, Save, Hash } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
// Semester Form Modal

interface SemesterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    semester?: any;
    locale: string;
}

export default function SemesterFormModal({ isOpen, onClose, semester, locale }: SemesterFormModalProps) {
    const t = useTranslations('admin.semesters');
    const commonT = useTranslations('common');
    const queryClient = useQueryClient();
    const isRTL = locale === 'ar';

    const [formData, setFormData] = useState({
        nameAr: '',
        nameEn: '',
        year: new Date().getFullYear(),
        term: 'FALL',
        startDate: '',
        endDate: '',
        isActive: false,
    });

    useEffect(() => {
        if (semester) {
            setFormData({
                nameAr: semester.nameAr || '',
                nameEn: semester.nameEn || '',
                year: semester.year || new Date().getFullYear(),
                term: semester.term || 'FALL',
                startDate: semester.startDate ? new Date(semester.startDate).toISOString().split('T')[0] : '',
                endDate: semester.endDate ? new Date(semester.endDate).toISOString().split('T')[0] : '',
                isActive: semester.isActive || false,
            });
        } else {
            setFormData({
                nameAr: '',
                nameEn: '',
                year: new Date().getFullYear(),
                term: 'FALL',
                startDate: '',
                endDate: '',
                isActive: false,
            });
        }
    }, [semester, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (semester) {
                return api.updateSemester(semester.id, data);
            } else {
                return api.createSemester(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-semesters'] });
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
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                                {semester ? t('editSemester') : t('addSemester')}
                            </h2>
                            <p className="text-sm text-slate-500">Academic Period Configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-right">{t('name')} (Ar)</label>
                            <input
                                required
                                dir="rtl"
                                type="text"
                                value={formData.nameAr}
                                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('name')} (En)</label>
                            <input
                                required
                                type="text"
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('year')}</label>
                            <input
                                required
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('term')}</label>
                            <select
                                value={formData.term}
                                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            >
                                <option value="FALL">FALL</option>
                                <option value="SPRING">SPRING</option>
                                <option value="SUMMER">SUMMER</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('startDate')}</label>
                            <input
                                required
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('endDate')}</label>
                            <input
                                required
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 rounded border-white/10 bg-slate-950 text-blue-600 focus:ring-blue-500/50"
                        />
                        <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer select-none">
                            {t('active')} - Set as current active academic period
                        </label>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all">
                            {commonT('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02]"
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
