# Al-Nahda University - Student Results Management System
# جامعة النهضة – نظام عرض نتائج الطلبة الآمن

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)

## Overview

A **production-grade, enterprise-level** academic results management system built with modern security practices and scalable architecture.

### Features

- 🔐 **Zero-Trust Security**: Multi-layer security with MFA, rate limiting, and audit logging
- 🌍 **Bilingual Support**: Full Arabic RTL and English LTR support
- 📊 **Academic Management**: GPA calculation, grade management, semester tracking
- 👨‍💼 **Admin Dashboard**: Role-based access control with full audit trails
- 🚀 **High Performance**: Redis caching, optimized queries, CDN-ready
- 📱 **Responsive Design**: Mobile-first, print-friendly result pages

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, Prisma |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Infrastructure | Docker, Nginx, Let's Encrypt |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/alnahda-university/results-system.git
cd results-system

# Start infrastructure services
docker-compose up -d postgres redis

# Setup backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Setup frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/api/docs |

## Project Structure

```
alnahda-university/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── domain/       # Business logic & entities
│   │   ├── application/  # Use cases & handlers
│   │   ├── infrastructure/ # Database, cache, external services
│   │   └── presentation/ # Controllers, guards, DTOs
│   └── prisma/           # Database schema & migrations
│
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities & hooks
│   └── messages/         # i18n translations
│
├── nginx/                # Reverse proxy configuration
├── docs/                 # Documentation
└── docker-compose.yml    # Development orchestration
```

## Security

This system implements enterprise-grade security:

- **Authentication**: JWT with HttpOnly cookies, token rotation
- **Authorization**: RBAC with permission-based access control
- **Rate Limiting**: IP-based with progressive delays
- **MFA**: TOTP-based for admin accounts
- **Audit Logging**: Immutable logs for all admin actions
- **Data Protection**: Argon2id password hashing, encrypted sensitive data

## Documentation

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [API Documentation](http://localhost:4000/api/docs)
- [Deployment Guide](docs/deployment-guide.md)
- [Security Checklist](docs/security-checklist.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact the IT department at Al-Nahda University.

---

**Built with ❤️ for Al-Nahda University**
