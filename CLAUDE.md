# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Job Application Management System** - a talent management platform that connects job seekers (applicants) and companies. The system handles job postings, applications with resume uploads, and application status tracking.

## Architecture Overview

The project is designed as a REST API with the following key components:

### Database Schema
- **users**: Stores applicants and companies with role-based access
- **email_verification_tokens**: Manages email verification with 60-minute TTL
- **jobs**: Job postings with status workflow (Draft → Open → Closed)
- **applications**: Job applications with status tracking (Applied → Reviewed → Interview → Rejected/Hired)

### API Response Format
All responses follow standardized formats:
- Base Response: `{success, message, object, errors}`
- Paginated Response: adds `pageNumber`, `pageSize`, `totalSize`

### Authentication & Authorization
- JWT-based authentication with role-based access (applicant/company)
- Email verification required for account activation
- Ownership-based authorization for job and application management

## Key Features & Business Rules

### User Management
- **Name validation**: Alphabets only with single space between first/last name (regex: `^[A-Za-z]+ [A-Za-z]+$`)
- **Password requirements**: ≥8 chars with uppercase, lowercase, number, special character
- **Email verification**: 60-minute token expiry with resend capability

### Job Management
- **Status workflow**: Forward-only transitions (Draft → Open → Closed)
- **Ownership**: Only job creators can modify their jobs
- **Search**: Case-insensitive filtering by title, location, company name

### Application Management
- **File uploads**: PDF/DOCX only via Cloudinary
- **Duplicate prevention**: Unique constraint on (applicant_id, job_id)
- **Status notifications**: Email alerts for Interview/Rejected/Hired status changes
- **Company access**: Only job owners can view/manage applications

## Development Commands

Since no package.json or build configuration exists yet, you'll need to set these up based on the tech stack chosen:

### For Node.js/TypeScript Stack:
```bash
# Install dependencies
pnpm install

# Database setup
pnpm prisma migrate dev

# Development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### For Python/FastAPI Stack:
```bash
# Virtual environment setup
python -m venv .venv && source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Database migrations
alembic upgrade head

# Development server
uvicorn src.app:app --reload

# Run tests
pytest -q
```

## Required Environment Variables

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60

# Email
EMAIL_FROM=Talent Team <noreply@yourdomain.com>
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=...

# Base URL for email links
BASE_URL=https://your-app.onrender.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## API Endpoints Structure

### Auth Routes
- `POST /api/auth/signup` - User registration with email verification
- `GET /api/auth/verify-email?token=...` - Email verification
- `POST /api/auth/login` - JWT authentication

### Job Routes
- `POST /api/jobs` - Create job (company only)
- `PATCH /api/jobs/:jobId` - Update job (owner only)
- `DELETE /api/jobs/:jobId` - Delete job (owner only)
- `GET /api/jobs` - Browse jobs with filters (all authenticated)
- `GET /api/jobs/:jobId` - Get job details (all authenticated)

### Application Routes
- `POST /api/jobs/:jobId/applications` - Apply to job with resume upload (applicant only)
- `GET /api/applications/me` - Track own applications (applicant only)
- `GET /api/jobs/:jobId/applications` - View applications for job (company owner only)
- `PATCH /api/applications/:applicationId/status` - Update application status (company owner only)

## Testing Requirements

Unit tests must cover all endpoints with mocked database:
- Signup validations and email verification flows
- Authentication and role-based access
- Job CRUD operations with ownership checks
- Application workflow with file upload and notifications
- Pagination, filtering, and sorting functionality

## Security Considerations

- Password hashing with Argon2/bcrypt (cost ≥ 10)
- Email normalization to lowercase
- Input validation on all endpoints
- Rate limiting on auth and file upload endpoints
- Parameterized queries to prevent SQL injection
- JWT with reasonable expiry times
- File type validation for uploads (PDF/DOCX only)

## Suggested Project Structure

```
src/
  app.(ts|py)
  config/
  db/
  modules/
    auth/
    users/
    jobs/
    applications/
  common/
    middleware/
    guards/
    validators/
    responses/
  integrations/
    email/
    cloudinary/
tests/
  unit/
  e2e/ (optional)
```

## Documentation Requirements

Must implement either:
- **Swagger/OpenAPI**: Host at `/docs` or `/swagger`
- **Postman Collection**: Publish with "Run in Postman" button

## Deployment Target

- **Platform**: Render.com
- **Database**: Managed PostgreSQL
- **Build**: Include migration step in build command
- **Health Check**: Implement `/health` endpoint
- **Public Access**: API documentation must be publicly accessible