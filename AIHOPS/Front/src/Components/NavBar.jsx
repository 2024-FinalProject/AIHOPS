import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";
import { FaUser } from "react-icons/fa"; // <-- For user icon
import aihops_article from "../assets/AIHOPS.pdf";
import AccessibilityMenu from "./AccessibilityMenu";
import { getPendingRequest } from "../api/ProjectApi";

import { IoMdNotificationsOutline } from "react-icons/io"; // Notification bell icon

const NavBar = () => {
  // Pull out userName from the AuthContext
  const { isAuthenticated, userName, logout, isAdmin } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [newMessages, setNewMessages] = useState(false); // State to track new messages

  useEffect(() => {
    fetchPendingRequest();
  }, [location.pathname]);

  const fetchPendingRequest = async () => {
    try {
      const response = await getPendingRequest();
      if (response.data.success) {
        setNewMessages(response.data.requests.length > 0); // Check if there are new messages
      } else {
        setNewMessages(false); // No new messages if the request fails
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to homepage after logout
  };

  const handleLogin = () => {
    navigate("/"); // Redirect to homepage after login
  };

  const handleAdmin = () => {
    navigate("/admin");
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
                      location.pathname === "/projectsmanagement"
                        ? "active"
                        : ""
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
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <IoMdNotificationsOutline size={20} />
                    Notifications
                    {newMessages && <span className="new-message-dot" />}
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
                {isAdmin && (
                  <li className="nav-item">
                    <Link
                      to="/admin"
                      className={`nav-link nav-button ${
                        location.pathname === "/admin" ? "active" : ""
                      }`}
                      onClick={handleAdmin}
                    >
                      Admin
                    </Link>
                  </li>
                )}
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
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
