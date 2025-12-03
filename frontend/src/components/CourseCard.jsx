import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const CourseCard = ({ 
  course, 
  showEnrollButton = true, 
  showProgress = false, 
  progress = 0,
  onEnroll,
  isEnrolled = false 
}) => {
  const {
    _id,
    title,
    description,
    instructor,
    duration,
    difficulty,
    price,
    thumbnail,
    category,
    isPublished,
    modules = []
  } = course;

  const totalLectures = modules.reduce((total, module) => total + (module.items?.length || 0), 0);

  const handleEnroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(_id);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Card 
      className="h-100 shadow-sm border-0" 
      style={{
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
      }}
    >
      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
          {category && (
            <Badge bg="light" text="dark" className="me-2 mb-2">
              {category}
            </Badge>
          )}
        </div>

        <Card.Title className="h6 h5-md mb-2" style={{ minHeight: '2.5rem', fontSize: '1rem', lineHeight: '1.3' }}>
          {title}
        </Card.Title>

        <Card.Text className="text-muted small mb-3" style={{ minHeight: '3rem', fontSize: '0.875rem' }}>
          {description?.length > 80 
            ? `${description.substring(0, 80)}...` 
            : description
          }
        </Card.Text>

        <div className="mb-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start text-muted small gap-1">
            <span className="d-flex align-items-center">
              <i className="bi bi-person me-1"></i>
              <span className="text-truncate" style={{ maxWidth: '120px' }}>
                {instructor || 'Imarticus Learning'}
              </span>
            </span>
            <span className="d-flex align-items-center">
              <i className="bi bi-clock me-1"></i>
              {duration || `${totalLectures} lectures`}
            </span>
          </div>
        </div>

        {showProgress && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small>Progress</small>
              <small>{Math.round(progress)}%</small>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div 
                className="progress-bar bg-success"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="mt-auto">
          {price && price > 0 ? (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="h5 mb-0 text-success">₹{price.toLocaleString()}</span>
            </div>
          ) : (
            <div className="mb-3">
              <span className="h5 mb-0 text-success">Free</span>
            </div>
          )}

          <div className="d-grid gap-2">
            <Button 
              as={Link} 
              to={`/courses/${_id}`}
              variant="outline-primary" 
              size="sm"
            >
              View Details
            </Button>      
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CourseCard;