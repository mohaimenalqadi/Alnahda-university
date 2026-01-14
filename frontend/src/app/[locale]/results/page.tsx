// ===========================================
// Student Results Page
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    GraduationCap,
    User,
    Building2,
    CalendarDays,
    Printer,
    LogOut,
    ChevronDown,
    Loader2,
    AlertCircle,
    Globe,
} from 'lucide-react';
import { api, SemesterResult, CourseResult } from '@/lib/api-client';
import { cn, getGradeClass, formatNumber } from '@/lib/utils';

export default function ResultsPage() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const isRTL = locale === 'ar';

    const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

    // Fetch profile
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['student-profile-v2'],
        queryFn: async () => {
            const data = await api.getProfile();
            console.log('[DEBUG] Profile fetched:', data);
            return data;
        },
        staleTime: 0, // Always fetch fresh
    });

    // Fetch results
    const { data: results, isLoading: resultsLoading, error: resultsError } = useQuery({
        queryKey: ['student-results-v2'],
        queryFn: async () => {
            const data = await api.getAllResults();
            console.log('[DEBUG] Results fetched:', data);
            if (data && data.length > 0) {
                console.log('[DEBUG] First semester summary:', data[0].summary);
                console.log('[DEBUG] First semester levelNameAr:', data[0].levelNameAr);
            }
            return data;
        },
        staleTime: 0,
    });

    // Fetch GPA
    const { data: gpaSummary } = useQuery({
        queryKey: ['student-gpa-v2'],
        queryFn: () => api.getGPASummary(),
        staleTime: 0,
    });

    // Set first semester as default
    useEffect(() => {
        if (results && results.length > 0 && !selectedSemester) {
            setSelectedSemester(results[0].semesterId);
        }
    }, [results, selectedSemester]);

    const currentSemester = results?.find((s) => s.semesterId === selectedSemester);

    // Debug log current semester
    useEffect(() => {
        if (currentSemester) {
            console.log('[DEBUG] Current semester:', currentSemester.semesterNameAr);
            console.log('[DEBUG] levelNameAr:', currentSemester.levelNameAr);
            console.log('[DEBUG] summary:', currentSemester.summary);
        }
    }, [currentSemester]);

    const handleLogout = async () => {
        try {
            await api.studentLogout();
            router.push(`/${locale}/login`);
        } catch (error) {
            console.error('Logout error:', error);
            router.push(`/${locale}/login`);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const toggleLocale = () => {
        const newLocale = locale === 'ar' ? 'en' : 'ar';
        router.push(`/${newLocale}/results`);
    };

    if (profileLoading || resultsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (resultsError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">{t('common.error')}</p>
                    <button onClick={() => router.push(`/${locale}/login`)} className="btn-primary">
                        {t('common.login')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 no-print">
                <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-gold rounded-xl md:rounded-2xl flex items-center justify-center shadow-gold p-0.5 shrink-0">
                                <div className="w-full h-full bg-white rounded-[10px] md:rounded-[14px] flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 md:w-7 h-7 text-primary-500" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-black text-base md:text-xl tracking-tight text-slate-900 truncate">
                                    {t('common.appName')}
                                </h1>
                                <p className="text-slate-400 text-[8px] md:text-xs font-black uppercase tracking-widest leading-none mt-0.5 truncate">
                                    {t('results.title')}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 md:gap-3">
                            <button
                                onClick={toggleLocale}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white hover:bg-slate-50 
                         border border-slate-200 rounded-xl md:rounded-2xl transition-all font-bold text-[10px] md:text-xs tracking-widest text-slate-600 shadow-sm shrink-0"
                            >
                                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500" />
                                <span className="hidden sm:inline">{locale === 'ar' ? 'English' : 'العربية'}</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white hover:bg-slate-50 
                         border border-slate-200 rounded-xl md:rounded-2xl transition-all font-bold text-[10px] md:text-xs tracking-widest text-slate-600 shadow-sm shrink-0"
                            >
                                <Printer className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500" />
                                <span className="hidden sm:inline">{t('common.print')}</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-50 hover:bg-red-100 
                         border border-red-200 rounded-xl md:rounded-2xl transition-all font-bold text-[10px] md:text-xs tracking-widest text-red-600 shrink-0"
                            >
                                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">{t('common.logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Student Info Card */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-4">
                            <div className="card-header">
                                <h2 className="font-semibold text-gray-900">{t('results.studentInfo')}</h2>
                            </div>
                            <div className="card-body space-y-4">
                                {/* Name */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
                                        <User className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">
                                            {t('results.name')}
                                        </p>
                                        <p className="font-bold text-slate-900 text-lg">
                                            {isRTL ? profile?.fullNameAr : profile?.fullNameEn}
                                        </p>
                                    </div>
                                </div>

                                {/* Registration Number */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
                                        <CalendarDays className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">
                                            {t('results.registrationNumber')}
                                        </p>
                                        <p className="font-bold text-slate-900 text-lg font-mono tracking-tighter" dir="ltr">
                                            {profile?.registrationNumber}
                                        </p>
                                    </div>
                                </div>

                                {/* Department */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
                                        <Building2 className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">
                                            {t('results.department')}
                                        </p>
                                        <p className="font-bold text-slate-900 text-lg truncate">
                                            {isRTL ? profile?.department.nameAr : profile?.department.nameEn}
                                        </p>
                                    </div>
                                </div>

                                {/* Semester Level */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
                                        <GraduationCap className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">
                                            {isRTL ? 'الفصل الدراسي' : 'Academic Semester'}
                                        </p>
                                        <p className="font-bold text-slate-900 text-lg">
                                            {(() => {
                                                if (currentSemester?.levelNameAr) return currentSemester.levelNameAr;
                                                const level = profile?.semesterLevel || currentSemester?.currentLevel;
                                                if (!level) return isRTL ? 'الفصل الدراسي -' : 'Semester -';
                                                if (isRTL) {
                                                    const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];
                                                    return `الفصل الدراسي ${ordinals[level - 1] || level}`;
                                                }
                                                return `Semester ${level}`;
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <hr className="border-slate-100 my-6" />

                                {/* GPA Summary */}
                                {gpaSummary && (
                                    <div className="text-center py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="gpa-label mb-1 md:mb-2 text-slate-400 font-black tracking-widest text-[8px] md:text-[10px] uppercase">
                                            {t('results.cumulativeGPA')}
                                        </p>
                                        <p className="text-3xl md:text-5xl font-black text-primary-600 tracking-tighter mb-2 md:mb-4">
                                            {gpaSummary.cumulativeGPA.toFixed(4)}
                                        </p>
                                        <div className="inline-flex px-3 md:px-4 py-1.5 bg-primary-50 rounded-full border border-primary-100 shadow-sm">
                                            <p className="text-[10px] md:text-xs font-black text-primary-700 uppercase tracking-widest">
                                                {isRTL ? gpaSummary.classificationAr : gpaSummary.classification}
                                            </p>
                                        </div>
                                        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100">
                                            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                                                {t('results.totalCredits')}: <span className="text-slate-900 font-black ml-1">{gpaSummary.totalCreditsEarned}</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="lg:col-span-2">
                        {/* Semester Selector */}
                        <div className="mb-4 no-print">
                            <label className="label">{t('results.selectSemester')}</label>
                            <div className="relative group">
                                <select
                                    value={selectedSemester || ''}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="input h-14 bg-white pr-12 pl-12 cursor-pointer appearance-none hover:border-primary-500 shadow-sm"
                                >
                                    {results?.map((semester) => (
                                        <option key={semester.semesterId} value={semester.semesterId} className="bg-white text-slate-900">
                                            {isRTL ? semester.semesterNameAr : semester.semesterNameEn}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-primary-400 pointer-events-none transition-colors" />
                            </div>
                        </div>

                        {/* Results Card */}
                        <div className="card">
                            <div className="card-header flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h2 className="font-black text-slate-900 tracking-widest uppercase text-sm">
                                        {isRTL ? currentSemester?.semesterNameAr : currentSemester?.semesterNameEn}
                                    </h2>
                                    {isRTL && (currentSemester?.levelNameAr || profile?.semesterLevel) && (
                                        <span className="text-[10px] text-primary-600 font-black uppercase tracking-widest mt-1">
                                            {currentSemester?.levelNameAr || `الفصل الدراسي ${profile?.semesterLevel}`}
                                        </span>
                                    )}
                                </div>
                                {currentSemester && currentSemester.summary && (
                                    <div className="text-sm font-black text-slate-500 tracking-widest uppercase">
                                        <span className="hidden sm:inline">{t('results.semesterGPA')}:{' '}</span>
                                        <span className="text-primary-600 ml-1">
                                            {formatNumber(currentSemester.summary.gpa, locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {currentSemester && currentSemester.courses.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th className="!bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.courseCode')}</th>
                                                <th className="!bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.courseName')}</th>
                                                <th className="hidden md:table-cell text-center !bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.credits')}</th>
                                                <th className="hidden lg:table-cell text-center !bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.coursework')}</th>
                                                <th className="hidden lg:table-cell text-center !bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.finalExam')}</th>
                                                <th className="text-center !bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.totalScore')}</th>
                                                <th className="text-center !bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.grade')}</th>
                                                <th className="hidden sm:table-cell text-center !bg-slate-50 !text-slate-600 border-b border-slate-200 text-[10px] md:text-sm">{t('results.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentSemester.courses.map((course, index) => (
                                                <tr key={index} className="border-b border-slate-100 transition-colors">
                                                    <td className="font-mono text-[10px] md:text-sm text-slate-500 py-3 md:py-4 px-3 md:px-4" dir="ltr">
                                                        {course.courseCode}
                                                    </td>
                                                    <td className="font-bold text-slate-900 text-xs md:text-sm py-3 md:py-4 px-3 md:px-4 min-w-[120px]">
                                                        <span className="line-clamp-2 md:line-clamp-1">{isRTL ? course.courseNameAr : (course.courseNameEn || course.courseCode)}</span>
                                                    </td>
                                                    <td className="hidden md:table-cell text-center text-slate-600 font-medium">{course.units}</td>
                                                    <td className="hidden lg:table-cell text-center text-slate-600 font-medium">{course.courseworkScore}</td>
                                                    <td className="hidden lg:table-cell text-center text-slate-600 font-medium">{course.finalExamScore}</td>
                                                    <td className="text-center font-black text-slate-900 text-sm md:text-base py-3 md:py-4 px-3 md:px-4">
                                                        {formatNumber(course.totalScore, locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-center py-3 md:py-4 px-3 md:px-4">
                                                        <span className={cn('grade-badge !rounded-lg !px-2 md:!px-3 font-black text-[9px] md:text-xs', getGradeClass(course.letterGrade))}>
                                                            {isRTL ? (course.letterGradeAr || course.letterGrade) : course.letterGrade}
                                                        </span>
                                                    </td>
                                                    <td className="hidden sm:table-cell text-center py-3 md:py-4 px-3 md:px-4">
                                                        <span className={cn(
                                                            "font-black text-[9px] md:text-[10px] uppercase tracking-widest",
                                                            course.passed ? 'text-emerald-600' : 'text-red-600'
                                                        )}>
                                                            {course.passed ? (isRTL ? 'ناجح' : 'Passed') : (isRTL ? 'راسب' : 'Failed')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="card-body text-center py-12">
                                    <p className="text-gray-500">{t('results.noResults')}</p>
                                </div>
                            )}

                            {/* Summary Footer */}
                            {currentSemester && (
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    {currentSemester.summary ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 p-3 md:p-0 bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-0">
                                                <span className="text-[8px] md:text-[10px] text-slate-400 block uppercase font-black tracking-widest leading-tight shrink-0">{t('results.totalCredits')}</span>
                                                <span className="text-base md:text-xl font-black text-slate-900 leading-none">{currentSemester.summary.totalUnits}</span>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 p-3 md:p-0 bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-0">
                                                <span className="text-[8px] md:text-[10px] text-slate-400 block uppercase font-black tracking-widest leading-tight shrink-0">{isRTL ? 'الوحدات المنجزة' : 'Completed Units'}</span>
                                                <span className="text-base md:text-xl font-black text-emerald-600 leading-none">{currentSemester.summary.completedUnits}</span>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 p-3 md:p-0 bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-0">
                                                <span className="text-[8px] md:text-[10px] text-slate-400 block uppercase font-black tracking-widest leading-tight shrink-0">{isRTL ? 'المقررات غير المنجزة' : 'Incomplete'}</span>
                                                <span className="text-base md:text-xl font-black text-red-600 leading-none">{currentSemester.summary.incompleteCourses}</span>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 p-3 md:p-0 bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-0 text-primary-600">
                                                <span className="text-[8px] md:text-[10px] text-slate-400 block uppercase font-black tracking-widest leading-tight shrink-0">{t('results.semesterGPA')}</span>
                                                <span className="text-base md:text-xl font-black leading-none">{formatNumber(currentSemester.summary.gpa, locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 p-3 md:p-0 bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-0">
                                                <span className="text-[8px] md:text-[10px] text-slate-400 block uppercase font-black tracking-widest leading-tight shrink-0">{t('results.status')}</span>
                                                <span className={cn(
                                                    "text-sm md:text-lg font-black uppercase tracking-tighter leading-none",
                                                    currentSemester.summary.incompleteCourses === 0 ? "text-emerald-600" : "text-amber-600"
                                                )}>
                                                    {isRTL ? currentSemester.summary.statusAr : (currentSemester.summary.incompleteCourses === 0 ? 'Passed' : 'Failed')}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                                            {isRTL ? 'جاري تحميل الملخص...' : 'Loading summary...'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Print Footer */}
            <footer className="hidden print:block text-center text-sm text-gray-500 py-4 border-t">
                <p>{t('login.footer')}</p>
                <p className="mt-1">
                    {new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </footer>
        </div>
    );
}
