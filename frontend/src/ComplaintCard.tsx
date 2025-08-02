import Button from 'react-bootstrap/Button';
import { Card, Row, Col, Badge} from 'react-bootstrap';


{/* This is Sam - Something like this?
 */}

export default function ComplaintCard() {

    return (
    <Card className="mb-3 p-3 shadow-sm rounded-4 border-0">
      <Row className="g-2 align-items-center">
        {/* Left content */}
        <Col xs={9}>
          <Card.Body className="p-0">
            <div className="d-flex align-items-center mb-2">
              <Badge bg="danger" className="me-2 fs-6 rounded-3 px-2 py-1">87</Badge>
              <Card.Title as="h5" className="mb-0">Complaint Type</Card.Title>
            </div>
            <Card.Text className="mb-1 text-muted small">
              Description
            </Card.Text>
            <Card.Text className="mb-2 text-muted small">
              123 Main St &middot; <span className="text-secondary">2 hours ago</span>
            </Card.Text>
            <Badge bg="light" text="dark" className="rounded-pill px-3 py-1">
              Potential hazard
            </Badge>
          </Card.Body>
        </Col>

        {/* Right image + button */}
        <Col xs={3} className="text-end">
          <img
            src="ADD PATH OF IMAGE"
            alt="Thumbnail"
            className="img-fluid rounded-3 mb-2"
            style={{ maxHeight: '60px' }}
          />
          <div className="d-flex justify-content-end align-items-center text-primary" style={{ cursor: 'pointer' }}>
            <span className="me-1">Assign</span>
            <span>&rarr;</span>
          </div>
        </Col>
      </Row>
    </Card>
    )
}
  
  


