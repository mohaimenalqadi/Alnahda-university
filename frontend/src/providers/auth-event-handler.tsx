'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthEventHandler() {
    const router = useRouter();

    useEffect(() => {
        const handleUnauthorized = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            console.error('[AUTH] Unauthorized access detected, redirecting...', detail);

            // Determine locale from path if possible, or fallback to ar
            const pathParts = window.location.pathname.split('/');
            const locale = ['ar', 'en'].includes(pathParts[1]) ? pathParts[1] : 'ar';

            if (detail?.isAdmin) {
                router.push(`/${locale}/admin/login`);
            } else {
                router.push(`/${locale}/login`);
            }
        };

        window.addEventListener('auth-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
    }, [router]);

    return null;
}
