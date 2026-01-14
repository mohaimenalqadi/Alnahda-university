// ===========================================
// Admin Login Page
// ===========================================

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Mail, Lock, Key, Loader2, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { adminLoginSchema, AdminLoginInput } from '@/lib/validators/auth.schema';
import { api, ApiRequestError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function AdminLoginPage() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const isRTL = locale === 'ar';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requireMfa, setRequireMfa] = useState(false);
    const [mfaToken, setMfaToken] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AdminLoginInput>({
        resolver: zodResolver(adminLoginSchema),
        defaultValues: {
            email: '',
            password: '',
            mfaCode: '',
        },
    });

    const onSubmit = async (data: AdminLoginInput) => {
        setIsLoading(true);
        setError(null);

        try {
            if (requireMfa && mfaToken && data.mfaCode) {
                // Handle MFA Verification
                const result = await api.verifyMfa({
                    mfaToken,
                    code: data.mfaCode,
                });

                if (result.success) {
                    router.push(`/${locale}/admin/dashboard`);
                }
            } else {
                // Handle Primary Login
                const result = await api.adminLogin({
                    email: data.email,
                    password: data.password,
                });

                if (result.requireMfa) {
                    setRequireMfa(true);
                    setMfaToken(result.mfaToken!);
                } else if (result.success) {
                    router.push(`/${locale}/admin/dashboard`);
                }
            }
        } catch (err) {
            if (err instanceof ApiRequestError) {
                if (err.statusCode === 429) {
                    setError(t('login.errors.tooManyAttempts'));
                } else if (err.statusCode === 401) {
                    setError(t('login.errors.invalidCredentials'));
                } else {
                    setError(err.message);
                }
            } else {
                setError(t('login.errors.networkError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleLocale = () => {
        const newLocale = locale === 'ar' ? 'en' : 'ar';
        router.push(`/${newLocale}/admin/login`);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Language Toggle */}
            <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20">
                <button
                    onClick={toggleLocale}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 
                     text-slate-300 border border-white/10 rounded-xl transition-all backdrop-blur-md"
                >
                    <Globe className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'English' : 'عربي'}</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Admin Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 
                          bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 
                          rounded-2xl shadow-2xl mb-4 group ring-4 ring-blue-500/10">
                            <Shield className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {t('adminLogin.title')}
                        </h1>
                        <p className="text-slate-400 text-lg">
                            {t('adminLogin.subtitle')}
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-slate-800/50 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative">
                        {/* Decorative top bar */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {!requireMfa ? (
                                <>
                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                            {t('adminLogin.email')}
                                        </label>
                                        <div className="relative group">
                                            <div className={cn(
                                                "absolute inset-y-0 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors",
                                                isRTL ? "right-0 pr-3" : "left-0 pl-3"
                                            )}>
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                {...register('email')}
                                                className={cn(
                                                    "w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all",
                                                    isRTL ? "pr-10" : "pl-10",
                                                    errors.email && "border-red-500/50 focus:ring-red-500/20"
                                                )}
                                                placeholder={t('adminLogin.emailPlaceholder')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1.5 text-xs text-red-400">
                                                {t(errors.email.message as string)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                            {t('adminLogin.password')}
                                        </label>
                                        <div className="relative group">
                                            <div className={cn(
                                                "absolute inset-y-0 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors",
                                                isRTL ? "right-0 pr-3" : "left-0 pl-3"
                                            )}>
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="password"
                                                type="password"
                                                {...register('password')}
                                                className={cn(
                                                    "w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all",
                                                    isRTL ? "pr-10" : "pl-10",
                                                    errors.password && "border-red-500/50 focus:ring-red-500/20"
                                                )}
                                                placeholder={t('adminLogin.passwordPlaceholder')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1.5 text-xs text-red-400">
                                                {t(errors.password.message as string)}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <h3 className="text-xl font-bold text-white mb-2 text-center">
                                        {t('adminLogin.mfaTitle')}
                                    </h3>
                                    <p className="text-slate-400 text-sm text-center mb-6">
                                        {t('adminLogin.mfaSubtitle')}
                                    </p>

                                    {/* MFA Code Field */}
                                    <div>
                                        <div className="relative group">
                                            <div className={cn(
                                                "absolute inset-y-0 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors",
                                                isRTL ? "right-0 pr-3" : "left-0 pl-3"
                                            )}>
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="mfaCode"
                                                type="text"
                                                {...register('mfaCode')}
                                                className={cn(
                                                    "w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all",
                                                    errors.mfaCode && "border-red-500/50"
                                                )}
                                                placeholder={t('adminLogin.mfaPlaceholder')}
                                                maxLength={6}
                                                disabled={isLoading}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setRequireMfa(false)}
                                        className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4 w-full text-center"
                                    >
                                        {t('common.back')}
                                    </button>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('common.loading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{requireMfa ? t('adminLogin.verifyButton') : t('adminLogin.loginButton')}</span>
                                        {isRTL ? (
                                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Back to Student Portal */}
                    <Link
                        href={`/${locale}/login`}
                        className="mt-8 flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium"
                    >
                        <span>{t('login.title')}</span>
                    </Link>
                </div>
            </div>

            {/* Production Quality Footer */}
            <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
                <p className="text-center text-slate-600 text-xs font-medium uppercase tracking-widest">
                    {t('login.footer')}
                </p>
            </div>
        </div>
    );
}
