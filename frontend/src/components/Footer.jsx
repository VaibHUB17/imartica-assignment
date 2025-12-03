import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <Container>
        <Row>
          <Col md={6}>
            <div className="d-flex align-items-center mb-3">
              <div 
                className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: '#2c6e4f',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                I
              </div>
              <div>
                <div className="fw-bold">IMARTICUS LEARNING</div>
                <div className="small text-muted">Professional Development</div>
              </div>
            </div>
            <p className="text-muted">
              Empowering professionals with industry-relevant skills and knowledge 
              through comprehensive online courses and training programs.
            </p>
          </Col>
          <Col md={3}>
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="/courses" className="text-muted text-decoration-none">All Courses</a></li>
              <li><a href="/about" className="text-muted text-decoration-none">About Us</a></li>
              <li><a href="/contact" className="text-muted text-decoration-none">Contact</a></li>
              <li><a href="/careers" className="text-muted text-decoration-none">Careers</a></li>
            </ul>
          </Col>
          <Col md={3}>
            <h6 className="fw-bold mb-3">Support</h6>
            <ul className="list-unstyled">
              <li><a href="/help" className="text-muted text-decoration-none">Help Center</a></li>
              <li><a href="/privacy" className="text-muted text-decoration-none">Privacy Policy</a></li>
              <li><a href="/terms" className="text-muted text-decoration-none">Terms of Service</a></li>
              <li><a href="/faq" className="text-muted text-decoration-none">FAQ</a></li>
            </ul>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row>
          <Col md={6}>
            <p className="text-muted mb-0">&copy; 2024 Imarticus Learning. All rights reserved.</p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="d-flex justify-content-md-end gap-3">
              <a href="#" className="text-muted">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-muted">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-muted">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="#" className="text-muted">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;