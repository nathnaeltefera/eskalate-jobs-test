1. Tech Overview (your choice)
   Use any backend stack you’re fast with. Recommended (pick one):

Node.js: Fastify/Express or NestJS + TypeScript + Prisma/TypeORM + supapase postres

Email + file upload helpers:

Email: SMTP (e.g., Gmail/SendGrid/Mailgun)

File upload: Cloudinary (PDF/DOCX only)

JWT for auth. Argon2/bcrypt for password hashing.

2. Environment Variables
   Create a .env with:use

ini
Copy
Edit
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

# Public base URL for links in emails (your Render URL once deployed)

BASE_URL=https://your-app.onrender.com

# Cloudinary

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=... 3) Data Model & DB Rules
Tables

users
id (UUID/int, PK)

name (string) — full name rule: only alphabets, single space between first and last (e.g., ^[A-Za-z]+ [A-Za-z]+$)

email (string, unique, lowercase index)

password_hash (string)

role (enum: applicant | company)

email_verified (boolean, default false)

created_at (timestamp)

Indexes: email unique, role

email_verification_tokens
id (UUID/int, PK)

user_id (FK → users.id, cascade delete)

token (secure random string)

expires_at (timestamp)

used (boolean, default false)

created_at (timestamp)

Rules:

Single active token per user (optional but cleaner).

TTL = 60 minutes. On expired token use: issue new token, email again.

jobs
id (UUID/int, PK)

title (string, 1–100)

description (string, 20–2000)

location (string, optional)

status (enum: Draft | Open | Closed)

created_by (FK → users.id (must be company role))

created_at (timestamp)

Indexes: status, created_by, title (LOWER(title) text index), location (LOWER(location))

Status transition (forward only):

Draft → Open → Closed
No reverse allowed.

applications
id (UUID/int, PK)

applicant_id (FK → users.id, must be applicant)

job_id (FK → jobs.id)

resume_link (string; Cloudinary URL)

cover_letter (string, optional, < 200 chars)

status (enum: Applied | Reviewed | Interview | Rejected | Hired) — default Applied

applied_at (timestamp)

Constraints:

Unique (applicant_id, job_id) to prevent duplicates.

Indexes: status, (applicant_id, applied_at desc)

4. API Response Shapes (must match)
   Base Response
   json
   Copy
   Edit
   {
   "success": true,
   "message": "string",
   "object": {},
   "errors": null
   }
   Paginated Response
   json
   Copy
   Edit
   {
   "success": true,
   "message": "string",
   "object": [ {} ],
   "pageNumber": 1,
   "pageSize": 10,
   "totalSize": 123,
   "errors": null
   }
5. Auth, Roles, Ownership
   JWT in Authorization: Bearer <token>. Payload includes: sub (user id), role.

Roles:

applicant: browse jobs, apply, track own applications

company: create/update/delete own jobs, view applications to own jobs, update their statuses

Ownership:

Job mutation allowed only when job.created_by == currentUser.id.

Application management allowed only when application.job.created_by == currentUser.id.

6. Validation Rules (acceptance-criteria strict)
   Signup
   name: required, alphabets only, exactly one space between first & last

email: required, valid format, unique

password: required, ≥ 8 chars, contains uppercase + lowercase + number + special

role: required, company or applicant

On success:

Hash password

Create user email_verified = false

Generate verification token (expires in 60 min)

Send email with link: GET {BASE_URL}/api/auth/verify-email?token=...

Return base response

Email Verification
Input: token (query)

If token valid, not used, not expired → set email_verified = true, mark token used

If expired → do not verify; issue a new token and re-send verification email; response explains.

If already verified → respond that no action is required

If invalid/tampered → failure response

Login
email + password

Check user exists and password hash matches

On invalid → clear message (“Invalid email or password”)

On success → return JWT (sub, role) in base response

Job Create/Update/Delete (company only)
Create:

title 1–100, description 20–2000, location optional

status default Draft or Open (either acceptable initially)

