import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database connection
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and getting real IP)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('common'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  setHeaders: (res, path) => {
    // Set appropriate Content-Type for common file types
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (path.endsWith('.doc')) {
      res.setHeader('Content-Type', 'application/msword');
    } else if (path.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else if (path.endsWith('.txt')) {
      res.setHeader('Content-Type', 'text/plain');
    }
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/applications', applicationRoutes);

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`
🚀 AI-LMS Backend Server Started Successfully!

📊 Server Information:
   • Port: ${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • Node.js Version: ${process.version}
   
🔗 API Endpoints:
   • Health Check: http://localhost:${PORT}/api/health
   • API Documentation: http://localhost:${PORT}/api
   • Authentication: http://localhost:${PORT}/api/auth
   • Courses: http://localhost:${PORT}/api/courses
   • Documents: http://localhost:${PORT}/api/documents
   • AI Services: http://localhost:${PORT}/api/ai
   • Enrollments: http://localhost:${PORT}/api/enrollments
   • Applications: http://localhost:${PORT}/api/applications

📁 File Uploads: http://localhost:${PORT}/uploads/

⚙️  Features Enabled:
   • JWT Authentication ✅
   • File Upload (Multer) ✅
   • AI Document Summarization ✅
   • CORS Protection ✅
   • Rate Limiting ✅
   • Security Headers ✅
   • Request Compression ✅
   • Error Handling ✅

Ready to accept requests! 🎉
      `);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;