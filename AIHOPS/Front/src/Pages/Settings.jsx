import React, { useState } from 'react';
import './Settings.css'; // Import the CSS
import { updatePassword } from "../api/AuthApi";

const SettingsPage = () => {
  const [openSections, setOpenSections] = useState({
    security: false,
    changePassword: false,
    deleteAccount: false,
    appearance: false,
    personalization: false,
    privacy: false,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    shareScales: false,
    allowResearch: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePasswordChange = async () => {
    let cookie = localStorage.getItem("authToken");

    if (!cookie) {
      alert("No authentication token found. Please log in again.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("The new password does not match with the verified password!");
      return;
    }

    if (currentPassword === "" || newPassword === "" || confirmPassword === "") {
      alert("Please fill in all fields!");
      return;
    }

    if (newPassword === currentPassword) {
      alert("The new password cannot be the same as the current password!");
      return;
    }

    try {
      let res = await updatePassword(cookie, currentPassword, newPassword);
      if (res.data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert("Password updated successfully!");
      } else {
        alert("Error in updating the password: " + res.data.message);
      }
    } catch (error) {
      alert("Error in updating the password!");
    }
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
        <h2 style={{ textAlign: "center" }}>
          <u>Settings:</u>
        </h2>

        {/* Security Section */}
        <SectionHeader title="Security" section="security" isOpen={openSections.security} />
        {openSections.security && (
          <div className="section-content">
            <SectionHeader title="Change Password" section="changePassword" isOpen={openSections.changePassword} />
            {openSections.changePassword && (
              <div className="inner-section-content">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="password-input"
                  style = {{fontFamily: 'Verdana, sans-serif'}}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="password-input"
                  style = {{fontFamily: 'Verdana, sans-serif'}}
                />
                <input
                  type="password"
                  placeholder="Verify new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="password-input"
                  style = {{fontFamily: 'Verdana, sans-serif'}}
                />
                <button onClick={handlePasswordChange} className="button button-green">
                  Update Password
                </button>
              </div>
            )}

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
            <button className="button button-blue" onClick={() => alert("Toggle Light/Dark Theme Not Implemented Yet!")}>
              Toggle Light/Dark Theme
            </button>
          </div>
        )}

        {/* Personalization Section */}
        <SectionHeader title="Personalization" section="personalization" isOpen={openSections.personalization} />
        {openSections.personalization && (
          <div className="section-content">
            <button className="button button-blue" onClick={() => alert("Upload Profile Picture Not Implemented Yet!")}>
              Upload Profile Picture
            </button>
            <button className="button button-blue" onClick={() => alert("Change Name Not Implemented Yet!")} style={{ marginLeft: "10px" }}>
              Change Name
            </button>
            <button className="button button-blue" onClick={() => alert("Change Organization Not Implemented Yet!")} style={{ marginLeft: "10px" }}>
              Change Organization
            </button>
            <button className="button button-blue" onClick={() => alert("Change Position Not Implemented Yet!")} style={{ marginLeft: "10px" }}>
              Change Position
            </button>
          </div>
        )}

        {/* Privacy Section */}
        <SectionHeader title="Privacy" section="privacy" isOpen={openSections.privacy} />
        {openSections.privacy && (
          <div className="section-content privacy-content">
            <label className="privacy-option">
              <input
                type="checkbox"
                checked={privacySettings.shareScales}
                onChange={() =>
                  setPrivacySettings((prev) => ({ ...prev, shareScales: !prev.shareScales }))
                }
                className="checkbox-input"
              />
              Content scales I create can be shared with other users.
            </label>

            <label className="privacy-option">
              <input
                type="checkbox"
                checked={privacySettings.allowResearch}
                onChange={() =>
                  setPrivacySettings((prev) => ({ ...prev, allowResearch: !prev.allowResearch }))
                }
                className="checkbox-input"
              />
              Data from my project may be used for academic research.
            </label>

            <button className="button button-blue" onClick={()=> alert('Not Implemented Yet!')}>Save Privacy Settings</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
