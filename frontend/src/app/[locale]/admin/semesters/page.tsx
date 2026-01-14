// ===========================================
// Admin Semesters Management Page
// Overview of Academic Periods
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    Clock,
    CheckCircle2,
    History,
    ChevronRight,
    Loader2,
    Plus,
    BookOpen
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import SemesterFormModal from '@/components/semesters/SemesterFormModal';
import { useState } from 'react';

export default function SemestersPage() {
    const t = useTranslations('admin.semesters');
    const commonT = useTranslations('common');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSemester, setEditingSemester] = useState<any>(null);

    const openCreateForm = () => {
        setEditingSemester(null);
        setIsFormOpen(true);
    };

    const openEditForm = (semester: any) => {
        setEditingSemester(semester);
        setIsFormOpen(true);
    };

    // Fetch Semesters
    const { data: semesters, isLoading } = useQuery({
        queryKey: ['admin-semesters'],
        queryFn: () => api.getAdminSemesters(),
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-500" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-400 mt-1">{t('subtitle')}</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm font-bold"
                >
                    <Plus className="w-4 h-4" />
                    {t('addSemester')}
                </button>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500 font-medium">{commonT('loading')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {semesters?.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                            <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest">No semesters found</p>
                        </div>
                    ) : (
                        semesters?.map((semester: any) => {
                            const isActive = semester.status === 'ACTIVE' || semester.isActive;
                            return (
                                <div
                                    key={semester.id}
                                    className={cn(
                                        "group bg-slate-900/40 border p-6 rounded-[32px] backdrop-blur-xl transition-all duration-300",
                                        isActive ? "border-blue-500/30 ring-1 ring-blue-500/20 shadow-2xl shadow-blue-500/10" : "border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                            <Calendar className={cn("w-6 h-6", isActive ? "text-blue-400" : "text-slate-500")} />
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            isActive
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                : "bg-slate-800/50 text-slate-500 border-white/5"
                                        )}>
                                            {isActive ? t('active') : t('past')}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">
                                        {isRTL ? semester.nameAr : semester.nameEn}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-6">
                                        <Clock className="w-4 h-4 text-slate-600" />
                                        {format(new Date(semester.startDate), 'MMM yyyy')} - {format(new Date(semester.endDate), 'MMM yyyy')}
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Year</span>
                                            <span className="text-white font-mono font-bold">{semester.year}</span>
                                        </div>
                                        <div className="flex flex-col text-right rtl:text-left">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Term</span>
                                            <span className="text-white font-bold">{semester.term}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openEditForm(semester)}
                                        className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        {commonT('edit')}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Semester Form Modal */}
            <SemesterFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                semester={editingSemester}
                locale={locale}
            />
        </div>
    );
}
