# AI-LMS Backend

A complete production-ready Backend for Learning Management System (LMS) with AI document summarization capabilities.

## 🚀 Features

- **Complete Authentication System** - JWT with access & refresh tokens, role-based access (Admin/Learner)
- **Course Management** - Full CRUD for courses, modules, and items (videos/documents)
- **Document Upload & Management** - File upload with text extraction (PDF, DOC, DOCX, TXT)
- **AI Document Summarization** - Integration with OpenAI GPT & Google Gemini for automatic document summarization
- **Enrollment System** - Course enrollment, progress tracking, completion percentage calculation
- **Marketing Applications** - Contact form handling with lead management and follow-up system
- **File Upload System** - Secure file upload with validation, organized directory structure
- **Security** - CORS, Helmet, Rate limiting, Input validation, Password hashing
- **Database** - MongoDB with Mongoose ODM, optimized with indexes

## 📁 Project Structure

```
backend/
│── config/
│     └── db.js                 # MongoDB connection configuration
│── controllers/
│     ├── authController.js     # Authentication logic
│     ├── courseController.js   # Course management
│     ├── moduleController.js   # Module & item management
│     ├── documentController.js # Document upload & management
│     ├── aiController.js       # AI summarization services
│     ├── enrollmentController.js # Course enrollment logic
│     └── applicationController.js # Marketing applications
│── middlewares/
│     ├── authMiddleware.js     # JWT authentication & authorization
│     └── upload.js             # File upload handling
│── models/
│     ├── User.js              # User schema (Admin/Learner)
│     ├── Course.js            # Course with modules & items
│     ├── Enrollment.js        # User course enrollments
│     ├── Document.js          # Uploaded documents
│     └── Application.js       # Marketing applications
│── routes/
│     ├── authRoutes.js        # Authentication endpoints
│     ├── courseRoutes.js      # Course management endpoints
│     ├── documentRoutes.js    # Document endpoints
│     ├── aiRoutes.js          # AI service endpoints
│     ├── enrollmentRoutes.js  # Enrollment endpoints
│     └── applicationRoutes.js # Application endpoints
│── uploads/                   # File upload directory
│── .env                      # Environment variables
│── server.js                 # Main Express server
└── package.json             # Dependencies & scripts
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- OpenAI API key (optional, for AI summarization)
- Google Gemini API key (optional, for AI summarization)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy the `.env` file and update the variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai-lms?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📋 API Documentation

### Authentication Endpoints (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user
- `GET /users` - Get all users (Admin only)
- `PUT /users/:id/deactivate` - Deactivate user (Admin only)

### Course Endpoints (`/api/courses`)
- `POST /` - Create course (Admin only)
- `GET /` - Get all courses
- `GET /:id` - Get single course
- `PUT /:id` - Update course (Admin only)
- `DELETE /:id` - Delete course (Admin only)
- `POST /:id/modules` - Add module (Admin only)
- `PUT /:courseId/modules/:moduleId` - Update module (Admin only)
- `DELETE /:courseId/modules/:moduleId` - Delete module (Admin only)
- `POST /:courseId/modules/:moduleId/items` - Add item (Admin only)
- `GET /:courseId/modules/:moduleId/items` - Get module items
- `GET /stats` - Get course statistics (Admin only)

### Document Endpoints (`/api/documents`)
- `POST /upload` - Upload document (Admin only)
- `GET /:id` - Get document details
- `GET /:id/download` - Download document
- `POST /:id/summarize` - Generate AI summary (Admin only)
- `GET /course/:courseId` - Get course documents
- `PUT /:id` - Update document (Admin only)
- `DELETE /:id` - Delete document (Admin only)
- `GET /search` - Search documents
- `GET /stats` - Document statistics (Admin only)

### AI Service Endpoints (`/api/ai`)
- `GET /status` - Get AI service status (Admin only)
- `POST /summarize-batch` - Batch summarize documents (Admin only)

### Enrollment Endpoints (`/api/enrollments`)
- `POST /` - Enroll in course
- `GET /:userId` - Get user enrollments
- `PUT /:userId/update` - Update progress
- `GET /:userId/:courseId` - Get enrollment details
- `PUT /:userId/:courseId/cancel` - Cancel enrollment
- `PUT /:userId/:courseId/rate` - Rate course
- `GET /stats` - Enrollment statistics (Admin only)

### Application Endpoints (`/api/applications`)
- `POST /` - Submit application (Public)
- `GET /` - Get all applications (Admin only)
- `GET /:id` - Get single application (Admin only)
- `PUT /:id/status` - Update status (Admin only)
- `PUT /:id/follow-up` - Set follow-up (Admin only)
- `GET /follow-up/pending` - Pending follow-ups (Admin only)
- `GET /stats` - Application statistics (Admin only)
- `DELETE /:id` - Delete application (Admin only)
- `PUT /bulk-update` - Bulk update applications (Admin only)

## 🔐 Authentication & Authorization

### Roles
- **Admin**: Full access to all endpoints, course management, user management
- **Learner**: Access to courses, enrollment, progress tracking, own data only

### JWT Tokens
- **Access Token**: Short-lived (7 days default), used for API authentication
- **Refresh Token**: Long-lived (30 days default), used to refresh access tokens

### Protected Routes
- Most endpoints require authentication
- Admin-only endpoints are clearly marked
- Users can only access their own data unless they're admins

## 📄 Database Schemas

### User Schema
- Name, email, password (hashed), role (admin/learner)
- Profile information, last login tracking
- Supports soft-delete with `isActive` field

### Course Schema
- Title, description, thumbnail, category, difficulty, price
- Nested modules with items (videos/documents)
- Rating system, enrollment tracking
- Publishing status control

### Enrollment Schema
- Links users to courses with progress tracking
- Individual item completion tracking
- Completion percentage calculation
- Rating and review system

### Document Schema
- File metadata, extracted text for AI processing
- AI summary storage with provider tracking
- Download tracking, tag system
- Soft-delete support

### Application Schema
- Marketing lead capture with contact information
- Status tracking (pending, contacted, enrolled, etc.)
- Follow-up scheduling, priority management
- UTM tracking for marketing attribution

## 🤖 AI Integration

### Supported Providers
- **OpenAI GPT-3.5-turbo**: High-quality summaries
- **Google Gemini Pro**: Alternative AI provider

### Document Processing
1. **File Upload**: PDF, DOC, DOCX, TXT files accepted
2. **Text Extraction**: Automatic text extraction using specialized libraries
3. **AI Summarization**: Configurable AI provider for generating summaries
4. **Batch Processing**: Support for bulk document summarization

### Usage
```bash
# Individual document summarization
POST /api/documents/:id/summarize
{
  "provider": "gemini",
  "force": false
}