created_by = current user id; created_at now

Update:

All fields optional; status forward-only (Draft→Open→Closed)

If not owner → { success:false, message:"Unauthorized access", object:null }

Delete:

If not owner → same unauthorized response

Browse Jobs (search + pagination)
Accessible to all authenticated users (acceptance criteria overrides the “Applicant only” story header)

Filters (optional, case-insensitive):

title (substring)

location (substring)

company (job owner’s user.name exact/substring)

Pagination: pageNumber (default 1), pageSize (default 10)

Returns paginated response

Apply for Job (applicant only)
Inputs:

resume file uploaded to Cloudinary (accept only pdf, docx)

coverLetter optional, < 200 chars

Enforce unique application per (applicant, job)

On success:

Set status = Applied, applied_at = now

Email the company owner notifying a new application

Return base response with application object

Track My Applications (applicant only)
Returns paginated list of the current user’s applications

Each item includes:

jobTitle, companyName, status, appliedAt

Filters:

company (name)

jobStatus (Open or Closed)

applicationStatus (one or more of Applied, Interview, Rejected, Hired, Reviewed)

Sorting (asc/desc):

appliedAt, companyName, applicationStatus, jobTitle

View My Posted Jobs (company only)
Returns paginated list of jobs where created_by == currentUser.id

Each job includes: title, description (full or truncated), location, status, createdAt, applicationsCount

Filter by status (optional)

View Job Details (all authenticated)
Input: jobId

If exists → base response with job object

If not → meaningful error

View Applications for a Job (company only)
Inputs: jobId (required), pageNumber=1, pageSize=10 (defaults)

Job must belong to current company

If not owner → { success:false, message:"Unauthorized access", object:null }

Each application includes:

applicantName, resumeLink, coverLetter, status, appliedAt

Filter by status (optional)

Paginated response

Update Application Status (company only)
Inputs: applicationId, newStatus ∈ Applied|Reviewed|Interview|Rejected|Hired

Must own the job associated with the application

If not → { success:false, message:"Unauthorized", object:null }

On success:

Update status

Email applicant only if new status is:

Interview: “You’ve been selected for an interview!”

Rejected: “We regret to inform you…”

Hired: “Congratulations! You’ve been hired.”

Email should include: Job title, new status, friendly message

Return base response with updated application

7. Routes (suggested)
   Replace :id with UUID/int per your DB.

Auth

POST /api/auth/signup

GET /api/auth/verify-email?token=...

POST /api/auth/login

Jobs

POST /api/jobs (company)

PATCH /api/jobs/:jobId (company, owner only)

DELETE /api/jobs/:jobId (company, owner only)

GET /api/jobs (all authenticated) — filters: title, location, company, pageNumber, pageSize

GET /api/jobs/:jobId (all authenticated)

Applications

POST /api/jobs/:jobId/applications (applicant; multipart/form-data with file)

GET /api/applications/me (applicant) — filters/sort/pagination via query

GET /api/jobs/:jobId/applications (company owner)

PATCH /api/applications/:applicationId/status (company owner)

8. Sample Requests
   Signup

bash
Copy
Edit
curl -X POST /api/auth/signup -H "Content-Type: application/json" -d '{
"name":"John Doe",
"email":"john@example.com",
"password":"Str0ng!Pass",
"role":"company"
}'
Verify Email

bash
Copy
Edit
curl "/api/auth/verify-email?token=SECURE_TOKEN"
Login

bash
Copy
Edit
curl -X POST /api/auth/login -H "Content-Type: application/json" -d '{
"email":"john@example.com",
"password":"Str0ng!Pass"
}'
Create Job (Bearer token required)
bash
Copy
Edit
curl -X POST /api/jobs \
 -H "Authorization: Bearer TOKEN" \
 -H "Content-Type: application/json" \
 -d '{
"title":"Backend Engineer",
"description":"Build APIs...",
"location":"Remote",
"status":"Draft"
}'
Apply to Job (multipart)

