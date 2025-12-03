import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm border-bottom" style={{ backgroundColor: '#2c6e4f' }}>
      <Container>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-circle me-2 d-flex align-items-center justify-content-center"
              style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#2c6e4f',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              I
            </div>
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>IMARTICUS</div>
              <div className="text-muted small">LEARNING</div>
            </div>
            <div className="ms-2 bg-warning text-dark px-2 py-1 rounded small fw-bold">
              12 YEARS
            </div>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="text-dark fw-medium">
              Overview
            </Nav.Link>
            <Nav.Link as={Link} to="/courses" className="text-dark fw-medium">
              Courses
            </Nav.Link>
            
            {isAuthenticated ? (
              <>
                {isAdmin() && (
                  <Nav.Link as={Link} to="/admin" className="text-dark fw-medium">
                    Admin
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to="/my-courses" className="text-dark fw-medium">
                  My Courses
                </Nav.Link>
                <NavDropdown title={user?.name || 'User'} id="user-dropdown" className="text-dark">
                  <NavDropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <NavDropdown 
                title={<><i className="bi bi-person-circle me-1"></i>User</>} 
                id="guest-dropdown" 
                className="text-dark"
              >
                <NavDropdown.Item as={Link} to="/login">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/register">
                  <i className="bi bi-person-plus me-2"></i>
                  Register
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;