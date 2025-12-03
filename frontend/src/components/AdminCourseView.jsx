import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Badge, Alert } from 'react-bootstrap';
import { courseAPI, documentAPI } from '../api';
import { LoadingSpinner, ErrorMessage, ConfirmationModal } from '../components/CommonComponents';
import { useForm } from '../hooks/useCustomHooks';

const AdminCourseView = ({ course, onCourseUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Course form
  const courseValidation = {
    title: { required: 'Title is required' },
    description: { required: 'Description is required' },
    category: { required: 'Category is required' },
    difficulty: { required: 'Difficulty is required' }
  };

  const courseForm = useForm({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || '',
    difficulty: course?.difficulty || 'beginner',
    instructor: course?.instructor || '',
    duration: course?.duration || '',
    price: course?.price || 0,
    isPublished: course?.isPublished || false
  }, courseValidation);

  // Module form
  const moduleValidation = {
    title: { required: 'Module title is required' }
  };

  const moduleForm = useForm({
    title: '',
    description: '',
    order: 1
  }, moduleValidation);

  // Item form  
  const itemValidation = {
    title: { required: 'Item title is required' },
    type: { required: 'Item type is required' },
    url: { required: 'URL is required' }
  };

  const itemForm = useForm({
    title: '',
    type: 'video',
    url: '',
    description: '',
    duration: 0,
    order: 1
  }, itemValidation);

  // Document form
  const documentValidation = {
    title: { required: 'Document title is required' },
    moduleId: { required: 'Module is required' }
  };

  const documentForm = useForm({
    title: '',
    moduleId: '',
    tags: ''
  }, documentValidation);

  const handleUpdateCourse = async (formData) => {
    try {
      setLoading(true);
      
      // Validate course ID exists
      if (!course || !course._id) {
        setError('Course ID is missing. Cannot update course.');
        setLoading(false);
        return;
      }
      
      console.log('Updating course with ID:', course._id, 'Data:', formData);
      await courseAPI.updateCourse(course._id, formData);
      setSuccess('Course updated successfully!');
      setShowEditModal(false);
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setLoading(true);
      
      // Validate course ID exists
      if (!course || !course._id) {
        setError('Course ID is missing. Cannot delete course.');
        setLoading(false);
        return;
      }
      
      await courseAPI.deleteCourse(course._id);
      setSuccess('Course deleted successfully!');
      // Redirect to admin dashboard or courses list
      window.location.href = '/admin';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (formData) => {
    try {
      setLoading(true);
      
      // Validate course ID exists
      if (!course || !course._id) {
        setError('Course ID is missing. Cannot add module.');
        setLoading(false);
        return;
      }
      
      await courseAPI.addModule(course._id, formData);
      setSuccess('Module added successfully!');
      setShowModuleModal(false);
      moduleForm.reset();
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add module');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModule = async (formData) => {
    try {
      setLoading(true);
      await courseAPI.updateModule(course._id, editingModule._id, formData);
      setSuccess('Module updated successfully!');
      setShowModuleModal(false);
      setEditingModule(null);
      moduleForm.reset();
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update module');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      setLoading(true);
      await courseAPI.deleteModule(course._id, moduleId);
      setSuccess('Module deleted successfully!');
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete module');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (formData) => {
    try {
      setLoading(true);
      await courseAPI.addItem(course._id, selectedModule._id, formData);
      setSuccess('Item added successfully!');
      setShowItemModal(false);
      setSelectedModule(null);
      itemForm.reset();
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (formData) => {
    try {
      setLoading(true);
      await courseAPI.updateItem(course._id, selectedModule._id, editingItem._id, formData);
      setSuccess('Item updated successfully!');
      setShowItemModal(false);
      setEditingItem(null);
      setSelectedModule(null);
      itemForm.reset();
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  // Document management functions
  const fetchDocuments = async () => {
    try {
      if (!course?._id) return;
      const response = await documentAPI.getDocumentsByCourse(course._id);
      setDocuments(response.data.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleUploadDocument = async (formData) => {
    try {
      if (!selectedFile) {
        setError('Please select a file to upload');
        return;
      }

      setLoading(true);
      
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('courseId', course._id);
      uploadData.append('moduleId', formData.moduleId);
      uploadData.append('title', formData.title);
      if (formData.tags) uploadData.append('tags', formData.tags);

      await documentAPI.uploadDocument(uploadData);
      setSuccess('Document uploaded successfully!');
      setShowDocumentModal(false);
      setSelectedFile(null);
      documentForm.reset();
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeDocument = async (documentId) => {
    try {
      setLoading(true);
      console.log('Attempting to summarize document:', documentId);
      
      if (!documentId) {
        setError('Document ID is required for summarization');
        return;
      }
      
      const response = await documentAPI.summarizeDocument(documentId, { provider: 'gemini' });
      console.log('Summarization response:', response);
      
      setSuccess('Document summarized successfully!');
      await fetchDocuments();
    } catch (err) {
      console.error('Summarization error:', err);

      setError(err.response?.data?.message || 'Token limit reached or failed to summarize document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      setLoading(true);
      await documentAPI.deleteDocument(documentId);
      setSuccess('Document deleted successfully!');
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const openAddDocument = (module) => {
    setSelectedModule(module);
    documentForm.reset({ moduleId: module._id });
    setSelectedFile(null);
    setShowDocumentModal(true);
  };

  const handleDeleteItem = async (moduleId, itemId) => {
    try {
      setLoading(true);
      await courseAPI.deleteItem(course._id, moduleId, itemId);
      setSuccess('Item deleted successfully!');
      if (onCourseUpdate) onCourseUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const openEditModule = (module) => {
    setEditingModule(module);
    moduleForm.reset({
      title: module.title,
      description: module.description || '',
      order: module.order || 1
    });
    setShowModuleModal(true);
  };

  const openAddItem = (module) => {
    setSelectedModule(module);
    setEditingItem(null);
    itemForm.reset();
    setShowItemModal(true);
  };

  const openEditItem = (module, item) => {
    setSelectedModule(module);
    setEditingItem(item);
    itemForm.reset({
      title: item.title,
      type: item.type,
      url: item.url,
      description: item.description || '',
      duration: item.duration || 0,
      order: item.order || 1
    });
    setShowItemModal(true);
  };

  // Load documents when course changes
  useEffect(() => {
    if (course?._id) {
      fetchDocuments();
    }
  }, [course]);

  if (loading) {
    return <LoadingSpinner text="Processing..." />;
  }

  // Debug: Check if course is properly passed
  if (!course) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>Course data is not available. Please go back and try again.</p>
          <Button variant="outline-danger" href="/admin">
            Back to Admin Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!course._id) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <Alert.Heading>Warning</Alert.Heading>
          <p>Course ID is missing. This course cannot be edited until the issue is resolved.</p>
          <p><strong>Course Title:</strong> {course.title || 'Unknown'}</p>
          <Button variant="outline-warning" href="/admin">
            Back to Admin Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Admin: {course.title}</h1>
          <p className="text-muted">Manage course content and settings</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => setShowEditModal(true)}>
            <i className="bi bi-pencil me-2"></i>Edit Course
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <i className="bi bi-trash me-2"></i>Delete Course
          </Button>
        </div>
      </div>

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Course Info */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Course Information</h5>
              <Badge bg={course.isPublished ? 'success' : 'warning'}>
                {course.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Category:</strong> {course.category || 'Not set'}</p>
                  <p><strong>Difficulty:</strong> {course.difficulty || 'Not set'}</p>
                  <p><strong>Instructor:</strong> {course.instructor || 'Not set'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Duration:</strong> {course.duration || 'Not set'}</p>
                  <p><strong>Price:</strong> {course.price ? `₹${course.price}` : 'Free'}</p>
                  <p><strong>Modules:</strong> {course.modules?.length || 0}</p>
                </Col>
              </Row>
              <p><strong>Description:</strong></p>
              <p className="text-muted">{course.description}</p>
            </Card.Body>
          </Card>

          {/* Modules */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Course Modules</h5>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => {
                  setEditingModule(null);
                  moduleForm.reset();
                  setShowModuleModal(true);
                }}
              >
                <i className="bi bi-plus me-1"></i>Add Module
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, index) => (
                  <div key={module._id} className="border-bottom">
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{module.title}</h6>
                          {module.description && (
                            <p className="text-muted small mb-2">{module.description}</p>
                          )}
                          <div className="text-muted small">
                            Items: {module.items?.length || 0}
                          </div>
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openAddItem(module)}
                          >
                            <i className="bi bi-plus"></i>
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => openAddDocument(module)}
                            title="Add Document"
                          >
                            <i className="bi bi-file-earmark-plus"></i>
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openEditModule(module)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteModule(module._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>

                      {/* Module Items */}
                      {module.items && module.items.length > 0 && (
                        <div className="mt-3">
                          <Table size="sm" className="mb-0">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Duration</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {module.items.map(item => (
                                <tr key={item._id}>
                                  <td>{item.title}</td>
                                  <td>
                                    <Badge bg={item.type === 'video' ? 'primary' : 'secondary'}>
                                      {item.type}
                                    </Badge>
                                  </td>
                                  <td>{item.duration ? `${item.duration}min` : 'N/A'}</td>
                                  <td>
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      className="me-1"
                                      onClick={() => openEditItem(module, item)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteItem(module._id, item._id)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-collection fs-2 d-block mb-2"></i>
                  <p className="mb-0">No modules added yet</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Documents */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Course Documents</h5>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => fetchDocuments()}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {documents && documents.length > 0 ? (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Summary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc._id}>
                        <td>{doc.title}</td>
                        <td>
                          <Badge bg="secondary">
                            {doc.fileType?.toUpperCase()}
                          </Badge>
                        </td>
                        <td>{(doc.fileSize / 1024).toFixed(1)} KB</td>
                        <td>
                          {doc.summaryGenerated ? (
                            <Badge bg="success" title={doc.aiSummary ? doc.aiSummary.substring(0, 100) + '...' : 'Summary available'}>
                              Generated
                            </Badge>
                          ) : (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleSummarizeDocument(doc._id)}
                              disabled={loading}
                              title={`Generate summary for: ${doc.title}`}
                            >
                              {loading ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                'Generate'
                              )}
                            </Button>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc._id)}
                            disabled={loading}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-file-earmark fs-2 d-block mb-2"></i>
                  <p className="mb-0">No documents uploaded yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '100px' }}>
            <Card.Header>
              <h6 className="mb-0">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant={course.isPublished ? 'outline-warning' : 'outline-success'}
                  onClick={() => handleUpdateCourse({ isPublished: !course.isPublished })}
                >
                  <i className={`bi bi-${course.isPublished ? 'eye-slash' : 'eye'} me-2`}></i>
                  {course.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button 
                  variant="outline-info"
                  onClick={() => {
                    setSelectedModule(null);
                    documentForm.reset();
                    setSelectedFile(null);
                    setShowDocumentModal(true);
                  }}
                >
                  <i className="bi bi-file-earmark-plus me-2"></i>Upload Document
                </Button>

              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Course</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); courseForm.handleSubmit(handleUpdateCourse); }}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    name="title"
                    value={courseForm.values.title}
                    onChange={courseForm.handleChange}
                    onBlur={courseForm.handleBlur}
                    isInvalid={courseForm.touched.title && !!courseForm.errors.title}
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
              />
              <Form.Control.Feedback type="invalid">
                {courseForm.errors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty</Form.Label>
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
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={courseForm.values.price}
                    onChange={courseForm.handleChange}
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
                    placeholder="e.g., 10 weeks"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Instructor</Form.Label>
              <Form.Control
                name="instructor"
                value={courseForm.values.instructor}
                onChange={courseForm.handleChange}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Published"
              name="isPublished"
              checked={courseForm.values.isPublished}
              onChange={courseForm.handleChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Course
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add/Edit Module Modal */}
      <Modal show={showModuleModal} onHide={() => setShowModuleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingModule ? 'Edit Module' : 'Add Module'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => {
          e.preventDefault();
          moduleForm.handleSubmit(editingModule ? handleUpdateModule : handleAddModule);
        }}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={moduleForm.values.title}
                onChange={moduleForm.handleChange}
                onBlur={moduleForm.handleBlur}
                isInvalid={moduleForm.touched.title && !!moduleForm.errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {moduleForm.errors.title}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={moduleForm.values.description}
                onChange={moduleForm.handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Order</Form.Label>
              <Form.Control
                type="number"
                name="order"
                value={moduleForm.values.order}
                onChange={moduleForm.handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModuleModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingModule ? 'Update Module' : 'Add Module'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal show={showItemModal} onHide={() => setShowItemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit Item' : 'Add Item'} 
            {selectedModule && ` to ${selectedModule.title}`}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => {
          e.preventDefault();
          itemForm.handleSubmit(editingItem ? handleUpdateItem : handleAddItem);
        }}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={itemForm.values.title}
                onChange={itemForm.handleChange}
                onBlur={itemForm.handleBlur}
                isInvalid={itemForm.touched.title && !!itemForm.errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {itemForm.errors.title}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={itemForm.values.type}
                    onChange={itemForm.handleChange}
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={itemForm.values.duration}
                    onChange={itemForm.handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                name="url"
                value={itemForm.values.url}
                onChange={itemForm.handleChange}
                onBlur={itemForm.handleBlur}
                isInvalid={itemForm.touched.url && !!itemForm.errors.url}
                placeholder="https://..."
              />
              <Form.Control.Feedback type="invalid">
                {itemForm.errors.url}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={itemForm.values.description}
                onChange={itemForm.handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Order</Form.Label>
              <Form.Control
                type="number"
                name="order"
                value={itemForm.values.order}
                onChange={itemForm.handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal show={showDocumentModal} onHide={() => setShowDocumentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Upload Document
            {selectedModule && ` to ${selectedModule.title}`}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => {
          e.preventDefault();
          documentForm.handleSubmit(handleUploadDocument);
        }}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select File</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
              />
              <Form.Text className="text-muted">
                Supported formats: PDF, DOC, DOCX, TXT, PPT, PPTX
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={documentForm.values.title}
                onChange={documentForm.handleChange}
                onBlur={documentForm.handleBlur}
                isInvalid={documentForm.touched.title && !!documentForm.errors.title}
                placeholder="Document title"
              />
              <Form.Control.Feedback type="invalid">
                {documentForm.errors.title}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Module</Form.Label>
              <Form.Select
                name="moduleId"
                value={documentForm.values.moduleId}
                onChange={documentForm.handleChange}
                onBlur={documentForm.handleBlur}
                isInvalid={documentForm.touched.moduleId && !!documentForm.errors.moduleId}
              >
                <option value="">Select Module</option>
                {course.modules?.map(module => (
                  <option key={module._id} value={module._id}>
                    {module.title}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {documentForm.errors.moduleId}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags (optional)</Form.Label>
              <Form.Control
                name="tags"
                value={documentForm.values.tags}
                onChange={documentForm.handleChange}
                placeholder="Comma-separated tags"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDocumentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!selectedFile || loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete "${course.title}"? This action cannot be undone.`}
        confirmText="Delete Course"
        variant="danger"
        onConfirm={handleDeleteCourse}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={loading}
      />
    </Container>
  );
};

export default AdminCourseView;