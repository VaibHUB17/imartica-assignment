# Imarticus Learning - Frontend

A modern React frontend for the Imarticus Learning Management System built with React 18, Bootstrap 5, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend server running on http://localhost:5000

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to http://localhost:3000

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Main navigation header
│   ├── Footer.jsx      # Site footer
│   ├── CourseCard.jsx  # Course display card
│   ├── ModuleAccordion.jsx # Course content accordion
│   ├── CommonComponents.jsx # Shared UI components
│   ├── ProtectedRoute.jsx   # Route guards
│   └── AdminCourseView.jsx  # Admin course management
├── pages/              # Main application pages
│   ├── HomePage.jsx    # Landing page
│   ├── CoursePage.jsx  # Individual course view
│   ├── CoursesPage.jsx # Course listing
│   ├── LoginPage.jsx   # User authentication
│   ├── RegisterPage.jsx # User registration
│   └── AdminDashboard.jsx # Admin dashboard
├── api/                # API integration
│   └── index.js        # Axios configuration & endpoints
├── context/            # React Context providers
│   └── AuthContext.jsx # Authentication state management
├── hooks/              # Custom React hooks
│   └── useCustomHooks.js # Utility hooks
├── App.jsx            # Main app component
├── App.css            # Global styles
└── main.jsx          # App entry point
```

## 🎯 Features

### 🔐 Authentication
- **Login/Register:** Secure user authentication with JWT
- **Role-based Access:** Different views for students vs administrators  
- **Protected Routes:** Automatic redirects for unauthorized access
- **Profile Management:** User profile and settings (coming soon)

### 📚 Course Management
- **Course Browsing:** Grid view with search, filtering, and pagination
- **Course Details:** Comprehensive course information with enrollment
- **Module Structure:** Accordion-based content organization
- **Progress Tracking:** Visual progress indicators for enrolled students
- **Admin CRUD:** Full course, module, and lecture management for admins

### 🎨 UI/UX
- **Responsive Design:** Bootstrap 5 responsive grid system
- **Modern Components:** React Bootstrap component library
- **Loading States:** Skeleton screens and spinners
- **Error Handling:** Graceful error messages and retry options
- **Accessibility:** ARIA labels and keyboard navigation

### ⚡ Performance
- **React 18:** Latest React features and optimizations
- **Vite:** Fast development server and optimized builds
- **Code Splitting:** Lazy loading for better performance
- **API Optimization:** Efficient data fetching with axios

## 🔌 API Integration

The frontend integrates with the backend API using these endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get user profile

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Modules & Content
- `POST /api/courses/:courseId/modules` - Add module (Admin)
- `POST /api/courses/:courseId/modules/:moduleId/items` - Add lecture/document (Admin)

### Enrollments
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/:userId/update` - Update progress

## 🎛️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Proxy Configuration
The Vite config includes proxy settings for API calls:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build

### Code Style
- **ESLint:** Code linting and formatting
- **Prettier:** Consistent code formatting
- **Component Structure:** Functional components with hooks
- **State Management:** Context API for global state

### Key Dependencies
- **React 18** - UI framework
- **React Router DOM v6** - Client-side routing
- **Bootstrap 5** - CSS framework
- **React Bootstrap** - Bootstrap components for React
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and development server

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify:** Connect your GitHub repo for automatic deploys
- **Vercel:** Zero-config deployment for React apps
- **Apache/Nginx:** Serve the `dist` folder as static files

### Production Configuration
- Ensure `VITE_API_URL` points to your production API
- Configure proper CORS settings on the backend
- Set up HTTPS for secure authentication

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend server is running on port 5000
   - Verify CORS configuration
   - Check network/firewall settings

2. **Authentication Issues** 
   - Clear localStorage and cookies
   - Check JWT token expiration
   - Verify API endpoints

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Debug Mode
Enable detailed logging by setting:
```javascript
axios.defaults.headers.common['X-Debug'] = 'true';
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.