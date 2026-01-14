'use client';

import { useTranslations } from 'next-intl';
import {
    Settings,
    Shield,
    Bell,
    Database,
    Globe,
    Lock,
    Save
} from 'lucide-react';

export default function SettingsPage() {
    const t = useTranslations('admin.settings');
    const commonT = useTranslations('common');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-gold-500" />
                        الإعدادات
                    </h1>
                    <p className="text-slate-400 mt-1">تكوين إعدادات النظام وتفضيلات الأمان</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-blue-400" />
                        الإعدادات العامة
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">اسم المؤسسة</label>
                            <input
                                type="text"
                                defaultValue="جامعة النهضة"
                                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">اللغة الافتراضية</label>
                            <select className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500">
                                <option value="ar">العربية</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-green-400" />
                        الأمان والحماية
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white text-sm font-medium">المصادقة الثنائية (MFA)</p>
                                <p className="text-xs text-slate-500">تطلب رمزاً من الهاتف لتسجيل الدخول</p>
                            </div>
                            <div className="w-10 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <div>
                                <p className="text-white text-sm font-medium">قفل الحساب التلقائي</p>
                                <p className="text-xs text-slate-500">قفل الحساب بعد 5 محاولات فاشلة</p>
                            </div>
                            <div className="w-10 h-6 bg-gold-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Settings */}
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Database className="w-5 h-5 text-purple-400" />
                        قاعدة البيانات
                    </h2>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                        قاعدة البيانات متصلة وتعمل بشكل جيد (Neon PostgreSQL)
                    </div>
                    <button className="mt-4 w-full py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors text-sm">
                        نسخة احتياطية الآن
                    </button>
                </div>

                {/* Notification Settings */}
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-orange-400" />
                        التنبيهات
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="accent-gold-500" />
                            <span className="text-sm text-slate-300">تنبيهات البريد الإلكتروني للعمليات الحساسة</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="accent-gold-500" />
                            <span className="text-sm text-slate-300">إشعار عند تسجيل دخول جديد</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
