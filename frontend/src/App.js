import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WorkflowEditor from "./components/WorkflowEditor";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Homepage from "./pages/Homepage/Homepage";
import CodeEditorPanel from "./pages/CodeEditorPanel/CodeEditorPanel";

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    setUserRole(localStorage.getItem("role"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    setUserRole(null);
  };

  return (
    <Router>
      <div style={{ textAlign: "center"}}>

        {/* Show Logout Button if User is Logged In */}
        {userRole && (
          <button onClick={handleLogout} style={{ marginBottom: "10px" }}>🚪 Logout</button>
        )}

        <Routes>
          {/* ✅ Redirect logged-in users to Workflow Editor, else Login */}
          <Route path="/" element={userRole ? <Navigate to="/workflow-editor" /> : <Navigate to="/home" />} />
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Homepage />} />
          <Route path="/code-editor" element={<CodeEditorPanel />} />
          

          {/* ✅ Both Students & Instructors Can Edit Workflows */}
          <Route 
            path="/workflow-editor" 
            element={userRole ? <WorkflowEditor userRole={userRole} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
