// ===========================================
// Sidebar Component
// Professional Navigation for Admin Panel
// ===========================================

'use client';

import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Calendar,
    Building2,
    History,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    locale: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ locale, isOpen, onClose }: SidebarProps) {
    const t = useTranslations('admin.nav');
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isRTL = locale === 'ar';

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, href: '/admin/dashboard', label: t('dashboard') },
        { id: 'students', icon: Users, href: '/admin/students', label: t('students') },
        { id: 'courses', icon: BookOpen, href: '/admin/courses', label: isRTL ? 'المقررات' : 'Courses' },
        { id: 'grades', icon: GraduationCap, href: '/admin/grades', label: t('grades') },
        { id: 'semesters', icon: Calendar, href: '/admin/semesters', label: t('semesters') },
        { id: 'departments', icon: Building2, href: '/admin/departments', label: t('departments') },
        { id: 'audit', icon: History, href: '/admin/audit', label: t('audit') },
    ];

    const bottomItems = [
        { id: 'settings', icon: Settings, href: '/admin/settings', label: t('settings') },
    ];

    const handleLogout = async () => {
        try {
            await api.adminLogout();
            router.push(`/${locale}/admin/login`);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
                    "bg-slate-900 border-x border-white/5 shadow-2xl",
                    isRTL ? "right-0" : "left-0",
                    // Mobile visibility
                    isOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
                    "lg:translate-x-0", // Always show on desktop
                    isCollapsed ? "lg:w-20" : "w-64"
                )}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-gold rounded-lg shadow-gold">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        {(!isCollapsed || isOpen) && (
                            <span className="text-xl font-bold text-white tracking-tight truncate">
                                Admin <span className="text-gold">Panel</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                                    isActive
                                        ? "bg-gradient-gold text-black font-black shadow-gold"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-6 h-6 shrink-0 transition-transform group-hover:scale-110",
                                    isActive ? "text-black" : "text-slate-500 group-hover:text-primary-400"
                                )} />
                                {(!isCollapsed || isOpen) && (
                                    <span className="text-sm font-medium">{item.label}</span>
                                )}

                                {/* Active Indicator Pip */}
                                {isActive && (isCollapsed && !isOpen) && (
                                    <div className={cn(
                                        "absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full",
                                        isRTL ? "-left-1" : "-right-1"
                                    )} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="px-4 py-6 border-t border-white/5 space-y-2">
                    {bottomItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <item.icon className="w-6 h-6" />
                            {(!isCollapsed || isOpen) && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
                    >
                        <LogOut className="w-6 h-6" />
                        {(!isCollapsed || isOpen) && <span className="text-sm font-medium">{t('logout')}</span>}
                    </button>
                </div>

                {/* Collapse Toggle (Desktop only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "absolute bottom-24 bg-slate-800 border border-white/10 p-1.5 rounded-full text-slate-400 hover:text-white transition-all shadow-xl hidden lg:block",
                        isRTL ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
                    )}
                >
                    {isCollapsed ? (
                        isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    ) : (
                        isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </aside>
        </>
    );
}

