import React, { useState, useEffect } from "react";
import "./Settings.css"; // Import the CSS
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { deleteAccount } from "../api/AuthApi";
import AlertPopup from "../Components/AlertPopup";
import ProfilePictureUpload from "../Components/ProfilePictureUpload";

const SettingsPage = () => {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const { logout } = useAuth();
  const [alertVerifyPopup, setAlertVerifyPopup] = useState(false);
  const [alertyVerifyMessage, setAlertVerifyMessage] = useState(
    "Are you sure you want to delete your account?" +
      "This action cannot be undone - all of your data will be permenantely deleted."
  );

  // Check if we should open the profile picture section automatically
  // based on the state passed from the NavBar
  const [openSections, setOpenSections] = useState({
    security: false,
    deleteAccount: false,
    appearance: false,
    profilePicture: location.state?.openProfilePicture || false,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      console.log("Redirecting to /");
      navigate("/");
    }

    // Check if the location state has openProfilePicture flag
    if (location.state?.openProfilePicture) {
      setOpenSections(prev => ({
        ...prev,
        profilePicture: true
      }));
    }
  }, [isLoggedIn, navigate, location.state]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({ title, section, isOpen }) => (
    <div
      className={`section-header ${isOpen ? "open" : ""}`}
      onClick={() => toggleSection(section)}
    >
      <span className="section-title">{title}</span>
      <button className="toggle-button">{isOpen ? "−" : "+"}</button>
    </div>
  );

  const handleDeleteAccount = async () => {
    try {
      const response = await deleteAccount();
      if (response.data.success) {
        logout();
        navigate("/");
      } else {
        console.error("Failed to delete account:", response.data.message);
        alert("Failed to delete account. Please try again later.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(
        "An error occurred while deleting the account. Please try again later."
      );
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-box">
        <h2 style={{ textAlign: "center", marginTop: "-10px" }}>
          <u>Settings</u>:
        </h2>

        {/* Security Section */}
        <SectionHeader
          title="Security"
          section="security"
          isOpen={openSections.security}
        />
        {openSections.security && (
          <div className="section-content">
            <SectionHeader
              title="Delete Account"
              section="deleteAccount"
              isOpen={openSections.deleteAccount}
            />
            {openSections.deleteAccount && (
              <div className="inner-section-content">
                <button
                  className="button button-red delete-button"
                  onClick={() => setAlertVerifyPopup(true)}
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Appearance Section */}
        <SectionHeader
          title="Appearance"
          section="appearance"
          isOpen={openSections.appearance}
        />
        {openSections.appearance && (
          <div className="section-content">
            <button
              className="button button-blue"
              onClick={toggleTheme}
              style={{ width: "auto", padding: "10px 20px" }}
            >
              Toggle {theme === "light" ? "Dark" : "Light"} Theme
            </button>
          </div>
        )}

        {/* Profile Picture Section */}
        <SectionHeader
          title="Profile Picture"
          section="profilePicture"
          isOpen={openSections.profilePicture}
        />
        {openSections.profilePicture && (
          <div className="section-content profile-section-content">
            <ProfilePictureUpload />
          </div>
        )}
      </div>
      
      {alertVerifyPopup && (
        <AlertPopup
          message={alertyVerifyMessage}
          type={"info"}
          title={"Delete Account"}
          onCancel={() => setAlertVerifyPopup(false)}
          onConfirm={() => {
            setAlertVerifyPopup(false);
            handleDeleteAccount();
          }}
        />
      )}
    </div>
  );
};

export default SettingsPage;