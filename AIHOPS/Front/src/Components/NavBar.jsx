import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { user: userName } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-home">
          {" "}
          AIHOPS{" "}
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <>
                {/* Profile button */}
                <li className="nav-item">
                  <Link to="/profile" className="nav-link nav-button">
                    Profile
                  </Link>
                </li>

                {/* Projects Management button */}
                <li className="nav-item">
                  <Link to="/projectsmanagement" className="nav-link nav-button">
                    Projects Management
                  </Link>
                </li>

                {/* _old Projects Management button */}
                {/* <li className="nav-item">
                  <Link to="/projectsmanagement_old" className="nav-link nav-button">
                    Projects Management _old
                  </Link>
                </li> */}

                {/* MyProjects button */}
                <li className="nav-item">
                  <Link to="/myprojects" className="nav-link nav-button">
                    Vote On Projects
                  </Link>
                </li>

                {/* Notification button */}
                <li className="nav-item">
                  <Link
                    to="/notification"
                    className="nav-link nav-button"
                    state={{ triggerFetch: true }} // Passing state to trigger the fetch
                  >
                    Notification
                  </Link>
                </li>

                {/* Logout button */}
                <li className="nav-item">
                  <button className="nav-link nav-button logout" onClick={logout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">
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
