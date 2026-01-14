# Security Checklist
# Al-Nahda University - Student Results System

## Pre-Deployment Security Audit

Use this checklist before deploying to production.

---

## 🔐 Authentication & Authorization

### ✅ Student Authentication
- [ ] Registration numbers are hashed before storage (SHA-256)
- [ ] Date of birth comparison uses timing-safe comparison
- [ ] Generic error messages prevent user enumeration
- [ ] Login attempts are logged for security auditing
- [ ] Rate limiting: 5 attempts per 5 minutes per IP

### ✅ Admin Authentication
- [ ] Passwords hashed with Argon2id (memory: 64MB, iterations: 3)
- [ ] MFA (TOTP) enabled for all admin accounts
- [ ] Account lockout after 5 failed attempts (30 min)
- [ ] Session timeout configured (15 min access, 7 day refresh)
- [ ] Admin routes are hidden (not publicly discoverable)

### ✅ Token Security
- [ ] JWT tokens stored in HttpOnly cookies
- [ ] Secure flag enabled in production
- [ ] SameSite=Strict in production
- [ ] Token rotation on refresh
- [ ] Refresh token stored as hash in database

---

## 🛡️ Input Validation & Sanitization

### ✅ Backend Validation
- [ ] All inputs validated with class-validator/Zod
- [ ] Global validation pipe enabled (whitelist: true, forbidNonWhitelisted: true)
- [ ] File uploads validated for type and size (if applicable)
- [ ] JSON payload size limited

### ✅ Frontend Validation
- [ ] Client-side validation with Zod schemas
- [ ] Proper error messages without sensitive details
- [ ] Input sanitization before display

### ✅ Database Security
- [ ] Prisma ORM used (parameterized queries)
- [ ] No raw SQL queries with user input
- [ ] UUID primary keys (no sequential IDs)
- [ ] Soft deletes for academic data integrity

---

## 🔒 HTTP Security Headers

### ✅ Required Headers
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### ✅ Content Security Policy
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' api.your-domain.edu;
frame-ancestors 'self';
```

---

## 🚫 Protection Against Common Attacks

### ✅ SQL Injection
- [ ] Prisma ORM for all queries
- [ ] No string concatenation in queries
- [ ] Input validation for all parameters

### ✅ XSS (Cross-Site Scripting)
- [ ] React auto-escaping enabled
- [ ] CSP headers configured
- [ ] No dangerouslySetInnerHTML usage
- [ ] User content sanitized before display

### ✅ CSRF (Cross-Site Request Forgery)
- [ ] SameSite cookie attribute set
- [ ] CSRF tokens for state-changing operations (if needed)
- [ ] Origin header validation in middleware

### ✅ Brute Force
- [ ] Rate limiting on all endpoints (100 req/min)
- [ ] Stricter rate limiting on auth endpoints (5 req/5min)
- [ ] Progressive delays on failed attempts
- [ ] IP blocking after excessive failures

### ✅ IDOR (Insecure Direct Object References)
- [ ] UUID keys instead of incremental IDs
- [ ] Authorization checks in all handlers
- [ ] Students can only access their own data
- [ ] Admins can only access based on permissions

### ✅ Session Hijacking
- [ ] HttpOnly cookies (no JavaScript access)
- [ ] Secure cookies in production
- [ ] Device fingerprinting for admin sessions
- [ ] Session invalidation on logout

---

## 📝 Audit & Logging

### ✅ Security Logging
- [ ] All login attempts logged (success/failure)
- [ ] Admin actions logged with full details
- [ ] Audit logs are immutable (append-only)
- [ ] Correlation IDs for request tracing
- [ ] IP addresses and user agents captured

### ✅ Log Security
- [ ] No sensitive data in logs (passwords, tokens)
- [ ] Log rotation configured
- [ ] Logs stored securely with restricted access

---

## 🔧 Infrastructure Security

### ✅ Server Configuration
- [ ] UFW firewall enabled (only 80, 443, 22)
- [ ] SSH key authentication (password disabled)
- [ ] Fail2Ban installed and configured
- [ ] Regular security updates (unattended-upgrades)

### ✅ Docker Security
- [ ] Non-root users in containers
- [ ] Read-only filesystems where possible
- [ ] Resource limits configured
- [ ] No privileged containers
- [ ] Secrets passed via environment variables

### ✅ Network Security
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] TLS 1.2+ only
- [ ] Internal services not exposed publicly
- [ ] Database accessible only from backend container

---

## 🔑 Secrets Management

### ✅ Environment Variables
- [ ] `.env` files excluded from Git
- [ ] Separate configs for dev/staging/prod
- [ ] Secrets have sufficient entropy (64+ chars)
- [ ] Secrets rotated regularly

### ✅ Required Secrets
| Secret | Min Length | Rotation |
|--------|------------|----------|
| POSTGRES_PASSWORD | 32 chars | 90 days |
| REDIS_PASSWORD | 32 chars | 90 days |
| JWT_ACCESS_SECRET | 64 chars | 30 days |
| JWT_REFRESH_SECRET | 64 chars | 30 days |

---

## 📱 Client-Side Security

### ✅ Browser Security
- [ ] No localStorage for sensitive data
- [ ] Cookies with proper attributes
- [ ] CORS properly configured
- [ ] No sensitive data in URL parameters

### ✅ Error Handling
- [ ] Generic errors in production
- [ ] No stack traces exposed to users
- [ ] Detailed errors only in development

---

## 📊 Data Protection

### ✅ Personal Data
- [ ] Registration numbers hashed (not reversible)
- [ ] Passwords hashed with Argon2id
- [ ] Soft deletes preserve data integrity
- [ ] No grade overwrites (historical integrity)

### ✅ Data Access
- [ ] RBAC (Role-Based Access Control)
- [ ] Minimum privilege principle
- [ ] API returns only necessary fields

---

## 🔄 Backup & Recovery

### ✅ Backup Strategy
- [ ] Daily automated database backups
- [ ] Backups encrypted at rest
- [ ] Backups stored off-site
- [ ] Retention policy: 7 days local, 30 days remote

### ✅ Recovery Testing
- [ ] Backup restoration tested monthly
- [ ] RTO (Recovery Time Objective): 4 hours
- [ ] RPO (Recovery Point Objective): 24 hours

---

## ✅ Final Verification

Before going live:

1. [ ] Run OWASP ZAP scan
2. [ ] Test rate limiting manually
3. [ ] Verify SSL configuration (SSL Labs A+)
4. [ ] Test login flow end-to-end
5. [ ] Verify audit logs capture all actions
6. [ ] Test backup/restore procedure
7. [ ] Review Nginx access logs for errors
8. [ ] Load test with expected concurrent users

---

## 🚨 Incident Response

### Security Incident Contacts
- **IT Security Lead**: [Contact Info]
- **System Administrator**: [Contact Info]
- **University IT Director**: [Contact Info]

### Immediate Actions for Breach
1. Isolate affected systems
2. Preserve logs and evidence
3. Reset all admin credentials
4. Notify stakeholders
5. Conduct forensic analysis
6. Implement remediation
7. Document lessons learned

---

**Last Updated**: 2026-01-10  
**Next Review**: 2026-02-10
