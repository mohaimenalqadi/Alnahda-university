// ===========================================
// Student Academic Results Page
// Detailed Semester-wise performance and promotion status
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
    GraduationCap,
    ArrowLeft,
    Download,
    Printer,
    Trophy,
    AlertTriangle,
    CheckCircle2,
    BookOpen,
    Hash,
    Layers,
    Clock
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function StudentResultsPage() {
    const t = useTranslations('admin.students');
    const commonT = useTranslations('common');
    const { id, locale } = useParams() as { id: string, locale: string };
    const isRTL = locale === 'ar';
    const router = useRouter();

    const { data: results, isLoading } = useQuery({
        queryKey: ['admin-student-results', id],
        queryFn: () => api.getStudentAcademicResults(id),
        enabled: !!id,
    });

    const { data: student } = useQuery({
        queryKey: ['admin-student-details', id],
        queryFn: () => api.getAdminStudentDetails(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Calculating official results...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all text-sm font-bold"
                >
                    <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                    {commonT('back')}
                </button>
                <div className="flex items-center gap-3">
                    <button className="flex-1 sm:flex-none p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all flex items-center justify-center">
                        <Printer className="w-5 h-5" />
                    </button>
                    <button className="flex-[3] sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-600/20 transition-all font-bold text-sm">
                        <Download className="w-4 h-4" />
                        <span className="whitespace-nowrap">Download PDF</span>
                    </button>
                </div>
            </div>

            {/* Student Persona Card */}
            <div className="relative overflow-hidden bg-slate-900 border border-white/10 rounded-[24px] md:rounded-[40px] p-6 md:p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] md:rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl shadow-blue-600/20">
                        <div className="w-full h-full rounded-[22px] md:rounded-[30px] bg-slate-950 flex items-center justify-center border border-white/10">
                            <GraduationCap className="w-10 h-10 md:w-14 md:h-14 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left rtl:md:text-right">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[8px] md:text-xs font-black uppercase tracking-widest border border-blue-500/20">
                                Result Portfolio
                            </span>
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] md:text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                {student?.status}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3">
                            {isRTL ? student?.fullNameAr : student?.fullNameEn}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-slate-400 font-medium">
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-blue-500/50" />
                                <span className="font-mono text-white/90 text-sm md:text-base">{student?.registrationNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-blue-500/50" />
                                <span className="text-sm md:text-base">{isRTL ? student?.department.nameAr : student?.department.nameEn}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-blue-500/50" />
                                <span className="text-sm md:text-base">{isRTL ? `الفصل الدراسي ${student?.semesterLevel}` : `Level ${student?.semesterLevel}`}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-8">
                {results?.map((sem: any) => (
                    <div key={sem.semester.id} className="bg-slate-900/50 border border-white/5 rounded-[24px] md:rounded-[40px] overflow-hidden shadow-xl">
                        {/* Semester Header */}
                        <div className="px-5 md:px-8 py-4 md:py-6 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-950 flex items-center justify-center border border-white/10 shrink-0">
                                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                                        {isRTL ? sem.semester.nameAr : sem.semester.nameEn}
                                    </h3>
                                    {isRTL && sem.levelNameAr && (
                                        <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mt-0.5">{sem.levelNameAr}</p>
                                    )}
                                    {!isRTL && <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Academic Session Result</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                                <div className="text-left rtl:text-right md:text-right rtl:md:text-left">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-0.5">Avg Score</p>
                                    <p className="text-xl md:text-2xl font-black text-white leading-none">{sem.summary.averageScore}%</p>
                                </div>
                                <div className="hidden md:block w-px h-10 bg-white/5" />
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2",
                                        sem.summary.incompleteCourses === 0
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {sem.summary.incompleteCourses === 0 ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />}
                                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">
                                            {isRTL ? sem.summary.statusAr : (sem.summary.incompleteCourses === 0 ? 'PASSED' : 'FAILED')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/5">
                            <table className="w-full text-sm text-left rtl:text-right min-w-[700px]">
                                <thead className="bg-white/[0.01] text-slate-500 uppercase text-[9px] md:text-[10px] font-black tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="px-5 md:px-8 py-3 md:py-4">Course</th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-center">Units</th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-center">Work</th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-center">Exam</th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 text-center">Total</th>
                                        <th className="px-5 md:px-8 py-3 md:py-4 text-center">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-medium">
                                    {sem.grades.map((grade: any) => (
                                        <tr key={grade.courseId} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-5 md:px-8 py-4 md:py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-sm md:text-base mb-0.5 line-clamp-1">{isRTL ? grade.courseNameAr : grade.courseCode}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono opacity-60 uppercase">{grade.courseCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 md:py-5 text-center font-black text-slate-400">{grade.units}</td>
                                            <td className="px-4 md:px-6 py-4 md:py-5 text-center text-slate-400">{grade.courseworkScore}</td>
                                            <td className="px-4 md:px-6 py-4 md:py-5 text-center text-slate-400">{grade.finalExamScore}</td>
                                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                                                <span className="text-base md:text-lg font-black text-white">{grade.totalScore}</span>
                                            </td>
                                            <td className="px-5 md:px-8 py-4 md:py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-black mb-0.5 tracking-wider",
                                                        grade.passed ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" : "bg-red-500/10 text-red-500 border border-red-500/10"
                                                    )}>
                                                        {grade.letterGradeAr}
                                                    </span>
                                                    <span className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                        {grade.passed ? 'Success' : 'Failed'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Semester Summary Bar */}
                        <div className="px-5 md:px-8 py-5 md:py-6 bg-slate-950/20 border-t border-white/5 flex flex-wrap items-center gap-6 md:gap-10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase leading-none mb-1">Passed Units</p>
                                    <p className="text-base md:text-lg font-black text-white leading-none">{sem.summary.passedUnits} / {sem.summary.totalUnits}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/10">
                                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase leading-none mb-1">
                                        {isRTL ? 'المقررات غير المنجزة' : 'Incomplete'}
                                    </p>
                                    <p className="text-base md:text-lg font-black text-white leading-none">{sem.summary.incompleteCourses}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {results?.length === 0 && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                            <GraduationCap className="w-12 h-12 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
                        <p className="text-slate-500 max-w-sm">Academic records for this student have not been recorded or published yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
