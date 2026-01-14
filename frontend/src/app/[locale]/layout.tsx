// ===========================================
// Locale Layout - RTL/LTR Support
// ===========================================

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, getMessages } from 'next-intl/server';
import '@/styles/globals.css';
import { QueryProvider } from '@/providers/query-provider';

const locales = ['ar', 'en'] as const;
type Locale = (typeof locales)[number];

export async function generateMetadata({
    params: { locale },
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'common' });

    return {
        title: t('appNameFull'),
        description: 'Secure Student Results Management System',
        icons: {
            icon: '/favicon.ico',
        },
    };
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params: { locale },
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Validate locale
    if (!locales.includes(locale as Locale)) {
        notFound();
    }

    const isRTL = locale === 'ar';

    // Get messages for client components
    const messages = await getMessages();

    return (
        <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            </head>
            <body className={isRTL ? 'font-arabic' : 'font-sans'}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <QueryProvider>
                        {children}
                    </QueryProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
