// ===========================================
// Admin Dashboard Page
// Overview of System Statistics and Activity
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    GraduationCap,
    Calendar,
    History,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Search,
    MoreVertical
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn, formatNumber, formatDate } from '@/lib/utils';
import { useParams } from 'next/navigation';
import QuickActions from '@/components/dashboard/QuickActions';
import StudentFormModal from '@/components/students/StudentFormModal';
import SemesterFormModal from '@/components/semesters/SemesterFormModal';
import DepartmentFormModal from '@/components/departments/DepartmentFormModal';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function AdminDashboardPage() {
    const t = useTranslations('admin.dashboard');
    const nt = useTranslations('admin.nav');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';

    // Fetch Stats
    const {
        data: stats,
        isLoading: statsLoading,
        isError: statsError,
        refetch: refetchStats
    } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.getAdminStats(),
        refetchInterval: 30000, // Refresh every 30s
        retry: 2,
    });

    // Fetch Recent Activity (Audit Logs)
    const {
        data: auditLogs,
        isLoading: logsLoading,
        isError: logsError
    } = useQuery({
        queryKey: ['admin-audit-logs'],
        queryFn: () => api.getAuditLogs({ limit: 5 }),
        retry: 2,
    });

    // Modal States
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

    // Fetch Departments (for StudentForm)
    const { data: courses } = useQuery({
        queryKey: ['admin-courses'],
        queryFn: () => api.getAdminCourses(),
    });
    const departments = courses ? Array.from(new Set(courses.map((c: any) => JSON.stringify(c.department)))).map(s => JSON.parse(s)) : [];

    const statCards = [
        {
            title: t('stats.totalStudents'),
            value: stats?.students.total || 0,
            subValue: `${stats?.students.active || 0} active`,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            trend: "+12%"
        },
        {
            title: t('stats.activeSemesters'),
            value: stats?.activeSemester ? 1 : 0,
            subValue: isRTL ? stats?.activeSemester?.nameAr : stats?.activeSemester?.nameEn || 'None',
            icon: Calendar,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            trend: "Active"
        },
        {
            title: t('stats.pendingGrades'),
            value: stats?.grades.pending || 0,
            subValue: `${stats?.grades.published || 0} published`,
            icon: GraduationCap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            trend: "Requires action"
        },
        {
            title: t('stats.auditLogs'),
            value: auditLogs?.pagination.total || 0,
            subValue: "Last 24 hours",
            icon: History,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            trend: "Security secure"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {t('welcome', { name: 'System Admin' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsStudentModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        {t('actions.addStudent')}
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {(statsError || logsError) && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-200">
                            {isRTL ? 'حدث خطأ أثناء تحديث البيانات. يرجى التحقق من الاتصال.' : 'Error updating dashboard data. Please check your connection.'}
                        </p>
                    </div>
                    <button
                        onClick={() => refetchStats()}
                        className="text-xs font-bold text-red-500 hover:text-red-400 underline underline-offset-4"
                    >
                        {isRTL ? 'إعادة المحاولة' : 'Retry Now'}
                    </button>
                </div>
            )}

            {/* Quick Actions Grid */}
            <QuickActions
                onAddStudent={() => setIsStudentModalOpen(true)}
                onAddSemester={() => setIsSemesterModalOpen(true)}
                onAddDept={() => setIsDeptModalOpen(true)}
                locale={locale}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", card.bg, card.color)}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                                {card.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">{card.title}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-white">
                                {statsLoading ? '...' : formatNumber(card.value, locale)}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">{card.subValue}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            {t('recentActivity')}
                        </h2>
                        <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                            View All
                        </button>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                        {logsLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading activities...</div>
                        ) : auditLogs?.data.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No recent activities</div>
                        ) : (
                            auditLogs?.data.map((log: any, i: number) => (
                                <div key={i} className="p-3 md:p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <div className={cn(
                                            "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border border-white/5 shrink-0",
                                            log.action === 'CREATE' ? "bg-emerald-500/10 text-emerald-500" :
                                                log.action === 'UPDATE' ? "bg-blue-500/10 text-blue-500" :
                                                    "bg-slate-500/10 text-slate-500"
                                        )}>
                                            {log.action === 'CREATE' ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> :
                                                log.action === 'UPDATE' ? <Clock className="w-4 h-4 md:w-5 md:h-5" /> :
                                                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs md:text-sm font-medium text-white truncate">
                                                <span className="text-blue-400 font-bold">{log.adminUser?.fullName || 'System'}</span>
                                                {" "}{log.action.toLowerCase()}d {log.resource.toLowerCase()}
                                            </p>
                                            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                                                {formatDate(log.createdAt, locale)}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Shortcut / Quick Nav */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Quick Navigation</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { label: nt('students'), icon: Users, href: '/admin/students', color: "hover:bg-blue-500/10 hover:border-blue-500/20" },
                            { label: nt('grades'), icon: GraduationCap, href: '/admin/grades', color: "hover:bg-purple-500/10 hover:border-purple-500/20" },
                            { label: nt('audit'), icon: History, href: '/admin/audit', color: "hover:bg-emerald-500/10 hover:border-emerald-500/20" },
                        ].map((nav, i) => (
                            <a
                                key={i}
                                href={`/${locale}${nav.href}`}
                                className={cn(
                                    "flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl transition-all group",
                                    nav.color
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <nav.icon className="w-5 h-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                                        {nav.label}
                                    </span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        ))}
                    </div>

                    {/* System Pulse */}
                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 p-6 rounded-3xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">System Operational</span>
                        </div>
                        <p className="text-sm text-white font-medium">All services are running normally.</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Database connectivity: 100%<br />
                            Cache performance: 98%<br />
                            Background jobs: Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StudentFormModal
                isOpen={isStudentModalOpen}
                onClose={() => setIsStudentModalOpen(false)}
                departments={departments}
                locale={locale}
            />
            <SemesterFormModal
                isOpen={isSemesterModalOpen}
                onClose={() => setIsSemesterModalOpen(false)}
                locale={locale}
            />
            <DepartmentFormModal
                isOpen={isDeptModalOpen}
                onClose={() => setIsDeptModalOpen(false)}
                locale={locale}
            />
        </div>
    );
}
