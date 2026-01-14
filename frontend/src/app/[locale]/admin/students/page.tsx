// ===========================================
// Admin Student Management Page
// List and Search Students
// ===========================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit2,
    Download,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    X,
    FilterX
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import StudentDetailModal from '@/components/students/StudentDetailModal';
import StudentFormModal from '@/components/students/StudentFormModal';

export default function StudentsPage() {
    const t = useTranslations('admin.students');
    const commonT = useTranslations('common');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';

    // State for filtering
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [limit] = useState(10);

    // Modal state
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);

    const openDetails = (id: string) => {
        setSelectedStudentId(id);
        setIsDetailsOpen(true);
    };

    const openCreateForm = () => {
        setEditingStudent(null);
        setIsFormOpen(true);
    };

    const openEditForm = (student: any) => {
        setEditingStudent(student);
        setIsFormOpen(true);
    };

    // Fetch Departments (for the form)
    const { data: departments = [] } = useQuery({
        queryKey: ['admin-departments'],
        queryFn: () => api.getAdminDepartments(),
    });

    // Fetch Students
    const { data: studentsData, isLoading } = useQuery({
        queryKey: ['admin-students', page, search, statusFilter],
        queryFn: () => api.getAdminStudents({
            page,
            limit,
            search,
            status: statusFilter
        }),
        placeholderData: (previous) => previous, // Keep old data while fetching
    });

    const students = studentsData?.data || [];
    const pagination = studentsData?.pagination;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-400 mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5 transition-all text-sm font-medium">
                        <Download className="w-4 h-4" />
                        {commonT('download')}
                    </button>
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm font-bold"
                    >
                        <UserPlus className="w-4 h-4" />
                        {t('addStudent')}
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full text-slate-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2 px-4 focus:ring-blue-500/50 focus:outline-none transition-all cursor-pointer"
                >
                    <option value="">{t('status')}: All</option>
                    <option value="ACTIVE">{t('active')}</option>
                    <option value="INACTIVE">{t('inactive')}</option>
                    <option value="EXPELLED">{t('expelled')}</option>
                    <option value="GRADUATED">{t('graduated')}</option>
                </select>

                {/* Clear All */}
                {(search || statusFilter) && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-2 px-2"
                    >
                        <FilterX className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Table Area */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right text-slate-300">
                        <thead className="bg-white/5 text-slate-400 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-4 md:px-6 py-4 hidden md:table-cell">{t('registrationNumber')}</th>
                                <th className="px-4 md:px-6 py-4">{isRTL ? 'الاسم' : 'Name'}</th>
                                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">{t('department')}</th>
                                <th className="px-4 md:px-6 py-4 text-center">{t('status')}</th>
                                <th className="px-4 md:px-6 py-4 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.length === 0 && !isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No students found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr
                                        key={student.id}
                                        onClick={() => openDetails(student.id)}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-4 md:px-6 py-4 font-mono font-medium text-white/90 hidden md:table-cell">
                                            {student.registrationNumber}
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[150px] md:max-w-none">
                                                    {isRTL ? student.fullNameAr : student.fullNameEn}
                                                </span>
                                                <span className="text-xs text-slate-500 truncate max-w-[150px] md:max-w-none">{student.email}</span>
                                                <span className="md:hidden text-[10px] text-slate-500 mt-1">#{student.registrationNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-white/80">{isRTL ? student.department.nameAr : student.department.nameEn}</span>
                                                <span className="text-[10px] text-slate-500 bg-white/5 w-fit px-1.5 py-0.5 rounded mt-1 font-bold">
                                                    {student.department.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-tighter uppercase inline-block",
                                                student.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                    student.status === 'INACTIVE' ? "bg-slate-500/10 text-slate-500 border border-slate-500/20" :
                                                        student.status === 'EXPELLED' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                            "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                            )}>
                                                {t(student.status.toLowerCase() as any)}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1 md:gap-2">
                                                <button
                                                    onClick={() => openDetails(student.id)}
                                                    className="p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                    title={commonT('view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditForm(student)}
                                                    className="p-1.5 md:p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/5 rounded-lg transition-all"
                                                    title={commonT('edit')}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <div className="hidden md:block w-px h-4 bg-white/10 mx-1" />
                                                <button className="hidden md:block p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                        <div className="text-xs text-slate-500 font-medium">
                            Showing <span className="text-white">{(page - 1) * limit + 1}</span> to <span className="text-white">{Math.min(page * limit, pagination.total)}</span> of <span className="text-white">{pagination.total}</span> students
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(pagination.totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                            page === i + 1
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-slate-500 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <ChevronRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Student Details Modal */}
            {selectedStudentId && (
                <StudentDetailModal
                    studentId={selectedStudentId}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    locale={locale}
                />
            )}

            {/* Student Form Modal */}
            <StudentFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                student={editingStudent}
                departments={departments}
                locale={locale}
            />
        </div>
    );
}
