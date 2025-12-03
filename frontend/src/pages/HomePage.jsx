import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api';

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseAPI.getAllCourses();
      setCourses(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <Container>
          {/* MyCaptain Logo */}
          <Row className="justify-content-center mb-4">
            <Col xs="auto">
              <div className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div 
                    className="me-2"
                    style={{ 
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                      borderRadius: '8px',
                      transform: 'rotate(45deg)',
                      position: 'relative'
                    }}
                  >
                    <div 
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}
                    >
                      m
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold fs-4" style={{ color: '#333' }}>mycaptain</div>
                  </div>
                </div>
                <div className="text-muted small">BY IMARTICUS LEARNING</div>
              </div>
            </Col>
          </Row>

          {/* Main Content */}
          <Row className="justify-content-center text-center">
            <Col lg={10} xl={8}>
              <h1 className="display-5 display-md-4 fw-bold mb-4" style={{ color: '#5a6c7d' }}>
                Become a Digital Marketer in<br className="d-none d-md-block" />
                <span className="d-md-none"> </span>
                <span style={{ color: '#5a6c7d' }}>18 Weeks</span>
              </h1>
              
              <p className="lead mb-4 mb-md-5" style={{ color: '#6c757d' }}>
                MyCaptain Digital Marketing Program with Job Assurance
              </p>

              {/* Info Cards */}
              <div className="bg-white rounded p-3 p-md-4 mb-4 mb-md-5 shadow-sm">
                <Row className="g-0 text-center">
                  <Col xs={6} md={3} className="border-end border-light border-bottom border-md-bottom-0 d-md-block">
                    <div className="p-2 p-md-3">
                      <div className="text-muted small mb-1">Next Batch</div>
                      <div className="fw-bold small" style={{ color: '#333' }}>October</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3} className="border-end border-light border-md-end border-bottom border-md-bottom-0">
                    <div className="p-2 p-md-3">
                      <div className="text-muted small mb-1">Available Seats</div>
                      <div className="fw-bold small" style={{ color: '#333' }}>29/60</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3} className="border-end border-light border-md-end">
                    <div className="p-2 p-md-3">
                      <div className="text-muted small mb-1">Taught by experts from</div>
                      <div className="fw-bold small" style={{ color: '#333' }}>Rapido, Deloitte, MFine, Zomato</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="p-2 p-md-3">
                      <div className="text-muted small mb-1">Designed for</div>
                      <div className="fw-bold small" style={{ color: '#333' }}>Freshers & Early Working Professionals</div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Rating */}
              <div className="d-flex align-items-center justify-content-center mb-4">
                <div className="d-flex align-items-center me-4">
                  <span className="text-warning me-2">★</span>
                  <span className="fw-bold me-1">4.51</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-people me-2 text-muted"></i>
                  <span className="text-muted">1.2 Lacs+ Learners</span>
                </div>
              </div>

              {/* Action Buttons */}
                      <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                      <Button 
                        as={Link}
                        to="/courses"
                        size="lg"
                        className="px-4 px-md-5 py-3"
                        style={{ 
                        backgroundColor: '#ff6b35',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        color: 'white'
                        }}
                      >
                        Browse Courses
                      </Button>
                      <Button 
                        as="a"
                        href="/brochure.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="dark"
                        size="lg"
                        className="px-4 py-3"
                        style={{ 
                        backgroundColor: '#2c3e50',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600'
                        }}
                      >
                        Download Brochure
                      </Button>
                      </div>
                    </Col>
                    </Row>
                  </Container>
                  </section>

      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold mb-3">Why Choose Imarticus Learning?</h2>
              <p className="text-muted">Professional development that transforms careers</p>
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-people text-primary" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <Card.Title className="h6 h5-md">Expert Instructors</Card.Title>
                  <Card.Text className="text-muted small">
                    Learn from industry professionals with years of real-world experience
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-success bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-trophy text-success" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <Card.Title className="h6 h5-md">Job Assurance</Card.Title>
                  <Card.Text className="text-muted small">
                    Get guaranteed placement assistance and career support
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-info bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-laptop text-info" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <Card.Title className="h6 h5-md">Hands-on Learning</Card.Title>
                  <Card.Text className="text-muted small">
                    Practice with real projects and build portfolio-worthy work
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-warning bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-clock text-warning" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <Card.Title className="h6 h5-md">Flexible Schedule</Card.Title>
                  <Card.Text className="text-muted small">
                    Practice with real projects and build portfolio-worthy work
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-award text-primary" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <Card.Title className="h6 h5-md">Certification</Card.Title>
                  <Card.Text className="text-muted small">
                    Earn industry-recognized certificates upon course completion
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-secondary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-headset text-secondary" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <Card.Title className="h6 h5-md">24/7 Support</Card.Title>
                  <Card.Text className="text-muted small">
                    Get help whenever you need it with our dedicated support team
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>



      {/* Call to Action */}
      <section className="py-5 bg-success text-white">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <h2 className="fw-bold mb-3">Ready to Transform Your Career?</h2>
              <p className="lead mb-4">
                Join thousands of professionals who have advanced their careers with Imarticus Learning
              </p>
              <div className="d-grid d-md-flex gap-3 justify-content-center">
                <Button 
                  as={Link} 
                  to="/courses" 
                  variant="light" 
                  size="lg"
                  className="px-4"
                >
                  Browse Courses
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  className="px-4"
                >
                  Contact Us
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default HomePage;