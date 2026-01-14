// ===========================================
// Admin Courses Management Page
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    BookOpen,
    Hash,
    Layers,
    ChevronRight,
    Loader2,
    Plus,
    Building2,
    Search,
    Filter
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import CourseFormModal from '@/components/departments/CourseFormModal';
import { useState } from 'react';

export default function CoursesPage() {
    const t = useTranslations('admin.gradeManagement');
    const commonT = useTranslations('common');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const [departmentId, setDepartmentId] = useState<string>('');
    const [semesterLevel, setSemesterLevel] = useState<number | ''>('');
    const [searchQuery, setSearchQuery] = useState('');

    const openCreateForm = () => {
        setEditingCourse(null);
        setIsFormOpen(true);
    };

    const openEditForm = (course: any) => {
        setEditingCourse(course);
        setIsFormOpen(true);
    };

    // Fetch Courses with filters
    const { data: courses, isLoading } = useQuery({
        queryKey: ['admin-courses', departmentId, semesterLevel],
        queryFn: () => api.getAdminCourses(departmentId || undefined, semesterLevel as number || undefined),
    });

    const { data: departments } = useQuery({
        queryKey: ['admin-departments'],
        queryFn: () => api.getAdminDepartments(),
    });

    const filteredCourses = courses?.filter((c: any) =>
        c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                        {isRTL ? 'المقررات الدراسية' : 'Course Management'}
                    </h1>
                    <p className="text-slate-400 mt-1">{isRTL ? 'إدارة وتحديد المقررات لكل قسم وفصل' : 'Manage academic subjects by department and level'}</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm font-bold"
                >
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'إضافة مقرر' : 'Add Course'}
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex flex-wrap items-center gap-4 shadow-xl backdrop-blur-xl">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500", isRTL && "right-3 left-auto")} />
                    <input
                        type="text"
                        placeholder={isRTL ? 'بحث بالاسم أو الرمز...' : 'Search by name or code...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "w-full bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    />
                </div>

                <div className="flex items-center gap-3 min-w-[200px]">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500/50 focus:outline-none cursor-pointer"
                    >
                        <option value="">{isRTL ? 'كل الأقسام' : 'All Departments'}</option>
                        {departments?.map((d: any) => (
                            <option key={d.id} value={d.id}>{isRTL ? d.nameAr : d.nameEn}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3 min-w-[150px]">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <select
                        value={semesterLevel}
                        onChange={(e) => setSemesterLevel(e.target.value ? parseInt(e.target.value) : '')}
                        className="bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500/50 focus:outline-none cursor-pointer"
                    >
                        <option value="">{isRTL ? 'كل الفصول' : 'All Levels'}</option>
                        {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{t('semesterLevel', { level: i + 1 })}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500 font-medium">{commonT('loading')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses?.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                            <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest">No courses found</p>
                        </div>
                    ) : (
                        filteredCourses?.map((course: any) => (
                            <div
                                key={course.id}
                                onClick={() => openEditForm(course)}
                                className="group bg-slate-900/40 border border-white/5 p-6 rounded-[32px] backdrop-blur-xl hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                            <BookOpen className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
                                            {course.code}
                                        </span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                        {course.units} Units
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1 text-left rtl:text-right">
                                    {isRTL ? course.nameAr : course.nameEn}
                                </h3>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                        <Building2 className="w-3.5 h-3.5 text-slate-600" />
                                        {isRTL ? course.department.nameAr : course.department.nameEn}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                        <Layers className="w-3.5 h-3.5 text-slate-600" />
                                        {t('semesterLevel', { level: course.semesterLevel })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Academic Subject</span>
                                    <ChevronRight className={cn("w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all", isRTL && "rotate-180 group-hover:-translate-x-1")} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Course Form Modal */}
            <CourseFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                course={editingCourse}
                locale={locale}
            />
        </div>
    );
}
