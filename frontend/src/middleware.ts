import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    // Run the intl middleware first
    const response = intlMiddleware(request);

    // Get the status code
    const status = response.status;

    // Skip security headers for non-HTML/non-page responses if needed, 
    // but generally safe for all.

    // 1. Content Security Policy (CSP)
    // - default-src 'self' : Only allow resources from same origin
    // - script-src 'self' 'unsafe-inline' 'unsafe-eval' : Needed for Next.js dev and some libs
    // - style-src 'self' 'unsafe-inline' : For Tailwind/Next.js styles
    // - img-src 'self' blob: data: : Allow local images and data URIs
    // - font-src 'self' : Allow local fonts
    // - connect-src 'self' http://localhost:4000 : Allow API calls to backend
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'};
        frame-ancestors 'none';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    // Set Security Headers
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    // Strict-Transport-Security (HSTS) - Only in production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return response;
}

export const config = {
    // Matcher for internationalized routes and main pages
    matcher: [
        '/',
        '/(ar|en)/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
    ]
};
