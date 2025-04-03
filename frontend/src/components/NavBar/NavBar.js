import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import './NavBar.css';  // Assuming you have a separate CSS file for NavBar styling

function NavBar() {
  return (
    <Navbar className="custom-navbar" fixed="top">
      <Container>
        <Navbar.Brand href="#home" className="white-text">Big Data</Navbar.Brand>
        <Nav className="ms-auto align-items-center">
          <Nav.Link href="/home" className="white-text">Home</Nav.Link>
          <Nav.Link href="/features" className="white-text">Features</Nav.Link>
          <Nav.Link href="/pricing" className="white-text">Pricing</Nav.Link>
          <Button variant="outline-light" className="signup-btn">
            <a href='/register'>Sign Up</a>
          </Button>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default NavBar;
