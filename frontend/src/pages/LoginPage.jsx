import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useCustomHooks';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, loading } = useAuth();
  const [loginError, setLoginError] = useState('');

  const validationRules = {
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address'
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters'
      }
    }
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm({ email: '', password: '' }, validationRules);

  const onSubmit = async (formData) => {
    setLoginError('');
    
    const result = await login(formData);
    
    if (result.success) {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } else {
      setLoginError(result.error);
    }
  };

  return (
    <Container className="py-3 py-md-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="border-0 shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Welcome Back</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              {location.state?.message && (
                <Alert variant="info" className="mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  {location.state.message}
                </Alert>
              )}

              {(loginError || authError) && (
                <Alert variant="danger" className="mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {loginError || authError}
                </Alert>
              )}

              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit);
              }}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.email && !!errors.email}
                    placeholder="Enter your email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && !!errors.password}
                    placeholder="Enter your password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid mb-3">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </span>
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </div>
              </Form>

              <div className="text-center">
                <p className="text-muted mb-3">
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot your password?
                  </Link>
                </p>
                <p className="text-muted">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    state={location.state} 
                    className="text-decoration-none fw-medium"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Demo Credentials */}
          <Card className="border-0 bg-light mt-4">
            <Card.Body className="text-center p-3">
              <h6 className="mb-3">Demo Credentials</h6>
              <div className="row text-start g-3">
                <div className="col-12 col-sm-6">
                  <strong className="d-block mb-1">Student Account:</strong>
                  <div className="small text-muted">student@demo.com</div>
                  <div className="small text-muted">password123</div>
                </div>
                <div className="col-12 col-sm-6">
                  <strong className="d-block mb-1">Admin Account:</strong>
                  <div className="small text-muted">admin@demo.com</div>
                  <div className="small text-muted">admin123</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;