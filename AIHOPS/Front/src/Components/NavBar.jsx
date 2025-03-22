import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";
import { FaUser } from "react-icons/fa"; // <-- For user icon
import aihops_article from "../assets/AIHOPS.pdf";

const NavBar = () => {
  // Pull out userName from the AuthContext
  const { isAuthenticated, userName, logout } = useAuth();

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
        
        {/* Left side: AIHOPS + user icon/name (if logged in) */}
        <div className="navbar-left">
          <Link
            to="/"
            className={`navbar-home ${
              location.pathname === "/" ? "active" : ""
            }`}
          >
            AIHOPS
          </Link>
          {/* Only show if user is logged in AND userName is defined */}
          {isAuthenticated && userName && (
            <div className="navbar-user-info">
              <FaUser className="user-icon" />
              <span className="user-email">{userName}</span>
            </div>
          )}
        </div>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link nav-button ${
                  location.pathname === "/about" ? "active" : ""
                }`}
              >
                About
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link
                    to="/settings"
                    className={`nav-link nav-button ${
                      location.pathname === "/settings" ? "active" : ""
                    }`}
                  >
                    Settings
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/projectsmanagement"
                    className={`nav-link nav-button ${
                      location.pathname === "/projectsmanagement" ? "active" : ""
                    }`}
                  >
                    Projects Management
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/myprojects"
                    className={`nav-link nav-button ${
                      location.pathname === "/myprojects" ? "active" : ""
                    }`}
                  >
                    Vote
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/notification"
                    className={`nav-link nav-button ${
                      location.pathname === "/notification" ? "active" : ""
                    }`}
                    state={{ triggerFetch: true }}
                  >
                    Notifications
                  </Link>
                </li>

                <li className="nav-item">
                  <button className="nav-link nav-button" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
                <>
                  <li className="nav-item">
                    <Link
                        to="/login"
                        className={`nav-link nav-button ${
                            location.pathname === "/login" ? "active" : ""
                        }`}
                        onClick={handleLogin}
                    >
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                        to="/register"
                        className={`nav-link nav-button ${
                            location.pathname === "/register" ? "active" : ""
                        }`}
                    >
                      Register
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                        to="/verify"
                        className={`nav-link nav-button ${
                            location.pathname === "/verify" ? "active" : ""
                        }`}
                    >
                      Verify
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
