import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";
import aihops_article from "../assets/AIHOPS.pdf";

const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { user: userName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to homepage after logout
  };

  const handleLogin = () => {
    navigate("/"); // Redirect to homepage after login
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link
          to="/"
          className={`navbar-home ${location.pathname === "/" ? "active" : ""}`}
        >
          AIHOPS
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link nav-button ${location.pathname === '/about' ? 'active' : ''}`}
              >
                About
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link
                    to="/settings"
                    className={`nav-link nav-button ${location.pathname === '/settings' ? 'active' : ''}`}
                  >
                    Settings
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/projectsmanagement"
                    className={`nav-link nav-button ${location.pathname === '/projectsmanagement' ? 'active' : ''}`}
                  >
                    Projects Management
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/myprojects"
                    className={`nav-link nav-button ${location.pathname === '/myprojects' ? 'active' : ''}`}
                  >
                    Vote
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/notification"
                    className={`nav-link nav-button ${location.pathname === '/notification' ? 'active' : ''}`}
                    state={{ triggerFetch: true }}
                  >
                    Notifications
                  </Link>
                </li>

                <li className="nav-item">
                  <button
                    className="nav-link nav-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    to="/login"
                    className={`nav-link nav-button ${location.pathname === '/login' ? 'active' : ''}`}
                    onClick={handleLogin} // Redirect to homepage after login
                  >
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/register"
                    className={`nav-link nav-button ${location.pathname === '/register' ? 'active' : ''}`}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
