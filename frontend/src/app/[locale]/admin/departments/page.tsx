// ===========================================
// Admin Departments Management Page
// Overview of University Academic Units
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    School,
    Hash,
    Users,
    ChevronRight,
    Loader2,
    Plus,
    Building2,
    Search
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import DepartmentFormModal from '@/components/departments/DepartmentFormModal';
import { useState } from 'react';

export default function DepartmentsPage() {
    const t = useTranslations('admin.departments');
    const commonT = useTranslations('common');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<any>(null);

    const openCreateForm = () => {
        setEditingDepartment(null);
        setIsFormOpen(true);
    };

    const openEditForm = (dept: any) => {
        setEditingDepartment(dept);
        setIsFormOpen(true);
    };

    // Fetch Departments
    const { data: departments, isLoading } = useQuery({
        queryKey: ['admin-departments'],
        queryFn: () => api.getAdminDepartments(),
    });

    const universityDepartments = departments || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <School className="w-8 h-8 text-emerald-500" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-400 mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={commonT('search')}
                            className="bg-slate-900/50 border border-white/10 text-white text-sm rounded-xl py-2 px-10 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none w-64 transition-all"
                        />
                        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500", isRTL && "right-3 left-auto")} />
                    </div>
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        {t('addDepartment')}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-medium">{commonT('loading')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {universityDepartments.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                            <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest">No departments found</p>
                        </div>
                    ) : (
                        universityDepartments.map((dept: any) => (
                            <div
                                key={dept.id}
                                onClick={() => openEditForm(dept)}
                                className="group bg-slate-900/40 border border-white/5 p-6 rounded-[32px] backdrop-blur-xl hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer text-left rtl:text-right"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-emerald-500/10 transition-colors duration-300">
                                        <Building2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Hash className="w-3 h-3" />
                                        {dept.code}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
                                    {isRTL ? dept.nameAr : dept.nameEn}
                                </h3>

                                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-8">
                                    <Users className="w-4 h-4 text-slate-600" />
                                    {t('studentCount')}: <span className="text-white font-mono">{dept._count?.students || 0}</span>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Management</span>
                                    <ChevronRight className={cn("w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all", isRTL && "rotate-180 group-hover:-translate-x-1")} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Department Form Modal */}
            <DepartmentFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                department={editingDepartment}
                locale={locale}
            />
        </div>
    );
}
