import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { courseAPI, enrollmentAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import ModuleAccordion from '../components/ModuleAccordion';
import { LoadingSpinner, ErrorMessage, PageHeader } from '../components/CommonComponents';
import AdminCourseView from '../components/AdminCourseView';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Early return if no course ID
  if (!id) {
    return (
      <Container className="py-5">
        <ErrorMessage message="Course ID is required" />
      </Container>
    );
  }

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    } else {
      setError('Course ID is required');
      setLoading(false);
    }
  }, [id]); // Removed user dependency to prevent multiple calls

  // Separate effect to handle enrollment when user loads
  useEffect(() => {
    if (course && isAuthenticated && user && user.id && !enrollment) {
      fetchEnrollmentData();
    }
  }, [user, course]); // Check enrollment when user or course data changes

  const fetchEnrollmentData = async () => {
    if (!user || !user.id || !id) {
      console.log('Missing data for enrollment check:', { user: !!user, userId: user?.id, courseId: id });
      return;
    }

    try {
      console.log('Fetching enrollment for user:', user.id, 'course:', id);
      const enrollmentResponse = await enrollmentAPI.getEnrollmentDetails(user.id, id);
      console.log('Enrollment response:', enrollmentResponse.data);
      setEnrollment(enrollmentResponse.data.data.enrollment || enrollmentResponse.data.data);
    } catch (enrollmentError) {
      console.log('Enrollment fetch error:', enrollmentError.response?.status, enrollmentError.response?.data);
      if (enrollmentError.response?.status !== 404) {
        console.error('Error fetching enrollment:', enrollmentError);
      } else {
        // 404 means not enrolled, which is fine
        setEnrollment(null);
      }
    }
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate course ID
      if (!id) {
        setError('Course ID is required');
        return;
      }

      // Fetch course details
      const courseResponse = await courseAPI.getCourse(id);
      console.log('Course response:', courseResponse.data);
      setCourse(courseResponse.data.data.course);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!id) {
      alert('Course ID is missing. Please try again.');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with current course page as return URL
      navigate('/login', { 
        state: { 
          from: `/courses/${id}`,
          message: 'Please login or register to enroll in this course'
        } 
      });
      return;
    }

    if (!user || !user.id) {
      console.warn('User information not available:', user);
      alert('User information not available. Please refresh the page and try again.');
      return;
    }

    try {
      setEnrolling(true);
      console.log('Enrolling user', user.id, 'in course', id);
      
      const response = await enrollmentAPI.enrollInCourse(id);
      console.log('Enrollment response:', response.data);
      
      setShowEnrollModal(false);
      
      // Fetch updated enrollment data
      await fetchEnrollmentData();
      
      // Show success message
      alert('Successfully enrolled in the course!');
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to enroll in course';
      alert(`Enrollment failed: ${errorMessage}`);
      
      // If it's an authentication error, redirect to login
      if (err.response?.status === 401) {
        navigate('/login', { 
          state: { 
            from: `/courses/${id}`,
            message: 'Your session has expired. Please login again to enroll.'
          } 
        });
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleItemClick = async (item, moduleId, enrollmentId) => {
    if (!enrollment || !user || !user.id || !id) {
      return;
    }

    if (!item || !item._id) {
      console.error('Item is missing or has no ID:', item);
      return;
    }

    // Mark item as completed
    try {
      await enrollmentAPI.updateProgress(user.id, {
        courseId: id,
        itemId: item._id,
        isCompleted: true,
        timeSpent: 0 // You can track actual time spent
      });

      // Refresh enrollment data
      await fetchCourseData();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading course..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <ErrorMessage message={error} onRetry={fetchCourseData} />
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="py-5">
        <ErrorMessage message="Course not found" />
      </Container>
    );
  }

  // Show admin view for admin users
  if (isAdmin()) {
    console.log('Admin view - Course data:', course);
    console.log('Admin view - Course ID:', course?._id);
    return <AdminCourseView course={course} onCourseUpdate={fetchCourseData} />;
  }

  // Calculate progress
  const totalItems = course.modules?.reduce((total, module) => {
    return total + (module.items?.length || 0);
  }, 0) || 0;

  const completedItems = enrollment?.progress?.filter(p => p.isCompleted).map(p => p.itemId) || [];
  const progress = enrollment?.completionPercentage || 0;

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <PageHeader
            title={course.title}
            breadcrumb={[
              { text: 'Courses', link: '/courses' },
              { text: course.title }
            ]}
          />

          {/* Course Info */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {course.category && (
                  <Badge bg="primary">{course.category}</Badge>
                )}
                {course.difficulty && (
                  <Badge bg={
                    course.difficulty === 'beginner' ? 'success' :
                    course.difficulty === 'intermediate' ? 'warning' : 'danger'
                  }>
                    {course.difficulty}
                  </Badge>
                )}
                {course.isPublished ? (
                  <Badge bg="success">Published</Badge>
                ) : (
                  <Badge bg="warning">Draft</Badge>
                )}
              </div>

              <p className="text-muted mb-3">{course.description}</p>

              <Row className="g-3 mb-3">
                <Col sm={6} md={3}>
                  <div className="text-center">
                    <i className="bi bi-person text-muted"></i>
                    <div className="small text-muted">Instructor</div>
                    <div className="fw-medium">{course.instructor || 'Imarticus Learning'}</div>
                  </div>
                </Col>
                <Col sm={6} md={3}>
                  <div className="text-center">
                    <i className="bi bi-collection text-muted"></i>
                    <div className="small text-muted">Modules</div>
                    <div className="fw-medium">{course.modules?.length || 0}</div>
                  </div>
                </Col>
                <Col sm={6} md={3}>
                  <div className="text-center">
                    <i className="bi bi-play-circle text-muted"></i>
                    <div className="small text-muted">Lectures</div>
                    <div className="fw-medium">{totalItems}</div>
                  </div>
                </Col>
                <Col sm={6} md={3}>
                  <div className="text-center">
                    <i className="bi bi-clock text-muted"></i>
                    <div className="small text-muted">Duration</div>
                    <div className="fw-medium">{course.duration || 'Self-paced'}</div>
                  </div>
                </Col>
              </Row>

              {enrollment && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small">Your Progress</span>
                    <span className="small">{Math.round(progress)}%</span>
                  </div>
                  <div className="progress">
                    <div 
                      className="progress-bar bg-success"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Course Content */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Course Content</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ModuleAccordion
                modules={course.modules || []}
                courseId={course._id}
                onItemClick={enrollment ? handleItemClick : null}
                completedItems={completedItems}
                enrollmentId={enrollment?._id}
                isEnrolled={!!enrollment}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-fit">
            <Card.Body>
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="img-fluid rounded mb-3"
                />
              )}

              <div className="mb-3">
                {course.price && course.price > 0 ? (
                  <h3 className="text-success mb-0">₹{course.price.toLocaleString()}</h3>
                ) : (
                  <h3 className="text-success mb-0">Free</h3>
                )}
              </div>

              {enrollment ? (
                <div className="d-grid">
                  <Button variant="success" disabled>
                    <i className="bi bi-check-circle me-2"></i>
                    Enrolled
                  </Button>
                  {progress === 100 && (
                    <Button variant="outline-primary" className="mt-2">
                      <i className="bi bi-download me-2"></i>
                      Download Certificate
                    </Button>
                  )}
                </div>
              ) : (
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={isAuthenticated ? () => setShowEnrollModal(true) : handleEnroll}
                    disabled={!course.isPublished}
                  >
                    {!course.isPublished ? 'Coming Soon' : 
                     !isAuthenticated ? 'Login to Enroll' : 'Enroll Now'}
                  </Button>
                  {!isAuthenticated && course.isPublished && (
                    <small className="text-muted text-center mt-2">
                      You need to login or register first to enroll in this course
                    </small>
                  )}
                </div>
              )}

              <hr />

              <div className="small text-muted">
                <div className="d-flex justify-content-between py-2">
                  <span>Access</span>
                  <span>Lifetime</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span>Certificate</span>
                  <span>Included</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span>Language</span>
                  <span>English</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span>Support</span>
                  <span>24/7</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enrollment Confirmation Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Enrollment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to enroll in <strong>{course.title}</strong>?</p>
          {course.price && course.price > 0 && (
            <Alert variant="info">
              <strong>Price: ₹{course.price.toLocaleString()}</strong>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CoursePage;