import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useNavigate, Link } from "react-router-dom";

function Navmenu({ setUserRole, handleLogout }) {
    const navigate = useNavigate();
  
  const handleLogoutFunction = () => {
    localStorage.clear();
    if (handleLogout) {
        console.log( handleLogout );
        handleLogout();
    }    
    navigate('/');
  }
  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand as={Link} to="/home">Big Data</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/workflow-editor">Workflow</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            {!setUserRole ? (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to={'/login'} onClick={handleLogoutFunction}>Logout</Nav.Link> // Add a Logout link for logged-in users
            )}
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

export default Navmenu;
