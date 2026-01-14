// ===========================================
// Root Layout
// ===========================================

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Al-Nahda University - Student Results',
    description: 'Secure Student Results Management System for Al-Nahda University',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
