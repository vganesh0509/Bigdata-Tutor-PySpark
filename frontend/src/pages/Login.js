import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import './Login.css';

const Login = ({ setUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await loginUser({ username, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("userid", response.data.userid);
      setUserRole(response.data.role);
      alert("✅ Login Successful!");

      if (response.data.role !== "instructor") {
        navigate("/workflow-editor");
      } else {
        navigate("/view-workflows");
      }
    } catch (error) {
      alert("❌ Login Failed! Check credentials.");
    }
  };

  return (
    <div className="login-page container-fluid">
      <div className="row vh-100">
        {/* Left side: Login Form */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
            <h2 className="text-center mb-4">Login</h2>
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
            <button className="btn btn-primary w-100 mb-3" onClick={handleLogin}>
              Login
            </button>
            <p className="text-center">
              Don't have an account? <a href="/register">Register</a>
            </p>
          </div>
        </div>

        {/* Right side: Image */}
        <div className="col-md-6 d-none d-md-block p-0 login-image-div">
  <img
    src="/login.jpg"
    alt="Login Visual"
    className="img-fluid login-image"
  />
</div>

      </div>
    </div>

  );
};

export default Login;
