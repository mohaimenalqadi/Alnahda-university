// ===========================================
// Admin Layout
// Shared Wrapper for all Admin Pages
// ===========================================

import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { Globe, User as UserIcon, Bell, Search } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
    params: { locale: string };
}

export default function AdminLayout({ children, params: { locale } }: AdminLayoutProps) {
    const isRTL = locale === 'ar';

    return (
        <div className="min-h-screen bg-black flex font-inter dark">
            {/* Sidebar Component */}
            <Sidebar locale={locale} />

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                isRTL ? "pr-20 lg:pr-64" : "pl-20 lg:pl-64"
            )}>
                {/* Topbar / Header */}
                <header className="h-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 px-8 flex items-center justify-between">
                    {/* Left: Search or Breadcrumbs */}
                    <div className="flex-1 max-w-md hidden md:block">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold transition-colors" />
                            <input
                                type="text"
                                placeholder="Search records, students..."
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-4">
                        <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-slate-900" />
                        </button>

                        <div className="h-8 w-px bg-white/5 mx-2" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-white leading-none">Admin User</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-bold">Super Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center border border-white/10 shadow-gold cursor-pointer hover:scale-105 transition-transform">
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Wrapper */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                <footer className="px-8 py-6 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-widest">
                        Al-Nahda University © {new Date().getFullYear()} • Secure Admin System
                    </p>
                </footer>
            </main>
        </div>
    );
}
