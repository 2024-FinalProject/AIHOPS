import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/NavBar";
import "./WelcomePage.css";


const WelcomePage = () => {
  const { user: currentUser } = useAuth();

  return (

    <div className="content-container">
      {/* Large Button and Small Button Container */}
      <div className="large-button-container">
        <Link to="/main" className="large-button">
        <span className="button-title">AIHOPS</span>
          <br />
          <span className="button-subtitle">Adoption of Innovation by Healthcare Organization Prerequisites Scale</span>
        </Link>
        <Link to="/legal" className="small-button">
          RIGHTS RESERVED LEGAL STATEMENT
        </Link>
      </div>

      {/* Vertical Button Container */}
      <div className="button-container">
        <Link to="/login" className="button login">
          Login
        </Link>
        <Link to="/register" className="button register">
          Register
        </Link>
        <Link to="/about" className="button about">
          ABOUT
        </Link>
        <Link to="/accessibility" className="button accessibility">
          ACCESSIBILITY
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
