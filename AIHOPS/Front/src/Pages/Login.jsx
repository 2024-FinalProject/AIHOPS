import React, { useState, useEffect } from "react";
import { startSession, loginUser } from "../api/AuthApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const session = await startSession();
      const cookie = session.data.cookie;

      console.log("Cookie received from startSession:", cookie); // Debug log

      const response = await loginUser(cookie, userName, password);

      if (response.data.success) {
        setMsg(response.data.message);

        // Store auth data in localStorage
        localStorage.setItem("authToken", cookie);
        console.log(
          "Cookie stored in localStorage:",
          localStorage.getItem("authToken")
        ); // Debug log

        localStorage.setItem("userName", userName);
        login(cookie, userName);
        navigate("/");
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMsg("Login failed: Invalid credentials");
    }
  };

  return (
    <section>
      <div className="auth-container">
        <h2>Login</h2>
        <p>
          Don't have an account? <a href="/Register">Sign up</a>
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            onChange={(e) => setUserName(e.target.value)}
            value={userName}
            placeholder="Enter username"
            required
          />

          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="Enter password"
            required
          />

          <button type="submit">Login</button>

          {msg && <p className="error-message">{msg}</p>}
        </form>
      </div>
    </section>
  );
};

export default Login;
