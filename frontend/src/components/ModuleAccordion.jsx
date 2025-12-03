import React, { useState, useEffect } from 'react';
import { Accordion, ListGroup, Badge, Button, ProgressBar, Card, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { documentAPI } from '../api';

const ModuleAccordion = ({ 
  modules = [], 
  courseId, 
  onItemClick, 
  completedItems = [],
  enrollmentId,
  isEnrolled = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const [activeItem, setActiveItem] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [expandedDocs, setExpandedDocs] = useState({});

  // Fetch documents for this course
  useEffect(() => {
    if (courseId) {
      fetchDocuments();
    }
  }, [courseId]);

  const fetchDocuments = async () => {
    try {
      const response = await documentAPI.getDocumentsByCourse(courseId);
      setDocuments(response.data.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const isItemCompleted = (itemId) => {
    return completedItems.includes(itemId);
  };

  const getModuleProgress = (module) => {
    if (!module.items || module.items.length === 0) return 0;
    const completedCount = module.items.filter(item => isItemCompleted(item._id)).length;
    return (completedCount / module.items.length) * 100;
  };

  const handleItemClick = (item, moduleId) => {
    // Check if user is authenticated and enrolled
    if (!isAuthenticated) {
      alert('Please login to access course content.');
      return;
    }
    
    if (!isEnrolled) {
      alert('Please enroll in this course to access the content.');
      return;
    }
    
    setActiveItem(item._id);
    if (onItemClick) {
      onItemClick(item, moduleId, enrollmentId);
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'video':
        return 'bi-play-circle';
      case 'document':
        return 'bi-file-text';
      default:
        return 'bi-file';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-collection fs-1 d-block mb-3"></i>
        <p>No modules available for this course yet.</p>
      </div>
    );
  }

  return (
    <Accordion defaultActiveKey="0">
      {modules.map((module, moduleIndex) => {
        const moduleProgress = getModuleProgress(module);
        const totalDuration = module.items?.reduce((sum, item) => sum + (item.duration || 0), 0) || 0;

        return (
          <Accordion.Item eventKey={moduleIndex.toString()} key={module._id}>
            <Accordion.Header>
              <div className="w-100 me-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{module.title}</h6>
                    <div className="d-flex gap-3 text-muted small">
                      <span>
                        <i className="bi bi-collection me-1"></i>
                        {module.items?.length || 0} items
                      </span>
                      {totalDuration > 0 && (
                        <span>
                          <i className="bi bi-clock me-1"></i>
                          {formatDuration(totalDuration)}
                        </span>
                      )}
                      <span>
                        <i className="bi bi-check-circle me-1"></i>
                        {Math.round(moduleProgress)}% complete
                      </span>
                    </div>
                  </div>
                </div>
                {moduleProgress > 0 && (
                  <ProgressBar 
                    now={moduleProgress} 
                    className="mt-2"
                    style={{ height: '4px' }}
                    variant={moduleProgress === 100 ? 'success' : 'primary'}
                  />
                )}
              </div>
            </Accordion.Header>

            <Accordion.Body className="p-0">
              {module.description && (
                <div className="p-3 border-bottom bg-light">
                  <p className="mb-0 text-muted small">{module.description}</p>
                </div>
              )}

              {module.items && module.items.length > 0 ? (
                <ListGroup variant="flush">
                  {module.items.map((item, itemIndex) => {
                    const completed = isItemCompleted(item._id);
                    const isActive = activeItem === item._id;

                    return (
                      <ListGroup.Item 
                        key={item._id}
                        className={`border-0 ${isActive ? 'bg-primary bg-opacity-10' : ''} ${
                          !isAuthenticated || !isEnrolled ? 'text-muted' : ''
                        }`}
                        action={isAuthenticated && isEnrolled}
                        onClick={() => handleItemClick(item, module._id)}
                        style={{ 
                          cursor: isAuthenticated && isEnrolled ? 'pointer' : 'not-allowed',
                          opacity: !isAuthenticated || !isEnrolled ? 0.6 : 1
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            {!isAuthenticated || !isEnrolled ? (
                              <i 
                                className="bi bi-lock text-muted"
                                style={{ fontSize: '1.2rem' }}
                              ></i>
                            ) : (
                              <i 
                                className={`${getItemIcon(item.type)} ${
                                  completed ? 'text-success' : 'text-muted'
                                }`}
                                style={{ fontSize: '1.2rem' }}
                              ></i>
                            )}
                          </div>

                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1 fw-medium">
                                  {item.title}
                                  {completed && (
                                    <i className="bi bi-check-circle text-success ms-2"></i>
                                  )}
                                </h6>
                                
                                <div className="d-flex gap-3 small text-muted">
                                  <span>
                                    <Badge 
                                      bg={item.type === 'video' ? 'primary' : 'secondary'}
                                      className="me-2"
                                    >
                                      {item.type}
                                    </Badge>
                                  </span>
                                  {item.duration && (
                                    <span>
                                      <i className="bi bi-clock me-1"></i>
                                      {formatDuration(item.duration)}
                                    </span>
                                  )}
                                  {item.order && (
                                    <span>
                                      <i className="bi bi-hash me-1"></i>
                                      {item.order}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isActive && isAuthenticated && isEnrolled && (
                                <Button 
                                  size="sm" 
                                  variant="outline-primary"
                                  className="ms-2"
                                >
                                  <i className="bi bi-play-fill"></i>
                                </Button>
                              )}
                              
                              {(!isAuthenticated || !isEnrolled) && (
                                <span className="ms-2 small text-muted">
                                  <i className="bi bi-lock me-1"></i>
                                  {!isAuthenticated ? 'Login required' : 'Enrollment required'}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="mb-0 mt-2 small text-muted">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                  <p className="mb-0">No items in this module yet.</p>
                </div>
              )}

              {/* Documents for this module */}
              {documents.filter(doc => doc.moduleId === module._id).length > 0 && (
                <div className="border-top">
                  <div className="p-3 bg-light border-bottom">
                    <h6 className="mb-0 text-muted">
                      <i className="bi bi-file-earmark me-2"></i>
                      Documents
                    </h6>
                  </div>
                  <ListGroup variant="flush">
                    {documents
                      .filter(doc => doc.moduleId === module._id)
                      .map(doc => {
                        const isExpanded = expandedDocs[doc._id];
                        return (
                          <ListGroup.Item key={doc._id} className="border-0">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                                  <h6 className="mb-0">{doc.title}</h6>
                                  <Badge bg="secondary" className="ms-2">
                                    {doc.fileType?.toUpperCase()}
                                  </Badge>
                                  {doc.summaryGenerated && (
                                    <Badge bg="success" className="ms-2">
                                      <i className="bi bi-robot me-1"></i>AI Summary
                                    </Badge>
                                  )}
                                </div>
                                <div className="small text-muted mb-2">
                                  Size: {(doc.fileSize / 1024).toFixed(1)} KB
                                  {doc.tags && doc.tags.length > 0 && (
                                    <span className="ms-3">
                                      Tags: {doc.tags.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="d-flex gap-2">
                                {doc.summaryGenerated && (
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => setExpandedDocs(prev => ({
                                      ...prev,
                                      [doc._id]: !prev[doc._id]
                                    }))}
                                  >
                                    <i className={`bi bi-${isExpanded ? 'chevron-up' : 'chevron-down'}`}></i>
                                    Summary
                                  </Button>
                                )}
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={async () => {
                                    const token = localStorage.getItem("token");

                                    const res = await fetch(
                                      `http://localhost:5000/api/documents/${doc._id}/download`,
                                      {
                                        method: "GET",
                                        headers: {
                                          Authorization: `Bearer ${token}`
                                        }
                                      }
                                    );
                                    if (!res.ok) {
  console.log(await res.text());
  return;
}

                                    console.log(res);
                                    const blob = await res.blob();
                                    console.log(blob);
                                    const url = window.URL.createObjectURL(blob);

                                      // Trigger download
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = ""; // backend sets filename
                                      a.click();

                                      // Cleanup
                                      window.URL.revokeObjectURL(url);
                                  }}
                                >
                                  <i className="bi bi-download"></i>
                                  Download
                                </Button>
                              </div>
                            </div>
                            
                            {/* AI Summary Section */}
                            <Collapse in={isExpanded}>
                              <div>
                                {doc.summaryGenerated && doc.aiSummary ? (
                                  <Card className="mt-3 border-info">
                                    <Card.Header className="bg-info bg-opacity-10">
                                      <h6 className="mb-0 text-info">
                                        <i className="bi bi-robot me-2"></i>
                                        AI Summary (Generated by {doc.aiProvider || 'Gemini'})
                                      </h6>
                                    </Card.Header>
                                    <Card.Body>
                                      <p className="mb-0 text-muted" style={{ lineHeight: '1.6' }}>
                                        {doc.aiSummary}
                                      </p>
                                      {doc.summaryGeneratedAt && (
                                        <small className="text-muted d-block mt-2">
                                          Generated on {new Date(doc.summaryGeneratedAt).toLocaleDateString()}
                                        </small>
                                      )}
                                    </Card.Body>
                                  </Card>
                                ) : (
                                  <div className="mt-3 p-3 bg-light rounded">
                                    <div className="text-muted text-center">
                                      <i className="bi bi-hourglass-split fs-4 d-block mb-2"></i>
                                      <p className="mb-0 small">AI summary not available yet</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Collapse>
                          </ListGroup.Item>
                        );
                      })
                    }
                  </ListGroup>
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default ModuleAccordion;