# Al-Nahda University - Secure Student Results Management System
# جامعة النهضة – نظام عرض نتائج الطلبة الآمن

## Master Implementation Plan & Requirements Document

> **Document Version**: 1.0  
> **Created**: 2026-01-10  
> **Last Updated**: 2026-01-10  
> **Status**: APPROVED - IN EXECUTION

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Security Model](#security-model)
6. [API Specifications](#api-specifications)
7. [Frontend Requirements](#frontend-requirements)
8. [DevOps & Deployment](#devops--deployment)
9. [Future Requirements](#future-requirements)

---

## Executive Summary

This document serves as the **single source of truth** for the Al-Nahda University Student Results Management System. It outlines all architectural decisions, requirements, and implementation details for building a production-grade, enterprise-level academic platform.

### Core Objectives

1. **Secure Student Access**: Allow students to securely view their academic results
2. **Data Protection**: Prevent data leakage, brute-force attacks, and impersonation
3. **High Availability**: Support thousands of concurrent users during result announcements
4. **Scalability**: Future-proof architecture for institutional growth
5. **Compliance**: Meet modern security and software engineering standards

---

## System Architecture

### Architecture Pattern: Clean Architecture + Domain-Driven Design (DDD)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │   Next.js Frontend   │  │   NestJS REST Controllers        │ │
│  │   (Student Portal)   │  │   (API Endpoints)                │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Use Cases / Command Handlers / Query Handlers          │   │
│  │   - AuthenticateStudentHandler                           │   │
│  │   - GetStudentResultsHandler                             │   │
│  │   - CreateGradeHandler                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Student Aggregate│  │ Grade Aggregate │  │ Admin Aggregate │  │
│  │ - Student        │  │ - Grade         │  │ - AdminUser     │  │
│  │ - Identifier     │  │ - Course        │  │ - Role          │  │
│  │                  │  │ - Enrollment    │  │ - Permission    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Domain Services: GPACalculator, GradeValidator         │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │   PostgreSQL   │  │     Redis      │  │   External APIs    │ │
│  │   (Prisma ORM) │  │   (Caching)    │  │   (Email, etc.)    │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### SOLID Principles Enforcement

| Principle | Implementation |
|-----------|----------------|
| **S**ingle Responsibility | Each class has one reason to change |
| **O**pen/Closed | Extend via interfaces, not modification |
| **L**iskov Substitution | Repository interfaces allow swapping implementations |
| **I**nterface Segregation | Small, focused interfaces per domain |
| **D**ependency Inversion | Domain depends on abstractions, not concretions |

---

## Technology Stack

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x (strict) |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.x |
| Queue | Bull | 4.x |
| Validation | Zod | 3.x |
| API Docs | Swagger/OpenAPI | 3.0 |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 14.x (App Router) |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 3.x |
| State | React Query | 5.x |
| Validation | Zod | 3.x |
| i18n | next-intl | 3.x |
| Forms | React Hook Form | 7.x |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| CI/CD | GitHub Actions |

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│    Department   │    │      Student        │    │StudentIdentifier│
├─────────────────┤    ├─────────────────────┤    ├─────────────────┤
│ id (UUID) PK    │◄───│ department_id FK    │    │ id (UUID) PK    │
│ name_ar         │    │ id (UUID) PK        │───►│ student_id FK   │
│ name_en         │    │ full_name_ar        │    │ reg_number_hash │
│ code            │    │ full_name_en        │    │ reg_number_prefix│
│ created_at      │    │ date_of_birth       │    │ created_at      │
└─────────────────┘    │ email               │    └─────────────────┘
         │             │ academic_year       │
         │             │ status              │
         ▼             │ created_at          │
┌─────────────────┐    │ updated_at          │
│     Course      │    │ deleted_at          │
├─────────────────┤    └─────────────────────┘
│ id (UUID) PK    │              │
│ code            │              │
│ name_ar         │              ▼
│ name_en         │    ┌─────────────────────┐    ┌─────────────────┐
│ department_id FK│    │    Enrollment       │    │    Semester     │
│ created_at      │    ├─────────────────────┤    ├─────────────────┤
└─────────────────┘    │ id (UUID) PK        │◄───│ id (UUID) PK    │
         │             │ student_id FK       │    │ name_ar         │
         ▼             │ course_unit_id FK   │    │ name_en         │
┌─────────────────┐    │ semester_id FK      │    │ year            │
│   CourseUnit    │◄───│ enrolled_at         │    │ term            │
├─────────────────┤    │ created_at          │    │ start_date      │
│ id (UUID) PK    │    └─────────────────────┘    │ end_date        │
│ course_id FK    │              │                │ is_active       │
│ units           │              ▼                └─────────────────┘
│ max_coursework  │    ┌─────────────────────┐
│ max_final_exam  │    │       Grade         │
│ passing_score   │    ├─────────────────────┤
│ is_active       │    │ id (UUID) PK        │
└─────────────────┘    │ enrollment_id FK    │
                       │ coursework_score    │
                       │ final_exam_score    │
                       │ total_score         │
                       │ letter_grade        │
                       │ grade_points        │
                       │ is_published        │
                       │ created_by FK       │
                       │ created_at          │
                       │ published_at        │
                       └─────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AdminUser     │    │      Role       │    │   Permission    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID) PK    │    │ id (UUID) PK    │    │ id (UUID) PK    │
│ email           │◄──►│ name            │◄──►│ name            │
│ password_hash   │    │ description     │    │ resource        │
│ full_name       │    └─────────────────┘    │ action          │
│ mfa_enabled     │                           └─────────────────┘
│ mfa_secret      │
│ is_active       │    ┌─────────────────────┐
│ failed_attempts │    │     AuditLog        │
│ locked_until    │    ├─────────────────────┤
│ last_login_at   │───►│ id (UUID) PK        │
└─────────────────┘    │ admin_user_id FK    │
                       │ action              │
                       │ resource            │
                       │ resource_id         │
                       │ old_values (JSON)   │
                       │ new_values (JSON)   │
                       │ ip_address          │
                       │ user_agent          │
                       │ correlation_id      │
                       │ created_at          │
                       └─────────────────────┘
```

### Grading System

| Letter Grade | Score Range | Grade Points |
|--------------|-------------|--------------|
| A+ | 95-100 | 4.00 |
| A | 90-94 | 3.75 |
| B+ | 85-89 | 3.50 |
| B | 80-84 | 3.00 |
| C+ | 75-79 | 2.50 |
| C | 70-74 | 2.00 |
| D+ | 65-69 | 1.50 |
| D | 60-64 | 1.00 |
| F | 0-59 | 0.00 |

### GPA Calculation Formula

```
GPA = Σ(Grade Points × Course Units) / Σ(Course Units)

Example:
- Course A: 4 units, Grade B (3.00) → 12 points
- Course B: 3 units, Grade A (3.75) → 11.25 points
- Course C: 2 units, Grade C+ (2.50) → 5 points

GPA = (12 + 11.25 + 5) / (4 + 3 + 2) = 28.25 / 9 = 3.14
```

---

## Security Model

### Zero-Trust Security Layers

```
Layer 1: Network Security
├── Nginx Rate Limiting (100 req/min per IP)
├── SSL/TLS Encryption (Let's Encrypt)
├── HTTP Security Headers (CSP, HSTS, X-Frame-Options)
└── DDoS Protection (Cloudflare optional)

Layer 2: Application Security
├── Input Validation (Zod schemas)
├── CSRF Protection (Double-submit cookies)
├── XSS Prevention (Content Security Policy)
└── SQL Injection Prevention (Prisma ORM)

Layer 3: Authentication
├── JWT Tokens (HttpOnly cookies)
├── Token Rotation (15min access, 7d refresh)
├── MFA for Admins (TOTP)
└── Device Fingerprinting

Layer 4: Authorization
├── Role-Based Access Control (RBAC)
├── Policy-Based Access Control
├── Resource-Level Permissions
└── Audit Logging (Immutable)

Layer 5: Data Security
├── Password Hashing (Argon2id)
├── Sensitive Data Encryption (AES-256)
├── UUID Primary Keys (No enumeration)
└── Soft Deletes (Data integrity)
```

### Security Threat Matrix

| Threat | Risk Level | Mitigation |
|--------|------------|------------|
| SQL Injection | Critical | Prisma ORM, parameterized queries |
| XSS | High | CSP headers, React auto-escaping |
| CSRF | High | SameSite cookies, CSRF tokens |
| Brute Force | High | Rate limiting, progressive delays |
| Session Hijacking | High | HttpOnly, Secure, SameSite cookies |
| User Enumeration | Medium | Generic error messages |
| IDOR | Medium | UUID keys, authorization guards |
| Replay Attacks | Medium | Short token expiry, refresh rotation |

---

## API Specifications

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/student/login` | Student authentication |
| POST | `/api/v1/auth/student/logout` | Student logout |
| POST | `/api/v1/auth/student/refresh` | Refresh token |

### Protected Endpoints (Student)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/student/profile` | Get student profile |
| GET | `/api/v1/student/results` | Get all results |
| GET | `/api/v1/student/results/:semesterId` | Get semester results |
| GET | `/api/v1/student/gpa` | Get GPA summary |

### Admin Endpoints (MFA Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/auth/login` | Admin login |
| POST | `/api/v1/admin/auth/mfa/verify` | Verify MFA code |
| GET | `/api/v1/admin/students` | List students |
| POST | `/api/v1/admin/grades` | Create grade |
| PATCH | `/api/v1/admin/grades/:id` | Update grade |
| GET | `/api/v1/admin/audit-logs` | View audit logs |

---

## Frontend Requirements

### Pages

1. **Student Login** (`/login`)
   - Registration number input
   - Date of birth picker
   - Rate limit feedback
   - Arabic/English toggle

2. **Student Results** (`/results`)
   - Semester tabs
   - Grades table (Arabic layout)
   - GPA display
   - Print button (PDF-friendly)

3. **Admin Dashboard** (`/admin`)
   - Statistics overview
   - Student management
   - Grade management
   - Audit log viewer

### RTL Support Requirements

- Direction: `rtl` for Arabic
- Font: Arabic-optimized (Tajawal, Cairo)
- Number formatting: Arabic numerals optional
- Date formatting: Hijri calendar support

---

## DevOps & Deployment

### Docker Services

```yaml
services:
  - postgres (Database)
  - redis (Cache)
  - backend (NestJS API)
  - frontend (Next.js)
  - nginx (Reverse Proxy)
```

### Environment Variables

```
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/alnahda

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
CORS_ORIGINS=https://results.alnahda-university.edu
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

### Hosting Recommendation

**Provider**: Hetzner Cloud CX21  
**Specs**: 2 vCPU, 4GB RAM, 40GB SSD  
**Cost**: ~€4.15/month (~$5)  
**Region**: Choose closest to Egypt (Germany or Finland)

---

## Future Requirements

> Add new requirements here as the project evolves

### Planned Features

- [ ] SMS notifications for result announcements
- [ ] Mobile app (React Native)
- [ ] Parent portal access
- [ ] Academic advisor dashboard
- [ ] Course registration module
- [ ] Financial status integration
- [ ] Graduation requirements tracker

### Scalability Roadmap

1. **Phase 1**: Single server deployment
2. **Phase 2**: Database read replicas
3. **Phase 3**: Horizontal API scaling
4. **Phase 4**: CDN for static assets
5. **Phase 5**: Microservices extraction

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-10 | Initial plan creation | System |

---

**END OF DOCUMENT**
