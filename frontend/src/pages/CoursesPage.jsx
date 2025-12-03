import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button } from 'react-bootstrap';
import { courseAPI } from '../api';
import CourseCard from '../components/CourseCard';
import { LoadingSpinner, ErrorMessage, SearchBox, EmptyState } from '../components/CommonComponents';
import { useDebounce, usePagination } from '../hooks/useCustomHooks';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('title');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    currentItems: paginatedCourses,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext,
    hasPrev
  } = usePagination(filteredCourses, 9);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, debouncedSearchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseAPI.getAllCourses();
      setCourses(response.data.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    if (!Array.isArray(courses)) {
      setFilteredCourses([]);
      return;
    }

    let filtered = [...courses];

    // Filter by search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(course => 
        course.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter(course => 
        course.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  };

  // Get unique categories and difficulties for filters
  const categories = Array.isArray(courses) ? [...new Set(courses.map(course => course.category).filter(Boolean))] : [];
  const difficulties = Array.isArray(courses) ? [...new Set(courses.map(course => course.difficulty).filter(Boolean))] : [];

  if (loading) {
    return (
      <Container className="py-5">
        <LoadingSpinner text="Loading courses..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <ErrorMessage message={error} onRetry={fetchCourses} />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-5">
        <h1 className="fw-bold mb-2">All Courses</h1>
        <p className="text-muted">Discover our comprehensive collection of professional development courses</p>
      </div>

      <Row className="g-4">
        {/* Filters Sidebar */}
        <Col lg={3} className="mb-4">
          <div className="d-lg-none mb-3">
            <Button 
              variant="outline-secondary" 
              className="w-100"
              data-bs-toggle="collapse" 
              data-bs-target="#mobileFilters"
              aria-expanded="false"
              aria-controls="mobileFilters"
            >
              <i className="bi bi-funnel me-2"></i>Filters & Sort
            </Button>
          </div>
          <div className="collapse d-lg-block" id="mobileFilters">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-0">
                <h6 className="mb-0 fw-bold">Filter & Sort</h6>
              </Card.Header>
              <Card.Body>
              {/* Search */}
              <div className="mb-4">
                <Form.Label className="fw-medium">Search Courses</Form.Label>
                <SearchBox
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by title, description..."
                  size="sm"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <Form.Label className="fw-medium">Category</Form.Label>
                <Form.Select 
                  size="sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-4">
                <Form.Label className="fw-medium">Difficulty</Form.Label>
                <Form.Select 
                  size="sm"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  <option value="">All Levels</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <Form.Label className="fw-medium">Sort By</Form.Label>
                <Form.Select 
                  size="sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="title">Title (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="newest">Newest First</option>
                </Form.Select>
              </div>

              {/* Clear Filters */}
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedDifficulty('');
                  setSortBy('title');
                }}
              >
                Clear All Filters
              </Button>
            </Card.Body>
          </Card>
          </div>

          {/* Quick Stats */}
          <Card className="border-0 bg-light mt-4">
            <Card.Body className="text-center">
              <h4 className="mb-1">{Array.isArray(courses) ? courses.length : 0}</h4>
              <p className="text-muted mb-0">Total Courses</p>
              <hr className="my-2" />
              <h4 className="mb-1">{filteredCourses.length}</h4>
              <p className="text-muted mb-0">Filtered Results</p>
            </Card.Body>
          </Card>
        </Col>

        {/* Courses Grid */}
        <Col lg={9}>
          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-muted">
                Showing {paginatedCourses.length} of {filteredCourses.length} courses
              </span>
            </div>
          </div>

          {/* Course Cards */}
          {filteredCourses.length === 0 ? (
            <EmptyState
              icon="bi-search"
              title="No courses found"
              description="Try adjusting your search criteria or filters"
              actionButton={
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedDifficulty('');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              <Row className="g-3 g-md-4">
                {paginatedCourses.map(course => (
                  <Col xl={4} lg={6} md={6} sm={6} key={course._id}>
                    <CourseCard course={course} />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Courses pagination" className="mt-5">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${!hasPrev ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={prevPage}
                        disabled={!hasPrev}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <li 
                          key={pageNum}
                          className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          <button 
                            className="page-link"
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${!hasNext ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={nextPage}
                        disabled={!hasNext}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CoursesPage;