bash
Copy
Edit
curl -X POST /api/jobs/JOB_ID/applications \
 -H "Authorization: Bearer TOKEN" \
 -F "resume=@/path/resume.pdf" \
 -F "coverLetter=Excited to apply!"
Track My Applications (filters & sort)

bash
Copy
Edit
curl "/api/applications/me?company=Acme&jobStatus=Open&applicationStatus=Applied,Interview&sort=appliedAt&order=desc&pageNumber=1&pageSize=10" \
 -H "Authorization: Bearer TOKEN" 9) File Upload (Cloudinary)
Accept only application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document.

Upload to Cloudinary server-side using SDK; store secure URL in resume_link.

Reject other content types with clear validation error.

10. Email Flows (must implement)
    On signup

Generate verification token (random 32–64 bytes, base64/hex), persist with expires_at = now + 60 min

Email link: ${BASE_URL}/api/auth/verify-email?token=...

On verification

If token valid & not expired → mark used, set user email_verified=true

If expired → issue new token, email again, respond that new email sent

If already verified → respond “already verified”

If invalid → failure

Notifications

On new application → email job owner (company)

On status changes to Interview|Rejected|Hired → email applicant with templated friendly message including Job title & new status

11. Security Checklist (core + bonus)
    Hash passwords with Argon2 or bcrypt (cost ≥ 10)

Validate/normalize email to lowercase before unique check

Require email_verified=true to login (optional, but recommended)

JWT short expiry (e.g., 1d), consider refresh tokens (bonus)

Input validation on all endpoints (lengths, enums, content types)

Rate limit auth & file upload endpoints (abuse prevention bonus)

Helmet/security headers, strict CORS (allowed origins)

Centralized error handler; never leak stack traces to clients

Use parameterized queries/ORM to prevent SQL injection

12. Pagination, Filtering, Sorting (spec-accurate)
    Defaults: pageNumber=1, pageSize=10. Return totalSize.

Browse Jobs filters: title, location, company — case-insensitive substring
Track My Applications filters: company, jobStatus (Open|Closed), applicationStatus (CSV)
Sorting (Track My Applications): appliedAt, companyName, applicationStatus, jobTitle with order=asc|desc

13. Status Rules (must enforce)
    Jobs: Draft → Open → Closed (forward only)

Applications: can update to any of the allowed enums; email applicant only for Interview|Rejected|Hired

Duplicate application: reject with validation error

14. Swagger/Postman (required)
    Implement one:

Swagger (OpenAPI)
Annotate routes and models

Host public at /docs or /swagger

Add link in README

Postman
Export collection, Publish it, enable “Run in Postman”

Put the public link in README

15. Unit Tests (required – mock DB)
    Scope: “all the HTTP requests” (endpoints) with DB mocked

Node: Jest + ts-jest + dependency-injected repository interfaces or jest mocks for ORM client

Python: pytest + unittest.mock for repo/session + FastAPI TestClient

What to test:

Signup validations (name, password strength, email unique)

Email verification paths (valid, expired→resend, already verified, invalid)

Login (invalid creds, success JWT payload includes id & role)

Job create/update/delete (role & ownership; status forward only)

Browse jobs (filters, pagination)

Apply (role, file type, duplicate application prevention, email to company)

Track applications (filters, sorting, pagination)

Company list own jobs (filter by status, application counts)

View job details (exists vs not)

View applications for a job (ownership, pagination, filter by status)

Update application status (ownership, email on Interview/Rejected/Hired)

No real email/Cloudinary/DB: mock those services.

16. Suggested Folder Structure
    bash
    Copy
    Edit
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
    guards/ (role/ownership)
    validators/
    responses/
    integrations/
    email/
    cloudinary/
    tests/
    e2e/ (optional)
    unit/
17. Implementation Order (2-hour plan)
    Bootstrap project & DB (10–15m)

Project init, env, DB client, migration tool, users/jobs/applications/email_verification_tokens

Auth module (20m)

Signup (with token generation + email send stub), Login (JWT), Verify email