# Batch summarization
POST /api/ai/summarize-batch
{
  "documentIds": ["id1", "id2", "id3"],
  "provider": "openai",
  "force": false
}
```

## 📊 File Upload System

### Supported Formats
- **PDF**: `application/pdf`
- **Word Documents**: `.doc`, `.docx`
- **Text Files**: `.txt`
- **PowerPoint**: `.ppt`, `.pptx`

### Features
- **Automatic file organization** by date (YYYY/MM structure)
- **Unique filename generation** to prevent conflicts
- **File size validation** (10MB default limit)
- **MIME type validation** for security
- **Text extraction** for AI processing

### Upload Directory Structure
```
uploads/
├── 2024/
│   ├── 01/
│   │   ├── document-1234567890-abcdef.pdf
│   │   └── presentation-1234567891-ghijkl.pptx
│   └── 02/
│       └── textfile-1234567892-mnopqr.txt
└── 2025/
    └── 01/
        └── newdoc-1234567893-stuvwx.docx
```

## 🔧 Configuration

### Environment Variables
All configuration is handled through environment variables:

- **Server**: `PORT`, `NODE_ENV`
- **Database**: `MONGO_URI`
- **JWT**: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRE`
- **AI**: `OPENAI_API_KEY`, `GEMINI_API_KEY`
- **Upload**: `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`
- **Security**: `FRONTEND_URL`, `RATE_LIMIT_MAX_REQUESTS`

### Security Features
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: Bcrypt with salt rounds
- **JWT Security**: Separate access and refresh tokens

## 🚀 Production Deployment

### Production Checklist
- [ ] Update all environment variables with production values
- [ ] Set strong JWT secrets (use crypto.randomBytes(64).toString('hex'))
- [ ] Configure MongoDB Atlas with proper security
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx) if needed
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for uploads directory
- [ ] Set appropriate CORS origins
- [ ] Enable compression and caching headers

### PM2 Process Management
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "ai-lms-backend"

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## 📈 Performance Optimizations

- **Database Indexes**: Optimized queries with proper indexing
- **File Compression**: Gzip compression enabled
- **Static File Serving**: Efficient static file delivery
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Memory Management**: Proper memory usage tracking
- **Connection Pooling**: MongoDB connection pooling configured

## 🧪 Testing

### Manual Testing with curl

```bash
# Register a new user
p

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'

# Create a course (use token from login)
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Introduction to AI",
    "description": "Learn the basics of artificial intelligence",
    "category": "Technology",
    "difficulty": "beginner",
    "price": 0
  }'
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Ensure MongoDB Atlas IP whitelist includes your IP
   - Verify username/password in connection string

2. **File Upload Issues**
   - Check file size limits in environment variables
   - Ensure uploads directory has write permissions
   - Verify MIME type restrictions

3. **AI Summarization Failures**
   - Verify API keys are correctly set
   - Check API rate limits and quotas
   - Ensure document has extractable text

4. **JWT Token Errors**
   - Verify JWT secrets are properly set
   - Check token expiration settings
   - Ensure tokens are being sent in Authorization header

### Logs and Debugging
- Enable development logging with `NODE_ENV=development`
- Check server logs for detailed error messages
- Use `/api/health` endpoint to verify system status

## 🤝 Contributing

This is a complete production-ready system. For modifications:

1. Follow the existing code structure
2. Add proper validation for new endpoints
3. Include error handling in all controllers
4. Update documentation for any API changes
5. Test thoroughly before deployment

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review API documentation carefully
- Ensure all environment variables are properly configured

---

**✅ System Status: Production Ready**

This AI-LMS Backend provides a complete, scalable foundation for learning management systems with advanced AI integration capabilities.