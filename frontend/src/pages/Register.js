import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import "./Login.css"; // Reuse same CSS for background

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleRegister = async () => {
     // Email must be valid and end with @charlotte.edu
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(charlotte|uncc)\.edu$/;
    if (!emailRegex.test(username)) {
      alert("❌ Invalid Email! Please use a valid @charlotte.edu email address.");
      return;
    }
    try {
      await registerUser({ username, password, role });
      alert("✅ Registration Successful! Please Login.");
      navigate("/login");
    } catch (error) {
      alert("❌ Registration Failed! User may already exist.");
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center">
      <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Register</h2>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Email"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="form-select mb-3"
          onChange={(e) => setRole(e.target.value)}
          value={role}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        <button className="btn btn-success w-100 mb-3" onClick={handleRegister}>
          Register
        </button>
        <p className="text-center">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
