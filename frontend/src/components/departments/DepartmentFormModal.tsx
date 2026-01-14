// ===========================================
// Department Form Modal
// Creation and Editing of University Departments
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Building2, Hash, Loader2, Save } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface DepartmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    department?: any;
    locale: string;
}

export default function DepartmentFormModal({ isOpen, onClose, department, locale }: DepartmentFormModalProps) {
    const t = useTranslations('admin.departments');
    const commonT = useTranslations('common');
    const queryClient = useQueryClient();
    const isRTL = locale === 'ar';

    const [formData, setFormData] = useState({
        code: '',
        nameAr: '',
        nameEn: '',
        isActive: true,
    });

    useEffect(() => {
        if (department) {
            setFormData({
                code: department.code || '',
                nameAr: department.nameAr || '',
                nameEn: department.nameEn || '',
                isActive: department.isActive ?? true,
            });
        } else {
            setFormData({
                code: '',
                nameAr: '',
                nameEn: '',
                isActive: true,
            });
        }
    }, [department, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (department) {
                return api.updateDepartment(department.id, data);
            } else {
                return api.createDepartment(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
            // Using standard alert since external toast library was not installed
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

            <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                                {department ? t('editDepartment') : t('addDepartment')}
                            </h2>
                            <p className="text-sm text-slate-500">Academic Unit Definition</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('code')}</label>
                            <input
                                required
                                type="text"
                                placeholder="CS, ENG, MED..."
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-right">{t('nameAr')}</label>
                            <input
                                required
                                dir="rtl"
                                type="text"
                                value={formData.nameAr}
                                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('nameEn')}</label>
                            <input
                                required
                                type="text"
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded border-white/10 bg-slate-950 text-emerald-600 focus:ring-emerald-500/50"
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer select-none">
                                Department is active and accepting enrollments
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all">
                            {commonT('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02]"
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
