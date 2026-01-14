// ===========================================
// Admin Grade Management Page
// Student-Centric Grade Recording System
// ===========================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    GraduationCap,
    Search,
    X,
    Save,
    Send,
    AlertCircle,
    CheckCircle2,
    BookOpen,
    ChevronDown,
    Loader2,
    Building2,
    User,
    Plus,
    Trash2,
    Calendar,
    Hash,
    Users,
    BarChart3
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface Student {
    id: string;
    fullNameAr: string;
    fullNameEn: string;
    registrationNumber: string;
    email: string;
    status: string;
    academicYear: number;
    semesterLevel?: number;
    department: {
        id?: string;
        code: string;
        nameAr: string;
        nameEn: string;
    };
}

interface Course {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    units?: number;
    department?: {
        id: string;
        code: string;
        nameAr: string;
        nameEn: string;
    };
}

interface GradeEntry {
    courseId: string;
    course: Course;
    courseworkScore: number;
    finalExamScore: number;
    totalScore: number;
    letterGrade: string;
    isPublished: boolean;
    gradeId?: string;
    enrollmentId?: string;
    semesterId?: string;
}

export default function GradeManagementPage() {
    const t = useTranslations('admin.gradeManagement');
    const commonT = useTranslations('common');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';
    const queryClient = useQueryClient();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    const [studentGrades, setStudentGrades] = useState<GradeEntry[]>([]);
    const [semesterSummary, setSemesterSummary] = useState<any>(null); // New state for summary
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saving' | 'success' | 'error' | null>(null);

    // Fetch all students
    const { data: studentsData, isLoading: studentsLoading } = useQuery({
        queryKey: ['admin-students', departmentFilter, searchQuery],
        queryFn: () => api.getAdminStudents({
            page: 1,
            limit: 100,
            search: searchQuery || undefined,
            departmentId: departmentFilter || undefined,
        }),
    });

    // Fetch departments
    const { data: departments } = useQuery({
        queryKey: ['admin-departments'],
        queryFn: () => api.getAdminDepartments(),
    });

    // Fetch semesters
    const { data: semesters } = useQuery({
        queryKey: ['admin-semesters'],
        queryFn: () => api.getAdminSemesters(),
    });

    // Fetch stats to get active semester
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.getAdminStats(),
    });

    // Set active semester initially
    useEffect(() => {
        if (stats?.activeSemester?.id && !selectedSemester) {
            setSelectedSemester(stats.activeSemester.id);
        }
    }, [stats, selectedSemester]);

    // Find the student's department ID from departments list (since student API doesn't return dept.id)
    const studentDepartmentId = useMemo(() => {
        if (!selectedStudent?.department?.code || !departments) return undefined;
        const dept = departments.find((d: any) => d.code === selectedStudent.department?.code);
        return dept?.id;
    }, [selectedStudent?.department?.code, departments]);

    // Fetch courses for selected student's department
    const { data: departmentCourses } = useQuery({
        queryKey: ['admin-courses', studentDepartmentId],
        queryFn: () => api.getAdminCourses(studentDepartmentId),
        enabled: !!studentDepartmentId,
    });

    // Fetch student's existing grades/enrollments for selected semester
    const { data: studentResults, refetch: refetchStudentResults } = useQuery({
        queryKey: ['student-results', selectedStudent?.id, selectedSemester],
        queryFn: () => api.getStudentAcademicResults(selectedStudent!.id, selectedSemester),
        enabled: !!selectedStudent?.id && !!selectedSemester,
    });

    // Load student's existing grades when selected or semester changes
    useEffect(() => {
        if (selectedStudent) {
            const grades: GradeEntry[] = [];
            let summary = null;

            // If we have results for the selected semester
            if (Array.isArray(studentResults)) {
                const targetSemesterResult = studentResults.find((s: any) =>
                    s.semesterId === selectedSemester || s.semester?.id === selectedSemester
                );

                if (targetSemesterResult) {
                    summary = targetSemesterResult.summary ? {
                        ...targetSemesterResult.summary,
                        semesterNameAr: targetSemesterResult.semesterNameAr,
                        semesterNameEn: targetSemesterResult.semesterNameEn,
                        levelNameAr: targetSemesterResult.levelNameAr,
                    } : null;

                    if (targetSemesterResult.courses) {
                        targetSemesterResult.courses.forEach((course: any) => {
                            grades.push({
                                courseId: course.courseId || course.id,
                                course: {
                                    id: course.courseId || course.id,
                                    code: course.courseCode,
                                    nameAr: course.courseNameAr,
                                    nameEn: course.courseNameEn,
                                    units: course.units,
                                },
                                courseworkScore: course.courseworkScore || 0,
                                finalExamScore: course.finalExamScore || 0,
                                totalScore: course.totalScore || 0,
                                letterGrade: course.letterGrade || '--',
                                isPublished: course.isPublished ?? false,
                                gradeId: course.gradeId,
                                enrollmentId: course.enrollmentId,
                                semesterId: targetSemesterResult.semesterId,
                            });
                        });
                    }
                }
            }

            setStudentGrades(grades);
            setSemesterSummary(summary);
        }
    }, [studentResults, selectedStudent, selectedSemester]);

    // Mutations
    const createGradeMutation = useMutation({
        mutationFn: (data: any) => api.createGrade(data),
        onSuccess: () => {
            setSaveStatus('success');
            refetchStudentResults();
            queryClient.invalidateQueries({ queryKey: ['admin-grades'] });
            setTimeout(() => setSaveStatus(null), 3000);
        },
        onError: () => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        },
    });

    const updateGradeMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateGrade(id, data),
        onSuccess: () => {
            setSaveStatus('success');
            refetchStudentResults();
            setTimeout(() => setSaveStatus(null), 3000);
        },
        onError: () => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        },
    });

    const publishGradesMutation = useMutation({
        mutationFn: (data: { semesterId: string; studentId?: string }) => api.publishGrades(data),
        onSuccess: () => {
            refetchStudentResults();
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            alert(isRTL ? 'تم نشر الدرجات بنجاح' : 'Grades published successfully');
        },
    });

    // Handlers
    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setStudentGrades([]);
        setShowAddCourse(false);
    };

    const handleClosePanel = () => {
        setSelectedStudent(null);
        setStudentGrades([]);
        setShowAddCourse(false);
    };

    const handleGradeChange = (index: number, field: 'courseworkScore' | 'finalExamScore', value: string) => {
        const numValue = Math.max(0, Math.min(field === 'courseworkScore' ? 40 : 60, parseFloat(value) || 0));
        setStudentGrades(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: numValue,
                totalScore: field === 'courseworkScore'
                    ? numValue + updated[index].finalExamScore
                    : updated[index].courseworkScore + numValue,
            };
            return updated;
        });
    };

    const handleSaveGrade = async (entry: GradeEntry, index: number): Promise<boolean> => {
        setSaveStatus('saving');

        try {
            if (!entry.gradeId) {
                // Create new grade (auto-enrollment handled by backend if IDs provided)
                await createGradeMutation.mutateAsync({
                    studentId: selectedStudent?.id,
                    courseId: entry.courseId,
                    semesterId: selectedSemester,
                    courseworkScore: entry.courseworkScore,
                    finalExamScore: entry.finalExamScore,
                });
            } else {
                // Update existing grade
                await updateGradeMutation.mutateAsync({
                    id: entry.gradeId,
                    data: {
                        courseworkScore: entry.courseworkScore,
                        finalExamScore: entry.finalExamScore,
                    },
                });
            }
            return true;
        } catch (error: any) {
            console.error(`[GRADE_SAVE_ERROR] Failed saving row ${index}:`, error.message || error);
            return false;
        }
    };

    const handlePublishAll = async () => {
        if (!selectedStudent || !selectedSemester) {
            alert(isRTL ? 'بيانات الفصل غير متوفرة' : 'Semester data unavailable');
            return;
        }

        if (!confirm(isRTL ? 'هل تريد حفظ ونشر جميع درجات هذا الطالب لهذا الفصل؟' : 'Save and publish all grades for this student for this semester?')) {
            return;
        }

        setSaveStatus('saving');

        try {
            // 1. Identify rows that need saving and save them SEQUENTIALLY
            // This prevents cookie contention and database race conditions
            let allSaved = true;
            for (let i = 0; i < studentGrades.length; i++) {
                const success = await handleSaveGrade(studentGrades[i], i);
                if (!success) {
                    allSaved = false;
                    break;
                }
            }

            if (!allSaved) {
                alert(isRTL ? 'فشل حفظ بعض الدرجات، يرجى المحاولة مرة أخرى' : 'Failed to save some grades, please try again');
                setSaveStatus('error');
                return;
            }

            // 2. Trigger publication
            await publishGradesMutation.mutateAsync({
                semesterId: selectedSemester,
                studentId: selectedStudent.id
            });

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Publish all failed:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleAddCourse = (course: Course) => {
        // Check if course already exists
        if (studentGrades.some(g => g.courseId === course.id)) {
            alert(isRTL ? 'هذا المقرر مضاف مسبقاً' : 'This course is already added');
            return;
        }

        setStudentGrades(prev => [...prev, {
            courseId: course.id,
            course,
            courseworkScore: 0,
            finalExamScore: 0,
            totalScore: 0,
            letterGrade: '--',
            isPublished: false,
        }]);
        setShowAddCourse(false);
    };

    const deleteEnrollmentMutation = useMutation({
        mutationFn: (id: string) => api.deleteEnrollment(id),
        onSuccess: () => {
            refetchStudentResults();
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (error: any) => {
            alert(isRTL ? `فشل حذف المقرر: ${error.message}` : `Failed to remove course: ${error.message}`);
        }
    });

    const handleRemoveCourse = async (index: number) => {
        const entry = studentGrades[index];

        if (confirm(isRTL ? 'هل تريد حذف هذا المقرر نهائياً؟' : 'Permanently remove this course?')) {
            if (entry.enrollmentId) {
                try {
                    await deleteEnrollmentMutation.mutateAsync(entry.enrollmentId);
                    setStudentGrades(prev => prev.filter((_, i) => i !== index));
                } catch (error) {
                    // Error handled in mutation
                }
            } else {
                // Not in DB yet, just remove from local state
                setStudentGrades(prev => prev.filter((_, i) => i !== index));
            }
        }
    };

    // Filter students
    const students = studentsData?.data || [];

    // Available courses (not already in student's grades)
    const availableCourses = useMemo(() => {
        if (!departmentCourses) return [];
        return departmentCourses.filter((c: Course) =>
            !studentGrades.some(g => g.courseId === c.id)
        );
    }, [departmentCourses, studentGrades]);

    // Calculate letter grade
    const getLetterGrade = (total: number): string => {

        if (total >= 85) return 'ممتاز';
        if (total >= 75) return 'جيد جدا';
        if (total >= 65) return 'جيد';
        if (total >= 50) return 'مقبول';
        return 'راسب';
    };

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6 animate-in fade-in duration-500">
            {/* Left Panel - Student List */}
            <div className="w-[400px] flex flex-col bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <GraduationCap className="w-6 h-6 text-purple-500" />
                        {t('title')}
                    </h1>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500",
                            isRTL ? "right-3" : "left-3"
                        )} />
                        <input
                            type="text"
                            placeholder={isRTL ? "ابحث عن طالب..." : "Search students..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2.5 focus:ring-2 focus:ring-purple-500/50 focus:outline-none",
                                isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                            )}
                        />
                    </div>

                    {/* Department Filter */}
                    <div className="relative">
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500/50 focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="">{isRTL ? 'جميع الأقسام' : 'All Departments'}</option>
                            {departments?.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                    {isRTL ? d.nameAr : d.nameEn}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto">
                    {studentsLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <Users className="w-10 h-10 mb-2" />
                            <p className="text-sm">{isRTL ? 'لا يوجد طلاب' : 'No students found'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {students.map((student: Student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    className={cn(
                                        "w-full p-4 text-left rtl:text-right hover:bg-white/5 transition-colors",
                                        selectedStudent?.id === student.id && "bg-purple-500/10 border-l-2 rtl:border-l-0 rtl:border-r-2 border-purple-500"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">
                                                {isRTL ? student.fullNameAr : student.fullNameEn}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono">
                                                {student.registrationNumber}
                                            </p>
                                            <p className="text-xs text-slate-600 truncate">
                                                {isRTL ? student.department?.nameAr : student.department?.nameEn}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <p className="text-xs text-slate-500 text-center">
                        {isRTL ? `${students.length} طالب` : `${students.length} students`}
                    </p>
                </div>
            </div>

            {/* Right Panel - Grade Management */}
            <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
                {!selectedStudent ? (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                            <GraduationCap className="w-12 h-12 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {isRTL ? 'اختر طالباً' : 'Select a Student'}
                        </h2>
                        <p className="text-slate-500 max-w-md">
                            {isRTL
                                ? 'اختر طالباً من القائمة على اليمين لبدء رصد الدرجات'
                                : 'Select a student from the list on the left to start recording grades'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Student Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                    <User className="w-7 h-7 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {isRTL ? selectedStudent.fullNameAr : selectedStudent.fullNameEn}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Hash className="w-3.5 h-3.5" />
                                            {selectedStudent.registrationNumber}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5" />
                                            {isRTL ? selectedStudent.department?.nameAr : selectedStudent.department?.nameEn}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="relative min-w-[200px]">
                                        <select
                                            value={selectedSemester}
                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-purple-500/30 text-white text-xs rounded-xl py-2 px-3 focus:ring-2 focus:ring-purple-500/50 focus:outline-none appearance-none cursor-pointer pr-10"
                                        >
                                            <option value="" disabled>{isRTL ? 'اختر الفصل الدراسي' : 'Select Semester'}</option>
                                            {semesters?.map((s: any) => (
                                                <option key={s.id} value={s.id}>
                                                    {isRTL ? s.nameAr : s.nameEn} {stats?.activeSemester?.id === s.id ? `(${isRTL ? 'الحالي' : 'Current'})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowAddCourse(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-xl transition-all border border-emerald-500/20 text-sm font-bold"
                                >
                                    <Plus className="w-4 h-4" />
                                    {isRTL ? 'إضافة مقرر' : 'Add Course'}
                                </button>
                                <button
                                    onClick={handleClosePanel}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="flex-1 overflow-y-auto">
                            {studentGrades.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
                                    <p className="text-slate-500">
                                        {isRTL ? 'لا توجد مقررات مسجلة لهذا الطالب' : 'No courses enrolled for this student'}
                                    </p>
                                    <button
                                        onClick={() => setShowAddCourse(true)}
                                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {isRTL ? 'إضافة مقرر' : 'Add Course'}
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-black tracking-widest sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-left rtl:text-right">{isRTL ? 'المقرر' : 'Course'}</th>
                                            <th className="px-4 py-4 text-center">{t('coursework')}<br /><span className="text-[8px] text-slate-600">(40)</span></th>
                                            <th className="px-4 py-4 text-center">{t('finalExam')}<br /><span className="text-[8px] text-slate-600">(60)</span></th>
                                            <th className="px-4 py-4 text-center">{t('total')}</th>
                                            <th className="px-4 py-4 text-center">{t('grade')}</th>
                                            <th className="px-4 py-4 text-center">{isRTL ? 'الحالة' : 'Status'}</th>
                                            <th className="px-6 py-4 text-center">{isRTL ? 'إجراءات' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {studentGrades.map((entry, index) => {
                                            const letterGrade = getLetterGrade(entry.courseworkScore + entry.finalExamScore);
                                            return (
                                                <tr key={entry.courseId} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-bold text-white">{entry.course.code}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {isRTL ? entry.course.nameAr : entry.course.nameEn}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            value={entry.courseworkScore}
                                                            onChange={(e) => handleGradeChange(index, 'courseworkScore', e.target.value)}
                                                            min="0"
                                                            max="40"
                                                            className="w-16 bg-slate-950/50 border border-white/10 rounded-lg py-1.5 text-center text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            value={entry.finalExamScore}
                                                            onChange={(e) => handleGradeChange(index, 'finalExamScore', e.target.value)}
                                                            min="0"
                                                            max="60"
                                                            className="w-16 bg-slate-950/50 border border-white/10 rounded-lg py-1.5 text-center text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-black text-white text-lg">
                                                        {entry.courseworkScore + entry.finalExamScore}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-md font-black border",
                                                            letterGrade.startsWith('A') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                letterGrade.startsWith('B') ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                                    letterGrade.startsWith('C') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                        letterGrade.startsWith('D') ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                                            "bg-red-500/10 text-red-400 border-red-500/20"
                                                        )}>
                                                            {letterGrade}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {entry.isPublished ? (
                                                            <span className="flex items-center justify-center gap-1 text-emerald-500 text-[10px] font-black uppercase">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                {t('published')}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center justify-center gap-1 text-amber-500 text-[10px] font-black uppercase">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                {t('pending')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleSaveGrade(entry, index)}
                                                                disabled={updateGradeMutation.isPending}
                                                                className="p-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 rounded-lg transition-all border border-emerald-500/20"
                                                                title={commonT('save')}
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveCourse(index)}
                                                                className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg transition-all border border-red-500/20"
                                                                title={isRTL ? 'حذف' : 'Remove'}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Academic Summary Section */}
                        {semesterSummary && (
                            <div className="p-6 bg-purple-500/5 border-y border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        {isRTL ? 'الملخص الأكاديمي' : 'Academic Summary'}
                                    </div>
                                    {isRTL && semesterSummary.levelNameAr && (
                                        <span className="text-purple-300 font-bold">{semesterSummary.levelNameAr}</span>
                                    )}
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                            {t('totalUnits')}
                                        </p>
                                        <p className="text-xl font-black text-white">
                                            {semesterSummary.totalUnits}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                            {t('completedUnits')}
                                        </p>
                                        <p className="text-xl font-black text-emerald-400">
                                            {semesterSummary.completedUnits}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                            {t('incompleteCourses')}
                                        </p>
                                        <p className="text-xl font-black text-red-400">
                                            {semesterSummary.incompleteCourses}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                            {t('semesterGPA')}
                                        </p>
                                        <p className="text-xl font-black text-white">
                                            {semesterSummary.gpa?.toFixed(4) || '0.0000'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                        <p className="text-[10px] text-purple-400 uppercase font-bold mb-1">
                                            {t('finalResult')}
                                        </p>
                                        <p className="text-lg font-black text-white">
                                            {isRTL ? semesterSummary.statusAr : (semesterSummary.incompleteCourses === 0 ? 'Passed' : 'Failed')}
                                            <span className="block text-[10px] text-purple-300 font-medium leading-tight mt-0.5">
                                                {semesterSummary.classificationAr}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        {studentGrades.length > 0 && (
                            <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="text-sm text-slate-400">
                                    {isRTL
                                        ? `${studentGrades.length} مقرر • ${studentGrades.filter(g => g.isPublished).length} منشور`
                                        : `${studentGrades.length} courses • ${studentGrades.filter(g => g.isPublished).length} published`}
                                </div>
                                <button
                                    onClick={handlePublishAll}
                                    disabled={publishGradesMutation.isPending || saveStatus === 'saving'}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-600/20 transition-all text-sm font-bold disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {t('publishTitle')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Course Modal */}
            {showAddCourse && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-500" />
                                {isRTL ? 'إضافة مقرر' : 'Add Course'}
                            </h3>
                            <button
                                onClick={() => setShowAddCourse(false)}
                                className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-400 mb-4">
                                {isRTL
                                    ? `المقررات المتاحة في قسم ${selectedStudent.department?.nameAr}`
                                    : `Available courses in ${selectedStudent.department?.nameEn} department`}
                            </p>
                            {availableCourses.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">
                                    {isRTL ? 'لا توجد مقررات إضافية متاحة' : 'No additional courses available'}
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {availableCourses.map((course: Course) => (
                                        <button
                                            key={course.id}
                                            onClick={() => handleAddCourse(course)}
                                            className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 rounded-xl text-left rtl:text-right transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                        [{course.code}] {isRTL ? course.nameAr : course.nameEn}
                                                    </p>
                                                </div>
                                                <Plus className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Save Status Toast */}
            {saveStatus && (
                <div className={cn(
                    "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 z-50",
                    saveStatus === 'success' && "bg-emerald-500 text-white shadow-emerald-500/40",
                    saveStatus === 'error' && "bg-red-500 text-white shadow-red-500/40",
                    saveStatus === 'saving' && "bg-slate-700 text-white shadow-slate-500/40"
                )}>
                    {saveStatus === 'saving' && <Loader2 className="w-5 h-5 animate-spin" />}
                    {saveStatus === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {saveStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold">
                        {saveStatus === 'saving' && (isRTL ? 'جاري الحفظ...' : 'Saving...')}
                        {saveStatus === 'success' && (isRTL ? 'تم الحفظ بنجاح' : 'Saved successfully')}
                        {saveStatus === 'error' && (isRTL ? 'حدث خطأ' : 'Error occurred')}
                    </span>
                </div>
            )}
        </div>
    );
}
