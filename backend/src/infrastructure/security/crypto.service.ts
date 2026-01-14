// ===========================================
// Crypto Service - Hashing & Encryption
// ===========================================

import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
    /**
     * Hash a password using Argon2id (recommended by OWASP)
     */
    async hashPassword(password: string): Promise<string> {
        return argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536, // 64 MB
            timeCost: 3,
            parallelism: 4,
        });
    }

    /**
     * Verify a password against a hash
     */
    async verifyPassword(hash: string, password: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, password);
        } catch {
            return false;
        }
    }

    /**
     * Hash a value using SHA-256 (for registration numbers, etc.)
     */
    hashSHA256(value: string): string {
        return crypto.createHash('sha256').update(value).digest('hex');
    }

    /**
     * Timing-safe comparison to prevent timing attacks
     */
    timingSafeEqual(a: string, b: string): boolean {
        if (a.length !== b.length) {
            // Still perform comparison to maintain consistent timing
            crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }

    /**
     * Generate a secure random string
     */
    generateRandomString(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a UUID v4
     */
    generateUUID(): string {
        return crypto.randomUUID();
    }

    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encrypt(plaintext: string, key: string): string {
        const iv = crypto.randomBytes(16);
        const keyBuffer = crypto.scryptSync(key, 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt data encrypted with AES-256-GCM
     */
    decrypt(ciphertext: string, key: string): string {
        const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const keyBuffer = crypto.scryptSync(key, 'salt', 32);

        const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Generate TOTP secret for MFA
     */
    generateTOTPSecret(): string {
        return crypto.randomBytes(20).toString('hex');
    }

    /**
     * Hash a token for storage (refresh tokens, etc.)
     */
    hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
