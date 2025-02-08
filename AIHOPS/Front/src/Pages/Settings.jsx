import React, { useState } from 'react';
import './Settings.css'; // Import the CSS
import { updatePassword } from "../api/AuthApi";

const SettingsPage = () => {
  const [openSections, setOpenSections] = useState({
    security: false,
    appearance: false,
    personalization: false,
    privacy: false,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPasswordFields, setShowPasswordFields] = useState(false);
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

  const handleNotImplemented = () => {
    alert('Not implemented yet!');
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

  const handlePasswordChange = async () => {
      let cookie = localStorage.getItem("authToken");
          
      if (!cookie) {
          setMsg("No authentication token found. Please log in again.");
          setIsSuccess(false);
          return;
      }

      if (newPassword !== confirmPassword) {
        alert('The new password does not match with the verified password!');
        return;
      }

      if(currentPassword == "" || newPassword == "" || confirmPassword == ""){
        alert('Please fill in all fields!');
        return;
      }

      if(newPassword == currentPassword){
        alert('The new password cannot be the same as the current password!');
        return;
      }

      try{
        let res = await updatePassword(cookie, currentPassword, newPassword);
        if (res.data.success) {
            //clear the fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            alert("Password updated successfully!");
        }
        else {
            alert("Error in updating the password: " + res.data.message);
        }
    } catch (error) {
        alert("Error in updating the password!");
    }
  }

  return (
    <div className="settings-container">
      <div className="settings-box">
        <h2 style={{ textAlign: 'center'}}>
          <u>Settings:</u>
        </h2>

        {/* Security Section */}
        <SectionHeader title="Security" section="security" isOpen={openSections.security} />
        {openSections.security && (
          <div className="section-content">
            <div>
              <button
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="button button-blue"
              >
                Change Password
              </button>
              {showPasswordFields && (
                <div className="mt-4 space-y-4">
                  <input
                    type={'password'}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type={'password'}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ marginLeft: '10px' }}
                  />
                  <input
                    type={'password'}
                    placeholder="Verify new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ marginLeft: '10px' }}
                  />
                  <button
                    onClick={handlePasswordChange}
                    className="button button-green"
                    style={{ marginLeft: '10px' }}
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleNotImplemented}
              className="button button-red"
            >
              Delete Account
            </button>
          </div>
        )}

        {/* Appearance Section */}
        <SectionHeader title="Appearance" section="appearance" isOpen={openSections.appearance} />
        {openSections.appearance && (
          <div className="section-content">
            <button
              onClick={handleNotImplemented}
              className="button button-blue"
            >
              Toggle Light/Dark Theme
            </button>
          </div>
        )}

        {/* Personalization Section */}
        <SectionHeader title="Personalization" section="personalization" isOpen={openSections.personalization} />
        {openSections.personalization && (
          <div className="section-content">
            <button onClick={handleNotImplemented} className="button button-blue">
              Upload Profile Picture
            </button>
            <button onClick={handleNotImplemented} className="button button-blue" style = {{marginLeft: '10px'}}>
              Change Name
            </button>
            <button onClick={handleNotImplemented} className="button button-blue" style = {{marginLeft: '10px'}}>
              Change Organization
            </button>
            <button onClick={handleNotImplemented} className="button button-blue" style = {{marginLeft: '10px'}}>
              Change Position
            </button>
          </div>
        )}

        {/* Privacy Section */}
        <SectionHeader title="Privacy" section="privacy" isOpen={openSections.privacy} />
        {openSections.privacy && (
          <div className="section-content">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={privacySettings.shareScales}
                onChange={() =>
                  setPrivacySettings((prev) => ({
                    ...prev,
                    shareScales: !prev.shareScales,
                  }))
                }
                className="checkbox-input"
              />
              <label className="checkbox-label">
                Content scales I create can be shared with other users.
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={privacySettings.allowResearch}
                onChange={() =>
                  setPrivacySettings((prev) => ({
                    ...prev,
                    allowResearch: !prev.allowResearch,
                  }))
                }
                className="checkbox-input"
              />
              <label className="checkbox-label">
                Data from my project may be used for academic research.
              </label>
            </div>
            <button
              onClick={handleNotImplemented}
              className="button button-blue"
            >
              Save Privacy Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
