import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Tabs, Tab } from 'react-bootstrap';
import { courseAPI, authAPI, enrollmentAPI } from '../api';
import { LoadingSpinner, ErrorMessage, PageHeader } from '../components/CommonComponents';
import { useForm } from '../hooks/useCustomHooks';

const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const courseValidation = {
    title: { required: 'Title is required' },
    description: { required: 'Description is required' },
    category: { required: 'Category is required' },
    difficulty: { required: 'Difficulty is required' }
  };

  const courseForm = useForm({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    instructor: '',
    duration: '',
    price: 0,
    isPublished: false
  }, courseValidation);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesRes, usersRes] = await Promise.all([
        courseAPI.getAllCourses(),
        authAPI.getAllUsers()
      ]);

      setCourses(coursesRes.data.data.courses || []);
      setUsers(usersRes.data.data || []);

      // Calculate stats
      const totalCourses = coursesRes.data.data.courses?.length || 0;
      const publishedCourses = coursesRes.data.data.courses?.filter(course => course.isPublished).length || 0;
      const totalUsers = usersRes.data.data?.length || 0;
      const totalStudents = usersRes.data.data?.filter(user => user.role === 'learner').length || 0;

      setStats({
        totalCourses,
        publishedCourses,
        totalUsers,
        totalStudents
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (formData) => {
    try {
      setLoading(true);
      await courseAPI.createCourse(formData);
      setShowCreateModal(false);
      courseForm.reset();
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      setLoading(true);
      await courseAPI.deleteCourse(courseId);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    try {
      setLoading(true);
      await courseAPI.updateCourse(courseId, { isPublished: !currentStatus });
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && courses.length === 0) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <Container className="py-4">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage courses, users, and system settings"
        actions={[
          <Button
            key="create"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus me-2"></i>Create Course
          </Button>
        ]}
      />

      {error && (
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      )}

      <Tabs 
        activeKey={activeTab} 
        onSelect={setActiveTab}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          {/* Stats Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-collection text-primary" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h3 className="fw-bold">{stats.totalCourses}</h3>
                  <p className="text-muted mb-0">Total Courses</p>
                  <small className="text-success">
                    {stats.publishedCourses} published
                  </small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-people text-success" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h3 className="fw-bold">{stats.totalUsers}</h3>
                  <p className="text-muted mb-0">Total Users</p>
                  <small className="text-info">
                    {stats.totalStudents} students
                  </small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-graph-up text-warning" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h3 className="fw-bold">0</h3>
                  <p className="text-muted mb-0">Total Enrollments</p>
                  <small className="text-muted">This month</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <div className="bg-info bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-currency-rupee text-info" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h3 className="fw-bold">₹0</h3>
                  <p className="text-muted mb-0">Revenue</p>
                  <small className="text-muted">This month</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Recent Courses</h5>
            </Card.Header>
            <Card.Body>
              {courses.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 5).map(course => (
                      <tr key={course._id}>
                        <td>
                          <div>
                            <div className="fw-medium">{course.title}</div>
                            <small className="text-muted">
                              {course.modules?.length || 0} modules
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark">{course.category || 'Uncategorized'}</Badge>
                        </td>
                        <td>
                          <Badge bg={course.isPublished ? 'success' : 'warning'}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(course.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            href={`/courses/${course._id}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-collection fs-2 d-block mb-3"></i>
                  <p>No courses created yet</p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    Create Your First Course
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="courses" title="All Courses">
          <Card className="border-0 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Manage Courses</h5>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <i className="bi bi-plus me-2"></i>New Course
              </Button>
            </Card.Header>
            <Card.Body>
              {courses.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Course Details</th>
                      <th>Category</th>
                      <th>Difficulty</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course._id}>
                        <td>
                          <div>
                            <div className="fw-medium">{course.title}</div>
                            <small className="text-muted">
                              {course.modules?.length || 0} modules • {course.instructor || 'No instructor'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark">{course.category || 'Uncategorized'}</Badge>
                        </td>
                        <td>
                          <Badge bg={
                            course.difficulty === 'beginner' ? 'success' :
                            course.difficulty === 'intermediate' ? 'warning' : 'danger'
                          }>
                            {course.difficulty || 'Not set'}
                          </Badge>
                        </td>
                        <td>
                          {course.price ? `₹${course.price}` : 'Free'}
                        </td>
                        <td>
                          <Badge bg={course.isPublished ? 'success' : 'warning'}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              href={`/courses/${course._id}`}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button 
                              variant={course.isPublished ? 'outline-warning' : 'outline-success'}
                              size="sm"
                              onClick={() => handleTogglePublish(course._id, course.isPublished)}
                            >
                              <i className={`bi bi-${course.isPublished ? 'eye-slash' : 'eye'}`}></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteCourse(course._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-collection fs-1 d-block mb-3"></i>
                  <h4>No courses yet</h4>
                  <p>Start by creating your first course</p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    Create Course
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="users" title="Users">
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">User Management</h5>
            </Card.Header>
            <Card.Body>
              {users.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div>
                            <div className="fw-medium">{user.name}</div>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="success">Active</Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-people fs-1 d-block mb-3"></i>
                  <h4>No users found</h4>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Create Course Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Course</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); courseForm.handleSubmit(handleCreateCourse); }}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Title</Form.Label>
                  <Form.Control
                    name="title"
                    value={courseForm.values.title}
                    onChange={courseForm.handleChange}
                    onBlur={courseForm.handleBlur}
                    isInvalid={courseForm.touched.title && !!courseForm.errors.title}
                    placeholder="Enter course title"
                  />
                  <Form.Control.Feedback type="invalid">
                    {courseForm.errors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    name="category"
                    value={courseForm.values.category}
                    onChange={courseForm.handleChange}
                    onBlur={courseForm.handleBlur}
                    isInvalid={courseForm.touched.category && !!courseForm.errors.category}
                    placeholder="e.g., Digital Marketing"
                  />
                  <Form.Control.Feedback type="invalid">
                    {courseForm.errors.category}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={courseForm.values.description}
                onChange={courseForm.handleChange}
                onBlur={courseForm.handleBlur}
                isInvalid={courseForm.touched.description && !!courseForm.errors.description}
                placeholder="Describe what students will learn"
              />
              <Form.Control.Feedback type="invalid">
                {courseForm.errors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty Level</Form.Label>
                  <Form.Select
                    name="difficulty"
                    value={courseForm.values.difficulty}
                    onChange={courseForm.handleChange}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={courseForm.values.price}
                    onChange={courseForm.handleChange}
                    placeholder="0 for free"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    name="duration"
                    value={courseForm.values.duration}
                    onChange={courseForm.handleChange}
                    placeholder="e.g., 8 weeks"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Instructor Name</Form.Label>
              <Form.Control
                name="instructor"
                value={courseForm.values.instructor}
                onChange={courseForm.handleChange}
                placeholder="Enter instructor name"
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Publish immediately"
              name="isPublished"
              checked={courseForm.values.isPublished}
              onChange={courseForm.handleChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={courseForm.isSubmitting}>
              {courseForm.isSubmitting ? 'Creating...' : 'Create Course'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;