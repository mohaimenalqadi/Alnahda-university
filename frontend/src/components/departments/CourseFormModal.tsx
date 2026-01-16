// ===========================================
// Course Form Modal
// Creation and Editing of Academic Courses
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, BookOpen, Hash, Loader2, Save, Building2, Layers } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface CourseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    course?: any;
    locale: string;
}

export default function CourseFormModal({ isOpen, onClose, course, locale }: CourseFormModalProps) {
    const t = useTranslations('admin.gradeManagement');
    const commonT = useTranslations('common');
    const queryClient = useQueryClient();
    const isRTL = locale === 'ar';

    const [formData, setFormData] = useState({
        code: '',
        nameAr: '',
        nameEn: '',
        departmentId: '',
        semesterLevel: 1,
        units: 3,
    });

    // Fetch Departments for the select input
    const { data: departments } = useQuery({
        queryKey: ['admin-departments'],
        queryFn: () => api.getAdminDepartments(),
    });

    useEffect(() => {
        if (course) {
            setFormData({
                code: course.code || '',
                nameAr: course.nameAr || '',
                nameEn: course.nameEn || '',
                departmentId: course.departmentId || course.department?.id || '',
                semesterLevel: course.semesterLevel || 1,
                units: course.units || 3,
            });
        } else {
            setFormData({
                code: '',
                nameAr: '',
                nameEn: '',
                departmentId: '',
                semesterLevel: 1,
                units: 3,
            });
        }
    }, [course, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (course) {
                // Backend forbids updating departmentId, so we must exclude it
                const { departmentId, ...updateData } = data;
                return api.updateCourse(course.id, updateData);
            } else {
                return api.createCourse(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
            alert(isRTL ? 'تم حفظ بيانات المقرر بنجاح' : 'Course saved successfully');
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
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                                {course ? (isRTL ? 'تعديل مقرر' : 'Edit Course') : (isRTL ? 'إضافة مقرر' : 'Add Course')}
                            </h2>
                            <p className="text-sm text-slate-500">Define academic subject and requirements</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Code */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{isRTL ? 'الرمز' : 'Code'}</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. CS101"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Units */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{isRTL ? 'عدد الوحدات' : 'Units'}</label>
                            <input
                                required
                                type="number"
                                min="1"
                                max="10"
                                value={formData.units}
                                onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        {/* Name Arabic */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-right">{isRTL ? 'اسم المقرر (بالعربي)' : 'Arabic Name'}</label>
                            <input
                                required
                                dir="rtl"
                                type="text"
                                value={formData.nameAr}
                                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold"
                            />
                        </div>

                        {/* Name English */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{isRTL ? 'اسم المقرر (بالإنجليزي)' : 'English Name'}</label>
                            <input
                                required
                                type="text"
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                {t('department')}
                            </label>
                            <select
                                required
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
                            >
                                <option value="">-- {isRTL ? 'اختر القسم' : 'Select Department'} --</option>
                                {departments?.map((d: any) => (
                                    <option key={d.id} value={d.id}>{isRTL ? d.nameAr : d.nameEn}</option>
                                ))}
                            </select>
                        </div>

                        {/* Semester Level */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                {t('level')}
                            </label>
                            <select
                                required
                                value={formData.semesterLevel}
                                onChange={(e) => setFormData({ ...formData, semesterLevel: parseInt(e.target.value) })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{t('semesterLevel', { level: i + 1 })}</option>
                                ))}
                            </select>
                        </div>
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
