# 🎓 Imarticus Learning Management System

A complete, production-ready Learning Management System built with React frontend and Node.js backend, designed to match the modern interface and functionality shown in the provided images.

## 📸 Preview

The system recreates the sleek interface from the images with:
- Modern course browsing with grid layout
- Professional landing page with hero section
- Responsive course cards with progress tracking
- Clean navigation and user-friendly design

## 🏗️ Architecture

```
imartica-assignment/
├── frontend/          # React 18 + Bootstrap 5 frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── api/           # Backend API integration
│   │   ├── context/       # React Context providers
│   │   └── hooks/         # Custom React hooks
│   ├── package.json
│   └── README.md
└── server/            # Node.js + Express backend
    ├── controllers/       # API route handlers
    ├── models/           # MongoDB data models
    ├── routes/           # API route definitions
    ├── middlewares/      # Authentication & validation
    └── config/           # Database configuration
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 18+** 
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone & Setup

```bash
# Clone the repository
git clone <repository-url>
cd imartica-assignment

# Install backend dependencies
cd server
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Environment Configuration

**Backend** (`server/.env`):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/imarticus_lms
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend  
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Access the Application

🌐 **Frontend:** http://localhost:3000
🔧 **API:** http://localhost:5000/api

## 🎯 Features Implemented

### 🔐 Authentication System
- **Secure Registration/Login** with JWT tokens
- **Role-based Access Control** (Student/Admin)
- **Protected Routes** with automatic redirects
- **Session Management** with token refresh

### 🏠 Landing Page (Matches Image Design)
- **Hero Section** with call-to-action matching the design
- **Feature Cards** highlighting key benefits
- **Top Courses Section** with responsive grid
- **Professional Footer** with links and branding

### 📚 Course Management
- **Course Browsing** with search, filters, and pagination
- **Detailed Course View** with module accordion
- **Progress Tracking** for enrolled students
- **Admin CRUD Operations** for courses, modules, and lectures

### 👨‍💼 Admin Dashboard
- **Course Management** with full CRUD operations
- **User Management** with role-based access
- **Content Creation** - add modules and lectures
- **Statistics Overview** with key metrics

### 📱 Responsive Design
- **Bootstrap 5** responsive grid system
- **Mobile-optimized** navigation and layouts
- **Touch-friendly** interactions for tablets
- **Modern UI/UX** following current design trends

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/me          # Get user profile
```

### Courses
```
GET    /api/courses                           # List all courses
GET    /api/courses/:id                       # Get course details
POST   /api/courses                           # Create course (Admin)
PUT    /api/courses/:id                       # Update course (Admin)
DELETE /api/courses/:id                       # Delete course (Admin)
```

### Modules & Content
```
POST   /api/courses/:courseId/modules                    # Add module (Admin)
PUT    /api/courses/:courseId/modules/:moduleId          # Update module (Admin)
DELETE /api/courses/:courseId/modules/:moduleId          # Delete module (Admin)
POST   /api/courses/:courseId/modules/:moduleId/items    # Add lecture/document (Admin)
PUT    /api/courses/:courseId/modules/:moduleId/items/:itemId    # Update item (Admin)
DELETE /api/courses/:courseId/modules/:moduleId/items/:itemId    # Delete item (Admin)
```

### Enrollments
```
POST  /api/enrollments                        # Enroll in course
GET   /api/enrollments/:userId                # Get user enrollments
PUT   /api/enrollments/:userId/update         # Update progress
```

## 💾 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'learner',
  createdAt: Date,
  updatedAt: Date
}
```

### Courses Collection  
```javascript
{
  title: String,
  description: String,
  category: String,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  instructor: String,
  duration: String,
  price: Number,
  thumbnail: String,
  isPublished: Boolean,
  modules: [ModuleSchema],
  createdAt: Date,
  updatedAt: Date
}
```

### Module Schema (Embedded)
```javascript
{
  title: String,
  description: String,
  order: Number,
  items: [ItemSchema]
}
```

### Item Schema (Embedded)
```javascript
{
  type: 'video' | 'document',
  title: String,
  url: String,
  description: String,
  duration: Number,
  order: Number
}
```

### Enrollments Collection
```javascript
{
  userId: ObjectId,
  courseId: ObjectId, 
  enrolledAt: Date,
  completedItems: [ObjectId],
  progress: Number,
  lastAccessed: Date
}
```

## 🎨 UI Components

### Reusable Components
- **CourseCard** - Displays course information with enrollment options
- **ModuleAccordion** - Expandable course content with progress tracking
- **Header** - Navigation with user authentication and role-based menus
- **Footer** - Professional footer with links and branding
- **ProtectedRoute** - Route guards for authentication and authorization

### Pages
- **HomePage** - Landing page matching the provided design
- **CoursesPage** - Course browsing with filters and search
- **CoursePage** - Detailed course view with enrollment functionality
- **LoginPage/RegisterPage** - Clean authentication forms
- **AdminDashboard** - Comprehensive admin interface

## 🛠️ Development

### Tech Stack

**Frontend:**
- React 18 with functional components and hooks
- React Router DOM v6 for routing
- Bootstrap 5 + React Bootstrap for UI
- Axios for API communication
- Vite for fast development and building

**Backend:** 
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- Express validation for input validation

### Code Structure
- **Modular Components** with single responsibility
- **Context API** for global state management
- **Custom Hooks** for reusable logic
- **Error Boundaries** for graceful error handling
- **Responsive Design** with Bootstrap breakpoints

## 🔧 Configuration

### Development Environment
1. **MongoDB** - Local installation or MongoDB Atlas
2. **Node.js 18+** - For backend and frontend development
3. **VS Code** - Recommended with React and ES6 extensions

### Production Deployment
- **Frontend** - Deploy to Netlify, Vercel, or static hosting
- **Backend** - Deploy to Heroku, Railway, or VPS
- **Database** - MongoDB Atlas for cloud hosting
- **Environment Variables** - Configure for production URLs

## 🚀 Demo Accounts

For testing purposes, you can create accounts or use these demo credentials:

**Student Account:**
- Email: student@demo.com  
- Password: password123

**Admin Account:**
- Email: admin@demo.com
- Password: admin123

## 📋 Features Checklist

✅ **Landing Page** - Modern design matching provided images
✅ **Course Browsing** - Grid layout with search and filters  
✅ **Course Details** - Comprehensive course information
✅ **User Authentication** - Secure login/registration
✅ **Role-based Access** - Student vs Admin functionality
✅ **Course Enrollment** - Student course enrollment system
✅ **Progress Tracking** - Visual progress indicators
✅ **Admin Dashboard** - Complete course management
✅ **CRUD Operations** - Full course, module, and lecture management
✅ **Responsive Design** - Works on all device sizes
✅ **Error Handling** - Graceful error messages and recovery
✅ **Loading States** - Professional loading indicators
✅ **API Integration** - Complete backend integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support, please open an issue on the GitHub repository.

---

**Built with ❤️ for Imarticus Learning**