// ===========================================
// Student Detail Modal
// Displays complete student profile and academic history
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    User,
    Mail,
    Calendar,
    Building2,
    GraduationCap,
    Shield,
    Clock,
    Award,
    FileText
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';

interface StudentDetailModalProps {
    studentId: string;
    isOpen: boolean;
    onClose: () => void;
    locale: string;
}

export default function StudentDetailModal({ studentId, isOpen, onClose, locale }: StudentDetailModalProps) {
    const t = useTranslations('admin.students');
    const commonT = useTranslations('common');
    const isRTL = locale === 'ar';

    const { data: student, isLoading } = useQuery({
        queryKey: ['admin-student-details', studentId],
        queryFn: () => api.getAdminStudentDetails(studentId),
        enabled: isOpen && !!studentId,
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[20px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
                {/* Header */}
                <div className="px-4 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-white truncate max-w-[180px] md:max-w-none">
                                {isLoading ? 'Loading Student...' : (isRTL ? student.fullNameAr : student.fullNameEn)}
                            </h2>
                            <p className="text-xs md:text-sm text-slate-500 font-mono">{student?.registrationNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 md:p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 md:py-20 gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-500 animate-pulse text-xs md:text-sm font-medium">Fetching academic records...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                <div className="bg-slate-950/50 border border-white/5 p-4 md:p-5 rounded-2xl space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('status')}</p>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", student.status === 'ACTIVE' ? "bg-emerald-500" : "bg-red-500")} />
                                        <span className="text-base md:text-lg font-bold text-white">{t(student.status.toLowerCase())}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-950/50 border border-white/5 p-4 md:p-5 rounded-2xl space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('department')}</p>
                                    <p className="text-base md:text-lg font-bold text-white truncate">{isRTL ? student.department.nameAr : student.department.nameEn}</p>
                                </div>
                                <div className="bg-slate-950/50 border border-white/5 p-4 md:p-5 rounded-2xl space-y-1 sm:col-span-2 md:col-span-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {isRTL ? 'الفصل الدراسي' : 'Semester'}
                                    </p>
                                    <p className="text-base md:text-lg font-bold text-white">{student.semesterLevel || 1}</p>
                                </div>
                            </div>

                            {/* Detailed Info Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        Personal Information
                                    </h3>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
                                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
                                            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[9px] md:text-[10px] text-slate-600 font-bold uppercase">Email Address</p>
                                                <p className="text-white/90 truncate">{student.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
                                            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                            <div>
                                                <p className="text-[9px] md:text-[10px] text-slate-600 font-bold uppercase">Date of Birth</p>
                                                <p className="text-white/90">{formatDate(student.dateOfBirth, locale)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
                                            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                                            <div>
                                                <p className="text-[9px] md:text-[10px] text-slate-600 font-bold uppercase">Enrollment Date</p>
                                                <p className="text-white/90">{formatDate(student.createdAt, locale)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Summary */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-purple-500" />
                                        Performance Overview
                                    </h3>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                                            <Award className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                                        </div>
                                        <p className="text-2xl md:text-3xl font-black text-white">N/A</p>
                                        <p className="text-[10px] md:text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Cumulative GPA</p>
                                        <p className="text-[10px] text-slate-600 mt-4 px-4 italic">Full academic record is calculated upon semester publishing.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Enrollments Table */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-500" />
                                    Active Enrollments
                                </h3>
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-[11px] md:text-xs text-left rtl:text-right">
                                        <thead className="bg-white/5 text-slate-500">
                                            <tr>
                                                <th className="px-4 md:px-6 py-3 font-bold uppercase tracking-wider">Course</th>
                                                <th className="px-4 md:px-6 py-3 font-bold uppercase tracking-wider hidden sm:table-cell">Semester</th>
                                                <th className="px-4 md:px-6 py-3 font-bold uppercase tracking-wider text-center">Units</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {student.enrollments?.length > 0 ? (
                                                student.enrollments.map((en: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 md:px-6 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-white">{isRTL ? en.courseUnit.course.nameAr : en.courseUnit.course.nameEn}</span>
                                                                <span className="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-wider">{en.courseUnit.course.code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3 text-slate-400 hidden sm:table-cell">
                                                            {isRTL ? en.semester.nameAr : en.semester.nameEn}
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3 text-center font-bold text-blue-500">
                                                            {en.courseUnit.units}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-600 font-medium italic">
                                                        No current semester enrollments found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 md:px-8 py-4 md:py-6 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all"
                    >
                        {commonT('close')}
                    </button>
                    <a
                        href={`/${locale}/admin/students/${studentId}/results`}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-center"
                    >
                        {isRTL ? 'عرض النتائج الأكاديمية' : 'View Academic Results'}
                    </a>
                </div>
            </div>
        </div>
    );
}
