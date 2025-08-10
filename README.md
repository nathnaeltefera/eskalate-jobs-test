# Job Application Management System

A RESTful API backend for a job application management system where companies can post jobs and applicants can apply, built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, login, and email verification for both applicants and companies
- **Job Management**: Companies can create, update, delete, and manage job postings
- **Application System**: Applicants can apply for jobs with resume upload and track applications
- **Role-based Access Control**: Separate permissions for applicants and companies
- **File Upload**: Secure resume upload to Cloudinary (PDF/DOCX only)
- **Email Notifications**: Automated emails for verification, applications, and status updates
- **Advanced Search & Filtering**: Search jobs by title, location, company with pagination

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation with Joi
- **Rate Limiting**: Protection against abuse
- **Swagger Documentation**: Complete API documentation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Database Relationships**: Proper foreign keys and constraints
- **Email Verification**: Time-limited tokens with automatic expiry handling

## 🛠 Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Cloudinary for resume uploads
- **Email**: Nodemailer with SMTP
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS, Rate Limiting
- **Deployment**: Render.com

## 📋 Prerequisites

Before running this application, you need to set up the following services:

### 1. Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string (DATABASE_URL)

### 2. File Storage Setup (Cloudinary)
1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. From your dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

### 3. Email Service Setup
Choose one of these options:

**Option A: Gmail SMTP (Easiest for development)**
1. Use your Gmail account
2. Enable 2-factor authentication
3. Generate an App Password in Google Account settings
4. Use your Gmail address and app password

**Option B: SendGrid (Recommended for production)**
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Get your API key from Settings > API Keys

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd eskalte-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your `.env` file with the values from the prerequisites:
   ```env
   NODE_ENV=development
   PORT=8080
   
   # Database (from Supabase)
   DATABASE_URL=postgresql://user:password@host:5432/database
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=1d
   
   # Email Verification
   EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60
   
   # Email Service
   EMAIL_FROM=Talent Team <noreply@yourdomain.com>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Base URL
   BASE_URL=http://localhost:8080
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8080`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8080/api/docs`
- **Health Check**: `http://localhost:8080/health`

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `GET /api/auth/verify-email?token=...` - Email verification
- `POST /api/auth/login` - User login

### Jobs
- `POST /api/jobs` - Create job (Company only)
- `GET /api/jobs` - Browse jobs with filters
- `GET /api/jobs/my` - Get my posted jobs (Company only)
- `GET /api/jobs/:jobId` - Get job details
- `PATCH /api/jobs/:jobId` - Update job (Company only, owner only)
- `DELETE /api/jobs/:jobId` - Delete job (Company only, owner only)

### Applications
- `POST /api/jobs/:jobId/applications` - Apply for job (Applicant only)
- `GET /api/applications/me` - Track my applications (Applicant only)
- `GET /api/jobs/:jobId/applications` - View job applications (Company only, owner only)
- `PATCH /api/applications/:applicationId/status` - Update application status (Company only, owner only)

## 🧪 Testing

The API includes comprehensive input validation, error handling, and security measures:

### User Registration Validation
- Name: Only alphabets with single space between first/last name
- Email: Valid format, unique constraint
- Password: Minimum 8 chars with uppercase, lowercase, number, special character
- Role: Must be either 'applicant' or 'company'

### File Upload Validation
- Only PDF and DOCX files allowed
- Maximum file size: 5MB
- Secure upload to Cloudinary

### Business Logic Validation
- Job status transitions: Draft → Open → Closed (forward only)
- Duplicate application prevention
- Role-based access control
- Ownership verification for updates

## 🚀 Deployment

### Deploy to Render

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `npm install && npm run build && npm run prisma:generate && npm run prisma:migrate`
     - **Start Command**: `npm start`
     - **Environment**: Add all your environment variables from `.env`

3. **Set Environment Variables in Render**
   - Copy all variables from your `.env` file
   - Update `BASE_URL` to your Render URL
   - Ensure `NODE_ENV=production`

## 📧 Email Templates

The system sends automated emails for:
- **Email Verification**: Secure link with 1-hour expiration
- **New Applications**: Notification to company when someone applies
- **Status Updates**: Notifications for Interview, Rejection, or Hiring

## 🔒 Security Features

- **Password Security**: bcrypt hashing with salt rounds = 12
- **JWT Security**: Short-lived tokens with secure secrets
- **Input Validation**: Comprehensive validation on all endpoints
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Properly configured cross-origin requests
- **Security Headers**: Helmet.js for security headers
- **File Upload Security**: Type validation and size limits

## 📊 Database Schema

### Users Table
- UUID primary key
- Role-based access (applicant/company)
- Email verification status
- Secure password hashing

### Jobs Table  
- Status workflow enforcement
- Foreign key to creator
- Search indexes on title/location

### Applications Table
- Unique constraint preventing duplicate applications
- File URL storage for resumes
- Status tracking with email notifications

### Email Verification Tokens
- Time-limited tokens (1 hour expiry)
- Automatic cleanup of used/expired tokens

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@example.com or create an issue in the GitHub repository.

---

Built with ❤️ using Node.js, TypeScript, and modern backend technologies.