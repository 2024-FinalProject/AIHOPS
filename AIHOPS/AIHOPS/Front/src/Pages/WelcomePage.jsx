import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./WelcomePage.css";

const WelcomePage = () => {
  const { user: currentUser } = useAuth();

  return (
    <div>
      <div className="welcome-page-wrapper">
        <div className="welcome-container">
          <header className="welcome-header">
            <h1 className="welcome-title">
              <u>AIHOPS</u>
            </h1>
            <p className="welcome-subtitle">
              <b>A</b>doption of <b>I</b>nnovation by <b>H</b>ealthcare <b>O</b>
              rganizations<br></br>
              <b>P</b>rerequisites <b>S</b>cale
            </p>
          </header>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
