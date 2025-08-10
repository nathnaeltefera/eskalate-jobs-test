import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Import routes
import { authRouter } from './routes/auth';
import { jobsRouter } from './routes/jobs';
import { applicationsRouter } from './routes/applications';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Import configuration
import { setupSwagger } from './config/swagger';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.BASE_URL!] 
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger documentation FIRST
setupSwagger(app);

// Redirect routes (before other middlewares can interfere)
app.get('/', (req, res) => {
  console.log('Root route hit, redirecting to /api/docs');
  res.redirect('/api/docs');
});

app.get('/docs', (req, res) => {
  console.log('/docs route hit, redirecting to /api/docs');
  res.redirect('/api/docs');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    object: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    errors: null,
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api', jobsRouter);
app.use('/api', applicationsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    object: null,
    errors: [`Route ${req.method} ${req.originalUrl} not found`],
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;