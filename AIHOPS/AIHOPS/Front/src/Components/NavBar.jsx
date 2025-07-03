import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";
import { getPendingRequest } from "../api/ProjectApi";
import { IoMdNotificationsOutline } from "react-icons/io";
import ProfilePicture from "../Components/ProfilePicture"; // Import the new component

const NavBar = () => {
  const { isAuthenticated, userName, logout, isAdmin, profilePictureUrl } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [newMessages, setNewMessages] = useState(false);
  const [localProfileUrl, setLocalProfileUrl] = useState(profilePictureUrl);

  // Update local state when the context value changes
  useEffect(() => {
    console.log("NavBar: profilePictureUrl changed:", profilePictureUrl);
    if (profilePictureUrl !== localProfileUrl) {
      console.log("NavBar: Updating local profile URL state");
      setLocalProfileUrl(profilePictureUrl);
    }
  }, [profilePictureUrl, localProfileUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingRequest();
    }
  }, [isAuthenticated, location.pathname]);

  const fetchPendingRequest = async () => {
    try {
      const response = await getPendingRequest();
      if (response.data.success) {
        setNewMessages(response.data.requests.length > 0);
      } else {
        setNewMessages(false);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/");
  };

  const handleAdmin = () => {
    navigate("/admin");
  };

  // Modified to pass state to automatically open the profile picture section
  const handleProfileClick = () => {
    navigate("/settings", { state: { openProfilePicture: true } });
  };

  // Force a render if needed
  const forceUpdate = React.useReducer(() => ({}), {})[1];

  console.log("NavBar rendering with profilePictureUrl:", profilePictureUrl);
  console.log("NavBar rendering with localProfileUrl:", localProfileUrl);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left side: AIHOPS + user icon/name (if logged in) */}
        <div className="navbar-left">
          <Link
            to="/"
            className={`navbar-home ${location.pathname === "/" ? "active" : ""
              }`}
          >
            AIHOPS
          </Link>
          {/* Only show if user is logged in AND userName is defined */}
          {isAuthenticated && userName && (
            <div className="navbar-user-info" onClick={handleProfileClick}>
              <ProfilePicture
                userName={userName}
                profilePictureUrl={localProfileUrl || profilePictureUrl}
                size="small"
              />
              <span className="user-email">{userName}</span>
            </div>
          )}
        </div>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link nav-button ${location.pathname === "/about" ? "active" : ""
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
                    className={`nav-link nav-button ${location.pathname === "/settings" ? "active" : ""
                      }`}
                  >
                    Settings
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/projectsmanagement"
                    className={`nav-link nav-button ${location.pathname === "/projectsmanagement"
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
                    className={`nav-link nav-button ${location.pathname === "/myprojects" ? "active" : ""
                      }`}
                  >
                    Vote
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/notification"
                    className={`nav-link nav-button ${location.pathname === "/notification" ? "active" : ""
                      }`}
                    state={{ triggerFetch: true }}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <IoMdNotificationsOutline size={16} />
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
                      className={`nav-link nav-button ${location.pathname === "/admin" ? "active" : ""
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
                    className={`nav-link nav-button ${location.pathname === "/login" ? "active" : ""
                      }`}
                    onClick={handleLogin}
                  >
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/register"
                    className={`nav-link nav-button ${location.pathname === "/register" ? "active" : ""
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