Jobs module (25m)

Create (company), Update/Delete (ownership + forward status), Get by id, Browse (filters + pagination)

Applications module (25m)

Apply (upload stub + validations + duplicate check + email), Track mine (filters/sort/pagination), Company views job applications, Update application status (emails)

Response wrapper middleware (5m)

Swagger/Postman (10m)

Unit tests (mocked DB) (20–25m)

Deploy to Render (last 10–15m)

Ensure healthcheck, DB connection, envs, and docs URL are public

(Adjust timeboxes as you go.)

18. Deployment (Render.com)
    Push to public GitHub.

Create Render Web Service:

Build command (examples):

Node (pnpm): pnpm install && pnpm build && pnpm prisma migrate deploy

Python: pip install -r requirements.txt && alembic upgrade head

Start command:

Node: node dist/main.js

Python (uvicorn): uvicorn src.app:app --host 0.0.0.0 --port $PORT

Set env vars in Render dashboard.

Provision a managed PostgreSQL on Render (or use external).

Migrate DB on deploy.

Verify /health and /docs (Swagger) or include Postman link.

19. README Deliverables (what to include before submitting)
    How to run locally (commands for your chosen stack)

Env vars (list above)

DB setup/migration steps

API documentation link (Swagger URL or Postman public link)

Tech choices (short rationale)

Non-functional techniques implemented (list from Security/Abuse/Performance)

Testing: how to run unit tests and what’s mocked

Deployment link (Render URL)

20. Example Objects (to mirror)
    Job object (response)

json
Copy
Edit
{
"id": "JOB_ID",
"title": "Backend Engineer",
"description": "text...",
"location": "Remote",
"status": "Open",
"createdBy": "USER_ID",
"createdAt": "2025-08-10T12:00:00Z"
}
Application object (response)

json
Copy
Edit
{
"id": "APP_ID",
"applicantId": "USER_ID",
"jobId": "JOB_ID",
"resumeLink": "https://res.cloudinary.com/.../resume.pdf",
"coverLetter": "string",
"status": "Applied",
"appliedAt": "2025-08-10T12:00:00Z"
} 21) Commit & Submission Rules
Frequent, clear commits (e.g., feat(auth): signup with email verification, fix(jobs): enforce forward status)

Submit via Google Form:

GitHub repo link

Deployment link (Render)

API docs link (Swagger or Postman)

22. Bonus: Non-Functional Enhancements (add and document)
    Performance: query indexes, pagination with COUNT optimization, lean selects

Abuse prevention: rate limit login & apply endpoints; IP-based throttling

Security: audit log (who updated status), request IDs & structured logging, deny unverified emails login, rotate tokens

Scalability: background jobs for sending emails/uploads; DI for easy testing; feature flags for email templates

23. Quick Local Run Templates (pick one)
    Node + Fastify + Prisma (example)
    bash
    Copy
    Edit
    pnpm i
    pnpm prisma migrate dev
    pnpm dev

# Swagger at /docs (using fastify-swagger)

pnpm test
Python + FastAPI + SQLAlchemy (example)
bash
Copy
Edit
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn src.app:app --reload

# Swagger at /docs

pytest -q 24) Final Checklist (copy/paste to track)
DB migrations for all tables + constraints + indexes

Password hashing + strong password validation

Signup → verification email with 60-min token

Verify email: valid / expired→resend / already verified / invalid

Login → JWT (id + role)

Create job (company)

Update/Delete job (owner only, forward status)

Browse jobs (filters + pagination)

View job details

Apply (applicant; Cloudinary; pdf/docx; duplicate prevention; email company)

Track my applications (filters + sort + pagination)

Company: view my jobs (count applications; filter status; pagination)

Company: view applications for one job (owner)

Company: update application status (+ conditional email)

Response wrapper matches Base/Paginated schemas

Swagger or Postman public docs link

Unit tests (DB mocked) for all endpoints

Render deployment works; env vars set

README updated with run steps, envs, docs links, and non-functional note
