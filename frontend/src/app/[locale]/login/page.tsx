// ===========================================
// Student Login Page
// ===========================================

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, Calendar, User, Eye, EyeOff, Loader2, Globe, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { studentLoginSchema, StudentLoginInput } from '@/lib/validators/auth.schema';
import { api, ApiRequestError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const isRTL = locale === 'ar';

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [studentName, setStudentName] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<StudentLoginInput>({
        resolver: zodResolver(studentLoginSchema),
        defaultValues: {
            registrationNumber: '',
            dateOfBirth: '',
        },
    });

    const onSubmit = async (data: StudentLoginInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await api.studentLogin(data);

            if (result.success) {
                setIsSuccess(true);
                setStudentName(isRTL ? result.student.fullNameAr : result.student.fullNameEn);

                // Short delay for the animation, then immediate navigation
                setTimeout(() => {
                    router.push(`/${locale}/results`);
                }, 1000);
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
        router.push(`/${newLocale}/login`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 pattern-dots opacity-[0.02]" />
            </div>

            {/* Language Toggle */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 rtl:right-auto rtl:left-4 rtl:md:left-6 z-10">
                <button
                    onClick={toggleLocale}
                    className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-white hover:bg-slate-50 
                     text-slate-600 border border-slate-200 rounded-xl md:rounded-2xl transition-all shadow-sm"
                >
                    <Globe className="w-4 h-4 text-primary-500" />
                    <span className="font-bold text-[10px] md:text-sm tracking-widest">
                        {locale === 'ar' ? 'ENGLISH' : 'العربية'}
                    </span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-0">
                <div className="w-full max-w-[480px] animate-fade-in">
                    {/* Logo & Header */}
                    <div className="text-center mb-6 md:mb-10">
                        {isSuccess ? (
                            <div className="animate-bounce-in">
                                <div className="inline-flex items-center justify-center w-20 h-20 md:w-28 md:h-28 
                                  bg-emerald-500 rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg shadow-emerald-500/20 mb-4 md:mb-6 p-0.5">
                                    <div className="w-full h-full bg-white rounded-[1.4rem] md:rounded-[2.4rem] flex items-center justify-center">
                                        <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                                    {isRTL ? 'أهلاً بك' : 'Welcome back'}
                                </h1>
                                <p className="text-emerald-600 font-bold bg-emerald-50 inline-block px-4 py-1.5 rounded-full text-xs md:text-sm">
                                    {studentName}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="inline-flex items-center justify-center w-20 h-20 md:w-28 md:h-28 
                                  bg-gradient-gold rounded-[1.5rem] md:rounded-[2.5rem] shadow-gold mb-4 md:mb-6 p-0.5 transform rotate-3 hover:rotate-0 transition-transform duration-500 shrink-0">
                                    <div className="w-full h-full bg-white rounded-[1.4rem] md:rounded-[2.4rem] flex items-center justify-center">
                                        <GraduationCap className="w-10 h-10 md:w-14 md:h-14 text-primary-500" />
                                    </div>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black mb-2 md:mb-3 tracking-tight">
                                    <span className="text-gold">{t('common.appName')}</span>
                                </h1>
                                <p className="text-slate-400 text-sm md:text-lg font-medium opacity-80">
                                    {t('login.subtitle')}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Login Card */}
                    <div className={cn(
                        "card shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)] transition-all duration-500",
                        isSuccess && "opacity-50 pointer-events-none scale-95 blur-[2px]"
                    )}>
                        <div className="bg-white p-6 md:p-10">
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 text-center mb-6 md:mb-8 tracking-wide uppercase">
                                {t('login.title')}
                            </h2>

                            {/* Error Alert */}
                            {error && (
                                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] md:text-sm font-bold mb-6 md:mb-8 flex items-center gap-2 md:gap-3 animate-slide-down shadow-sm">
                                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                                {/* Registration Number */}
                                <div>
                                    <label htmlFor="registrationNumber" className="label">
                                        {t('login.registrationNumber')}
                                    </label>
                                    <div className="relative group">
                                        <div className={cn(
                                            "absolute inset-y-0 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors",
                                            isRTL ? "right-0 pr-4" : "left-0 pl-4"
                                        )}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="registrationNumber"
                                            type="text"
                                            {...register('registrationNumber')}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                e.target.value = value;
                                                register('registrationNumber').onChange(e);
                                            }}
                                            className={cn(
                                                "input h-14 !bg-white/5",
                                                isRTL ? "pr-12" : "pl-12",
                                                errors.registrationNumber && "input-error"
                                            )}
                                            placeholder={t('login.registrationNumberPlaceholder')}
                                            dir="ltr"
                                            inputMode="numeric"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.registrationNumber && (
                                        <p className="error-message ml-1 mt-2 font-bold">
                                            {t(errors.registrationNumber.message as string)}
                                        </p>
                                    )}
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label htmlFor="dateOfBirth" className="label">
                                        {t('login.dateOfBirth')}
                                    </label>
                                    <div className="relative group">
                                        <div className={cn(
                                            "absolute inset-y-0 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors",
                                            isRTL ? "right-0 pr-4" : "left-0 pl-4"
                                        )}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="dateOfBirth"
                                            type="date"
                                            {...register('dateOfBirth', {
                                                onChange: (e) => {
                                                    // Ensure we use the value properly
                                                }
                                            })}
                                            className={cn(
                                                "input h-14 !bg-white/5",
                                                isRTL ? "pr-12" : "pl-12",
                                                errors.dateOfBirth && "input-error"
                                            )}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.dateOfBirth && (
                                        <p className="error-message ml-1 mt-2 font-bold">
                                            {t(errors.dateOfBirth.message as string)}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 md:h-14 relative group overflow-hidden rounded-xl md:rounded-2xl transition-all shadow-gold hover:shadow-primary-500/40"
                                >
                                    <div className="absolute inset-0 bg-gradient-gold" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                    <div className="relative flex items-center justify-center gap-2 md:gap-3 text-black font-black text-base md:text-lg tracking-wider uppercase">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                                                <span>{t('login.loggingIn')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{t('login.loginButton')}</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center space-y-4">
                        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase opacity-60">
                            {t('login.footer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
