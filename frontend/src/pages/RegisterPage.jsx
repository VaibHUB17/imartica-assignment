import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useCustomHooks';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, error: authError, loading } = useAuth();
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  const validationRules = {
    name: {
      required: 'Full name is required',
      minLength: {
        value: 2,
        message: 'Name must be at least 2 characters'
      }
    },
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address'
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters'
      },
      custom: (value) => {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
        }
        return '';
      }
    },
    confirmPassword: {
      required: 'Please confirm your password',
      custom: (value) => {
        if (value !== values.password) {
          return 'Passwords do not match';
        }
        return '';
      }
    },
    role: {
      required: 'Please select a role'
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
  } = useForm({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'learner'
  }, validationRules);

  const onSubmit = async (formData) => {
    setRegisterError('');
    setRegisterSuccess('');
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...submitData } = formData;
    
    const result = await register(submitData);
    
    if (result.success) {
      setRegisterSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        const from = location.state?.from || '/';
        navigate(from, { replace: true });
      }, 2000);
    } else {
      setRegisterError(result.error);
    }
  };

  return (
    <Container className="py-3 py-md-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="border-0 shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Create Account</h2>
                <p className="text-muted">Join Imarticus Learning today</p>
              </div>

              {location.state?.message && (
                <Alert variant="info" className="mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  {location.state.message}
                </Alert>
              )}

              {registerSuccess && (
                <Alert variant="success" className="mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  {registerSuccess}
                </Alert>
              )}

              {(registerError || authError) && (
                <Alert variant="danger" className="mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {registerError || authError}
                </Alert>
              )}

              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit);
              }}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.name && !!errors.name}
                    placeholder="Enter your full name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

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

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && !!errors.password}
                    placeholder="Create a password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Password must contain uppercase, lowercase, and number.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                    placeholder="Confirm your password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>I am a...</Form.Label>
                  <Form.Select
                    name="role"
                    value={values.role}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.role && !!errors.role}
                  >
                    <option value="learner">Student/Learner</option>
                    <option value="admin">Administrator</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.role}
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
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </Form>

              <div className="text-center">
                <p className="text-muted">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    state={location.state} 
                    className="text-decoration-none fw-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;