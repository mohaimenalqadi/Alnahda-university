// ===========================================
// Utility Functions
// ===========================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number with Arabic numerals if in Arabic locale
 */
export function formatNumber(
    num: number,
    locale: string = 'ar',
    options?: Intl.NumberFormatOptions
): string {
    const formattedLocale = locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
    return new Intl.NumberFormat(formattedLocale, options).format(num);
}

/**
 * Format a date based on locale
 */
export function formatDate(date: Date | string, locale: string = 'ar'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

/**
 * Get grade CSS class based on letter grade
 */
export function getGradeClass(grade: string): string {
    const gradeMap: Record<string, string> = {
        'A+': 'grade-a-plus',
        'A': 'grade-a',
        'B+': 'grade-b-plus',
        'B': 'grade-b',
        'C+': 'grade-c-plus',
        'C': 'grade-c',
        'D+': 'grade-d-plus',
        'D': 'grade-d',
        'F': 'grade-f',
    };
    return gradeMap[grade] || 'grade-f';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
