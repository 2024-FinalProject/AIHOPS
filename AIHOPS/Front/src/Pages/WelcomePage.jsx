import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import aihops_article from "../assets/AIHOPS.pdf";
import "./WelcomePage.css";

const WelcomePage = () => {
  const { user: currentUser } = useAuth();

  return (
    <div>
      <div className="welcome-container">
        <header className="welcome-header">
          <h1 className="welcome-title">AIHOPS</h1>
          <p className="welcome-subtitle">
            Adoption of Innovation by Healthcare Organizations Prerequisites
            Scale
          </p>
        </header>
        <div className="upper-subtitle-container">
          <span className="lower-subtitle">About: .....</span>
        </div>
        {/* PDF Link */}
        <div className="pdf-link-container">
          <h2 className="pdf-headline">
            <a
              href={aihops_article}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-link"
            >
              AIHOPS article
            </a>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
