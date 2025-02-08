import React, { useState } from 'react';

const SettingsPage = () => {
  const [openSections, setOpenSections] = useState({
    security: false,
    appearance: false,
    personalization: false,
    privacy: false
  });
  
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    shareScales: false,
    allowResearch: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNotImplemented = () => {
    alert('Not implemented yet!');
  };

  const SectionHeader = ({ title, section, isOpen }) => (
    <div className="flex items-center mb-6">
        <button 
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded"
            onClick={() => toggleSection(section)}
            >
            {isOpen ? '−' : '+'}
        </button>
      <b style = {{fontSize: '20px', fontFamily: 'Verdana'}}> <u>{title}</u>:</b>
    </div>
  );

  return (
    <div className="min-h-screen flex justify-center" style = {{textAlign: 'start'}}>
      <div className="w-full max-w-2xl px-8 py-12">
        {/* Security Section */}
        <SectionHeader 
          title="Security" 
          section="security"
          isOpen={openSections.security}
        />
        {openSections.security && (
          <div className="ml-8 mb-8 space-y-4" style = {{marginBottom: '20px', marginTop: '20px'}}>
            <div style = {{marginBottom: '20px'}}> 
                <button 
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="block px-4 py-2 bg-white border border-gray-300 rounded"
                >
                Change password
                </button>
                
                {showPasswordFields && (
                <div className="space-y-4">
                    <input 
                    type="password" 
                    placeholder="Current password"
                    className="block w-full px-4 py-2 border border-gray-300 rounded"
                    />
                    <input 
                    type="password" 
                    placeholder="New password"
                    className="block w-full px-4 py-2 border border-gray-300 rounded"
                    />
                    <input 
                    type="password" 
                    placeholder="Verify new password"
                    className="block w-full px-4 py-2 border border-gray-300 rounded"
                    />
                    <button 
                    onClick={handleNotImplemented}
                    className="px-4 py-2 bg-white border border-gray-300 rounded"
                    >
                    Update Password
                    </button>
                </div>
                )}
            </div>
            <button 
              onClick={handleNotImplemented}
              className="block px-4 py-2 bg-white border border-gray-300 rounded text-red-600"
            >
              Delete account
            </button>
          </div>
        )}

        {/* Appearance Section */}
        <SectionHeader 
          title="Appearance" 
          section="appearance"
          isOpen={openSections.appearance}
        />
        {openSections.appearance && (
          <div className="ml-8 mb-8" style = {{marginBottom: '20px', marginTop: '20px'}}>
            <button 
              onClick={handleNotImplemented}
              className="px-4 py-2 bg-white border border-gray-300 rounded"
            >
              Toggle light/dark theme
            </button>
          </div>
        )}

        {/* Personalization Section */}
        <SectionHeader 
          title="Personalization" 
          section="personalization"
          isOpen={openSections.personalization}
        />
        {openSections.personalization && (
          <div className="ml-8 mb-8 space-x-4" style = {{marginBottom: '20px', marginTop: '20px'}}>
            <button onClick={handleNotImplemented} className="px-4 py-2 bg-white border border-gray-300 rounded">
              Upload profile picture
            </button>
            <button onClick={handleNotImplemented} className="px-4 py-2 bg-white border border-gray-300 rounded">
              Change name
            </button>
            <button onClick={handleNotImplemented} className="px-4 py-2 bg-white border border-gray-300 rounded">
              Change organization
            </button>
            <button onClick={handleNotImplemented} className="px-4 py-2 bg-white border border-gray-300 rounded">
              Change position
            </button>
          </div>
        )}

        {/* Privacy Section */}
        <SectionHeader 
          title="Privacy" 
          section="privacy"
          isOpen={openSections.privacy}
        />
        {openSections.privacy && (
          <div className="ml-8 mb-8 space-y-4" style = {{marginBottom: '20px', marginTop: '20px'}}>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={privacySettings.shareScales}
                onChange={() => setPrivacySettings(prev => ({
                  ...prev,
                  shareScales: !prev.shareScales
                }))}
                className="w-4 h-4"
              />
              <span className="font-[Verdana]">
                Content scales I create can be shared with other users.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={privacySettings.allowResearch}
                onChange={() => setPrivacySettings(prev => ({
                  ...prev,
                  allowResearch: !prev.allowResearch
                }))}
                className="w-4 h-4"
              />
              <span className="font-[Verdana]">
                Data from my project may be used for academic research.
              </span>
            </div>
            <div style = {{marginBottom: '20px', marginTop: '20px'}}>
                <button 
                onClick={handleNotImplemented}
                className="px-4 py-2 bg-white border border-gray-300 rounded"
                >
                Save Privacy Settings
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;