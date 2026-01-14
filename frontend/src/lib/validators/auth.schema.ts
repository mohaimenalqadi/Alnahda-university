// ===========================================
// Validation Schemas
// ===========================================

import { z } from 'zod';

export const studentLoginSchema = z.object({
    registrationNumber: z
        .string()
        .min(1, 'login.errors.requiredField')
        .regex(
            /^[0-9]+$/,
            'login.errors.invalidFormat'
        ),
    dateOfBirth: z
        .string()
        .min(1, 'login.errors.requiredField')
        .refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'login.errors.invalidFormat'),
});

export const adminLoginSchema = z.object({
    email: z
        .string()
        .min(1, 'login.errors.requiredField')
        .email('login.errors.invalidFormat'),
    password: z
        .string()
        .min(1, 'login.errors.requiredField'),
    mfaCode: z.string().optional(),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
