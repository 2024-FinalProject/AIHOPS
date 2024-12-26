import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/NavBar";
import "./WelcomePage.css";

const WelcomePage = () => {
  const { user: currentUser } = useAuth();

  return (
    <div>
      <NavBar />
      <div className="welcome-container">
        <header className="welcome-header">
          <h1 className="welcome-title">AIHOPS</h1>
          <p className="welcome-subtitle">Create a survey or take one :)</p>
        </header>
        <div className="upper-subtitle-container">
          <span className="lower-subtitle">
            AIHOPS is a survey platform that allows you to create and take
            surveys and helps you to make better decisions for your
            organization.
          </span>
        </div>
       
      </div>
    </div>

    
  );
};

export default WelcomePage;
