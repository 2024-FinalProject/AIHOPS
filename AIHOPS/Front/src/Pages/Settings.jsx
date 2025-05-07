import React, { useState, useEffect } from 'react';
import './Settings.css'; // Import the CSS
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  useEffect(() => {
    if (!isLoggedIn) {
      console.log("Redirecting to /");
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const [openSections, setOpenSections] = useState({
    security: false,
    deleteAccount: false,
    appearance: false,
    profilePicture: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({ title, section, isOpen }) => (
    <div
      className={`section-header ${isOpen ? 'open' : ''}`}
      onClick={() => toggleSection(section)}
    >
      <span className="section-title">{title}</span>
      <button className="toggle-button">{isOpen ? '−' : '+'}</button>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-box">
        <h2 style={{ textAlign: "center" ,marginTop: "-10px"}}>
          <u>Settings</u>:
        </h2>

        {/* Security Section */}
        <SectionHeader title="Security" section="security" isOpen={openSections.security} />
        {openSections.security && (
          <div className="section-content">
            <SectionHeader title="Delete Account" section="deleteAccount" isOpen={openSections.deleteAccount} />
            {openSections.deleteAccount && (
              <div className="inner-section-content">
                <button className="button button-red" onClick={() => alert("Delete Account Not Implemented Yet!")}>
                  Delete Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Appearance Section */}
        <SectionHeader title="Appearance" section="appearance" isOpen={openSections.appearance} />
        {openSections.appearance && (
          <div className="section-content">
            <button 
              className="button button-blue" 
              onClick={toggleTheme}
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              Toggle {theme === 'light' ? 'Dark' : 'Light'} Theme
            </button>
          </div>
        )}

        {/* Profile Picture Section (Simplified from Personalization) */}
        <SectionHeader title="Profile Picture" section="profilePicture" isOpen={openSections.profilePicture} />
        {openSections.profilePicture && (
          <div className="section-content">
            <button className="button button-blue" onClick={() => alert("Upload Profile Picture Not Implemented Yet!")}>
              Upload Profile Picture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;