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
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all text-sm font-bold"
                >
                    <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                    {commonT('back')}
                </button>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all">
                        <Printer className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-600/20 transition-all font-bold text-sm">
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Student Persona Card */}
            <div className="relative overflow-hidden bg-slate-900 border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl shadow-blue-600/20">
                        <div className="w-full h-full rounded-[30px] bg-slate-950 flex items-center justify-center border border-white/10">
                            <GraduationCap className="w-14 h-14 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left rtl:md:text-right">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20">
                                Student Result Portfolio
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                {student?.status}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                            {isRTL ? student?.fullNameAr : student?.fullNameEn}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-400 font-medium">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-blue-500/50" />
                                <span className="font-mono text-white/90">{student?.registrationNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-500/50" />
                                <span>{isRTL ? student?.department.nameAr : student?.department.nameEn}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500/50" />
                                <span>{isRTL ? `الفصل الدراسي ${student?.semesterLevel}` : `Semester Level ${student?.semesterLevel}`}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-8">
                {results?.map((sem: any) => (
                    <div key={sem.semester.id} className="bg-slate-900/50 border border-white/5 rounded-[40px] overflow-hidden shadow-xl">
                        {/* Semester Header */}
                        <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/10">
                                    <BookOpen className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white leading-tight">
                                        {isRTL ? sem.semester.nameAr : sem.semester.nameEn}
                                    </h3>
                                    {isRTL && sem.levelNameAr && (
                                        <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mt-0.5">{sem.levelNameAr}</p>
                                    )}
                                    {!isRTL && <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Academic Session Result</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right rtl:text-left">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-0.5">Avg Score</p>
                                    <p className="text-2xl font-black text-white leading-none">{sem.summary.averageScore}%</p>
                                </div>
                                <div className="w-px h-10 bg-white/5" />
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "px-6 py-2 rounded-2xl flex items-center gap-2",
                                        sem.summary.incompleteCourses === 0
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {sem.summary.incompleteCourses === 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                        <span className="text-sm font-black uppercase tracking-widest">
                                            {isRTL ? sem.summary.statusAr : (sem.summary.incompleteCourses === 0 ? 'PASSED' : 'FAILED')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left rtl:text-right">
                                <thead className="bg-white/[0.01] text-slate-500 uppercase text-[10px] font-black tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Course Details</th>
                                        <th className="px-6 py-4 text-center">Units</th>
                                        <th className="px-6 py-4 text-center">Coursework</th>
                                        <th className="px-6 py-4 text-center">Final Exam</th>
                                        <th className="px-6 py-4 text-center">Total</th>
                                        <th className="px-8 py-4 text-center">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sem.grades.map((grade: any) => (
                                        <tr key={grade.courseId} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-base">{isRTL ? grade.courseNameAr : grade.courseCode}</span>
                                                    <span className="text-xs text-slate-500 font-mono">{grade.courseCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-black text-slate-400">{grade.units}</td>
                                            <td className="px-6 py-5 text-center font-medium text-slate-300">{grade.courseworkScore}</td>
                                            <td className="px-6 py-5 text-center font-medium text-slate-300">{grade.finalExamScore}</td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-lg font-black text-white">{grade.totalScore}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-xs font-black mb-1",
                                                        grade.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {grade.letterGradeAr}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">
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
                        <div className="px-8 py-6 bg-slate-950/20 border-t border-white/5 flex flex-wrap items-center gap-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-600 font-black uppercase leading-none mb-1">Passed Units</p>
                                    <p className="text-lg font-black text-white leading-none">{sem.summary.passedUnits} / {sem.summary.totalUnits}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-600 font-black uppercase leading-none mb-1">
                                        {isRTL ? 'المقررات غير المنجزة' : 'Incomplete Courses'}
                                    </p>
                                    <p className="text-lg font-black text-white leading-none">{sem.summary.incompleteCourses}</p>
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
