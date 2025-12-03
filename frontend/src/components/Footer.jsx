import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#2d6b4f', color: 'white' }} className="py-4 mt-5">
      <Container>
        {/* Top section with social media and app downloads */}
        <Row className="align-items-center mb-4 g-3">
          <Col md={6} className="text-center text-md-start">
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-md-start">
              <span className="me-0 me-sm-3 mb-2 mb-sm-0" style={{ fontSize: '14px' }}>Follow us on</span>
              <div className="d-flex gap-3">
                <a href="#" className="text-white text-decoration-none d-flex align-items-center justify-content-center" 
                   style={{ 
                     width: '35px', 
                     height: '35px', 
                     backgroundColor: 'rgba(255,255,255,0.1)', 
                     borderRadius: '6px',
                     fontSize: '18px',
                     transition: 'all 0.3s ease'
                   }}
                   onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                   onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                  f
                </a>
                <a href="#" className="text-white text-decoration-none d-flex align-items-center justify-content-center" 
                   style={{ 
                     width: '35px', 
                     height: '35px', 
                     backgroundColor: 'rgba(255,255,255,0.1)', 
                     borderRadius: '6px',
                     fontSize: '18px',
                     transition: 'all 0.3s ease'
                   }}
                   onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                   onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                  𝕏
                </a>
                <a href="#" className="text-white text-decoration-none d-flex align-items-center justify-content-center" 
                   style={{ 
                     width: '35px', 
                     height: '35px', 
                     backgroundColor: 'rgba(255,255,255,0.1)', 
                     borderRadius: '6px',
                     fontSize: '18px',
                     transition: 'all 0.3s ease'
                   }}
                   onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                   onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                  In
                </a>
              </div>
            </div>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-center">
              <span className="me-0 me-sm-3 mb-2 mb-sm-0" style={{ fontSize: '14px' }}>Download our app</span>
              <div className="d-flex flex-column flex-sm-row gap-2">
                {/* Google Play Store */}
                <a href="#" className="text-decoration-none">
                  <div 
                    className="d-flex align-items-center"
                    style={{ 
                      backgroundColor: '#000', 
                      color: 'white', 
                      padding: '8px 12px', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      minWidth: '140px',
                      border: '1px solid #333',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-start">
                      <div style={{ fontSize: '10px', lineHeight: '1' }}>GET IT ON</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>Google Play</div>
                    </div>
                  </div>
                </a>
                {/* App Store */}
                <a href="#" className="text-decoration-none">
                  <div 
                    className="d-flex align-items-center"
                    style={{ 
                      backgroundColor: '#000', 
                      color: 'white', 
                      padding: '8px 12px', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      minWidth: '140px',
                      border: '1px solid #333',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                    </svg>
                    <div className="text-start">
                      <div style={{ fontSize: '10px', lineHeight: '1' }}>Download on the</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>App Store</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </Col>
        </Row>

        {/* Divider line */}
        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '2rem 0' }} />

        {/* Bottom section with logo and links */}
        <Row className="align-items-center g-3">
          <Col md={6} className="text-center text-md-start">
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-md-start">
              <div 
                className="me-0 me-sm-3 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                <span style={{ color: '#90c695' }}>I</span>
                <span style={{ color: 'white', fontSize: '10px', marginTop: '4px' }}>M</span>
              </div>
              <div>
                <div className="fw-bold" style={{ fontSize: '16px', letterSpacing: '1px' }}>
                  IMARTICUS
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  LEARNING
                </div>
              </div>
            </div>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-md-end align-items-center flex-wrap gap-2 gap-sm-3">
              <a href="/terms" className="text-white text-decoration-none" style={{ fontSize: '12px' }}>
                Terms & Conditions
              </a>
              <span className="d-none d-sm-inline" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>|</span>
              <a href="/privacy" className="text-white text-decoration-none" style={{ fontSize: '12px' }}>
                Privacy Policy
              </a>
            </div>
            <div className="mt-2" style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
              © 2025 Imarticus Learning Pvt. Ltd. All rights reserved.
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;