import React, { useState } from 'react';
import { Accordion, ListGroup, Badge, Button, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

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
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default ModuleAccordion;