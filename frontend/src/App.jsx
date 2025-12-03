import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import CoursesPage from './pages/CoursesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

// Component that uses useLocation hook
function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CoursePage />} />
          
          {/* Guest Only Routes */}
          <Route path="/login" element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          } />
          <Route path="/register" element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/my-courses" element={
            <ProtectedRoute>
              <div className="container py-5">
                <h2>My Enrolled Courses</h2>
                <p className="text-muted">Coming soon - View your enrolled courses and track progress.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="container py-5">
                <h2>My Profile</h2>
                <p className="text-muted">Coming soon - Manage your profile settings.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="container py-5">
                <h2>Account Settings</h2>
                <p className="text-muted">Coming soon - Update your account preferences.</p>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Admin Only Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <div className="container py-5 text-center">
              <h1 className="display-1">404</h1>
              <h2>Page Not Found</h2>
              <p className="text-muted">The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </div>
          } />
        </Routes>
      </main>
      
      {/* Only show footer on homepage */}
      {isHomePage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;