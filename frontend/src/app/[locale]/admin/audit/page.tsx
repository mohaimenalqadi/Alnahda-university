// ===========================================
// Admin Audit Logs Page
// Monitor System & Admin Activity
// ===========================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    Search,
    Filter,
    Calendar,
    User,
    Shield,
    Globe,
    Clock,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Database,
    LogIn,
    LogOut,
    PlusCircle,
    FileText,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function AuditLogsPage() {
    const t = useTranslations('admin.audit');
    const commonT = useTranslations('common');
    const { locale } = useParams() as { locale: string };
    const isRTL = locale === 'ar';

    // State for filtering
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [action, setAction] = useState('');
    const [adminUserId, setAdminUserId] = useState('');

    // Fetch Audit Logs
    const { data: logsData, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['admin-audit-logs', page, action, adminUserId],
        queryFn: () => api.getAuditLogs({
            page,
            limit,
            action: action || undefined,
            adminUserId: adminUserId || undefined
        }),
        placeholderData: (previous) => previous,
    });

    const logs = logsData?.data || [];
    const pagination = logsData?.pagination;

    // Helper to get action icon
    const getActionIcon = (actionStr: string) => {
        const a = actionStr.toLowerCase();
        if (a.includes('login')) return <LogIn className="w-4 h-4 text-emerald-500" />;
        if (a.includes('logout')) return <LogOut className="w-4 h-4 text-slate-500" />;
        if (a.includes('create')) return <PlusCircle className="w-4 h-4 text-blue-500" />;
        if (a.includes('update')) return <RefreshCw className="w-4 h-4 text-amber-500" />;
        if (a.includes('delete')) return <Trash2 className="w-4 h-4 text-red-500" />;
        if (a.includes('publish')) return <Database className="w-4 h-4 text-purple-500" />;
        return <FileText className="w-4 h-4 text-slate-400" />;
    };

    // Helper to get localized action label
    const getActionLabel = (actionStr: string) => {
        const a = actionStr.toLowerCase();
        if (a.includes('login')) return t('login');
        if (a.includes('logout')) return t('logout');
        if (a.includes('create')) return t('create');
        if (a.includes('update')) return t('update');
        if (a.includes('delete')) return t('delete');
        if (a.includes('publish')) return t('publish');
        return actionStr;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-emerald-500" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-400 mt-1">{t('subtitle')}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl flex flex-wrap items-end gap-6 shadow-xl backdrop-blur-xl">
                {/* Action Type Filter */}
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        {t('filterByAction')}
                    </label>
                    <div className="relative">
                        <select
                            value={action}
                            onChange={(e) => { setAction(e.target.value); setPage(1); }}
                            className="w-full bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="">{commonT('allStatus') || 'All'}</option>
                            <option value="LOGIN">LOGIN</option>
                            <option value="LOGOUT">LOGOUT</option>
                            <option value="CREATE_STUDENT">CREATE_STUDENT</option>
                            <option value="UPDATE_STUDENT">UPDATE_STUDENT</option>
                            <option value="CREATE_GRADE">CREATE_GRADE</option>
                            <option value="UPDATE_GRADE">UPDATE_GRADE</option>
                            <option value="PUBLISH_GRADES">PUBLISH_GRADES</option>
                        </select>
                        <ChevronRight className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none transition-transform", isRTL && "rotate-180 left-4 right-auto")} />
                    </div>
                </div>

                {/* Admin User Search / Filter (Simplified for now) */}
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        {t('filterByAdmin')}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('filterByAdmin')}
                            value={adminUserId}
                            onChange={(e) => { setAdminUserId(e.target.value); setPage(1); }}
                            className="w-full bg-slate-950/50 border border-white/10 text-white text-sm rounded-xl py-2.5 px-10 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all placeholder:text-slate-600"
                        />
                        <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500", isRTL && "right-3.5 left-auto")} />
                    </div>
                </div>

                {/* Date Filter (Static Label for now) */}
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Date Range
                    </label>
                    <div className="bg-slate-950/50 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-slate-400 italic">
                        Last 30 Days (Automated)
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
                {isLoading && !isPlaceholderData ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                        <p className="text-slate-500 font-medium">{commonT('loading')}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left rtl:text-right text-slate-300">
                                <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">{t('timestamp')}</th>
                                        <th className="px-6 py-5">{t('user')}</th>
                                        <th className="px-6 py-5">{t('action')}</th>
                                        <th className="px-6 py-5">{t('details')}</th>
                                        <th className="px-8 py-5 text-right rtl:text-left">{t('ipAddress')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium italic">
                                                No audit logs found for the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-emerald-400">
                                                                {format(new Date(log.createdAt), 'HH:mm:ss')}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">
                                                                {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                            {log.adminUser?.email?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white leading-tight">
                                                                {log.adminUser?.email?.split('@')[0]}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 uppercase font-black">
                                                                {log.adminUser?.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 w-fit">
                                                        {getActionIcon(log.action)}
                                                        <span className="font-bold text-white/90 text-[11px] uppercase tracking-tighter">
                                                            {getActionLabel(log.action)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs overflow-hidden text-ellipsis">
                                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                        {log.details || '---'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-4 text-right rtl:text-left">
                                                    <div className="flex items-center justify-end gap-1.5 text-slate-500 font-mono text-[10px] font-black">
                                                        <Globe className="w-3 h-3" />
                                                        {log.ipAddress || '127.0.0.1'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Area */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="px-8 py-5 flex items-center justify-between bg-white/[0.02] border-t border-white/5">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    Displaying {logs.length} / {pagination.total} logs
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => prev - 1)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white rounded-xl transition-all border border-white/5"
                                    >
                                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </button>
                                    <div className="flex items-center px-4 bg-slate-950/50 rounded-xl border border-white/10 text-xs font-black text-emerald-400">
                                        {page} / {pagination.totalPages}
                                    </div>
                                    <button
                                        disabled={page === pagination.totalPages}
                                        onClick={() => setPage(prev => prev + 1)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white rounded-xl transition-all border border-white/5"
                                    >
                                        {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
