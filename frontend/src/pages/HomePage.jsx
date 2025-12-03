import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api';
import CourseCard from '../components/CourseCard';
import { LoadingSpinner, ErrorMessage, SearchBox } from '../components/CommonComponents';

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
      <section className="bg-light py-5">
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6}>
              <h1 className="display-4 fw-bold text-dark mb-4">
                Become a Digital Marketer in <span className="text-success">18 Weeks</span>
              </h1>
              <p className="lead text-muted mb-4">
                MyCaptain Digital Marketing Program with Job Assurance
              </p>
              <p className="mb-4">
                Taught by experts from <strong>Rapido, Deloitte, MFine, Zomato</strong>
              </p>
              
              <div className="mb-4">
                <Row className="g-3">
                  <Col sm={6}>
                    <Card className="border-0 bg-white shadow-sm">
                      <Card.Body className="text-center py-3">
                        <h6 className="text-muted small mb-1">Next Batch</h6>
                        <div className="fw-bold">October</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={6}>
                    <Card className="border-0 bg-white shadow-sm">
                      <Card.Body className="text-center py-3">
                        <h6 className="text-muted small mb-1">Available Seats</h6>
                        <div className="fw-bold">29/60</div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <Badge bg="warning" className="me-2">★ 4.51</Badge>
                  <span className="text-muted small">1.2 Lac+ Learners</span>
                </div>
                <div className="text-muted small">
                  Designed for <strong>Freshers & Early Working Professionals</strong>
                </div>
              </div>

              <div className="d-grid d-md-flex gap-3">
                <Button 
                  as={Link} 
                  to="/courses" 
                  variant="success" 
                  size="lg"
                  className="px-4"
                >
                  Explore Course
                </Button>
                <Button 
                  variant="outline-dark" 
                  size="lg"
                  className="px-4"
                >
                  Download Brochure
                </Button>
              </div>
            </Col>
            
            <Col lg={6} className="text-center">
              <div className="position-relative">
                <div 
                  className="bg-success rounded-circle mx-auto mb-4"
                  style={{ width: '300px', height: '300px' }}
                >
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <i className="bi bi-mortarboard text-white" style={{ fontSize: '6rem' }}></i>
                  </div>
                </div>
                <div className="position-absolute top-0 end-0">
                  <Badge bg="warning" className="px-3 py-2">
                    <i className="bi bi-trophy me-2"></i>
                    12 Years
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold mb-3">Why Choose Imarticus Learning?</h2>
              <p className="text-muted">Professional development that transforms careers</p>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={4}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-people text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <Card.Title className="h5">Expert Instructors</Card.Title>
                  <Card.Text className="text-muted">
                    Learn from industry professionals with years of real-world experience
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-success bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-trophy text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <Card.Title className="h5">Job Assurance</Card.Title>
                  <Card.Text className="text-muted">
                    Get guaranteed placement assistance and career support
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-info bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-laptop text-info" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <Card.Title className="h5">Hands-on Learning</Card.Title>
                  <Card.Text className="text-muted">
                    Practice with real projects and build portfolio-worthy work
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-warning bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-clock text-warning" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <Card.Title className="h5">Flexible Schedule</Card.Title>
                  <Card.Text className="text-muted">
                    Learn at your own pace with recorded lectures and live sessions
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-danger bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-certificate text-danger" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <Card.Title className="h5">Certification</Card.Title>
                  <Card.Text className="text-muted">
                    Earn industry-recognized certificates upon course completion
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border-0 h-100 text-center">
                <Card.Body className="py-4">
                  <div className="bg-secondary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-headset text-secondary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <Card.Title className="h5">24/7 Support</Card.Title>
                  <Card.Text className="text-muted">
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