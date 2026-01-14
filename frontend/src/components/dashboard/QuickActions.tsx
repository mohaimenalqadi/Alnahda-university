// ===========================================
// Quick Actions Component
// High-priority shortcuts for administrative tasks
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import {
    UserPlus,
    CalendarPlus,
    Building2,
    GraduationCap,
    History,
    PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
    onAddStudent: () => void;
    onAddSemester: () => void;
    onAddDept: () => void;
    locale: string;
}

export default function QuickActions({ onAddStudent, onAddSemester, onAddDept, locale }: QuickActionsProps) {
    const t = useTranslations('admin.dashboard.actions');
    const nt = useTranslations('admin.nav');
    const isRTL = locale === 'ar';

    const actions = [
        {
            label: t('addStudent'),
            icon: UserPlus,
            onClick: onAddStudent,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: t('addSemester'),
            icon: CalendarPlus,
            onClick: onAddSemester,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            label: t('addDept'),
            icon: Building2,
            onClick: onAddDept,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            label: t('manageGrades'),
            icon: GraduationCap,
            href: `/${locale}/admin/grades`,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            label: t('viewAudit'),
            icon: History,
            href: `/${locale}/admin/audit`,
            color: "text-slate-400",
            bg: "bg-slate-400/10",
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {actions.map((action, i) => (
                action.onClick ? (
                    <button
                        key={i}
                        onClick={action.onClick}
                        className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900/50 border border-white/5 rounded-2xl md:rounded-3xl hover:border-white/10 hover:bg-white/[0.04] transition-all group"
                    >
                        <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl mb-2 md:mb-3 group-hover:scale-110 transition-transform", action.bg, action.color)}>
                            <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
                            {action.label}
                        </span>
                    </button>
                ) : (
                    <a
                        key={i}
                        href={action.href}
                        className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900/50 border border-white/5 rounded-2xl md:rounded-3xl hover:border-white/10 hover:bg-white/[0.04] transition-all group"
                    >
                        <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl mb-2 md:mb-3 group-hover:scale-110 transition-transform", action.bg, action.color)}>
                            <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
                            {action.label}
                        </span>
                    </a>
                )
            ))}
        </div>
    );
}
