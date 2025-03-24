import React, { useState, useEffect } from "react";
import './AccessibilityMenu.css';

const AccessibilityMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [settings, setSettings] = useState({
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReader: false,
        keyboardNavigation: false,
        dislexiaFriendly: false
    });

    useEffect(() => {
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        if (settings.largeText) {
            document.body.classList.add('large-text');
        } else {
            document.body.classList.remove('large-text');
        }

        if(settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }

        if(settings.screenReader) {
            document.body.classList.add('screen-reader');
        } else {
            document.body.classList.remove('screen-reader');
        }

        if(settings.keyboardNavigation) {
            document.body.classList.add('keyboard-navigation');
        } else {
            document.body.classList.remove('keyboard-navigation');
        }

        if(settings.dislexiaFriendly) {
            document.body.classList.add('dislexia-friendly');
        } else {
            document.body.classList.remove('dislexia-friendly');
        }

        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const savedSettings = localStorage.getItem('accessibilitySettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);
    
    const toogleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const updateSettings = (setting) => {
        setSettings({ ...settings, [setting]: !settings[setting] });
    };

    const resetSettings = () => {
        setSettings({
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            screenReader: false,
            keyboardNavigation: false,
            dislexiaFriendly: false
        });
    };

    useEffect(() => {
        if (settings.keyboardNavigation) {
            const handleKeyDown = (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('keyboard-navigation');
                }
            };

            const handleMouseDown = () => {
                document.body.classList.remove('keyboard-navigation');
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('mousedown', handleMouseDown);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('mousedown', handleMouseDown);
            };
        }
        else {
            document.body.classList.remove('keyboard-navigation');
        }
    }, [settings.keyboardNavigation]);

    return (
        <div className={`accessibility-menu ${isMenuOpen ? 'open' : ''}`}>
            <button className="accessibility-menu-toggle" onClick={toogleMenu} aria-label="Accessibility menu" aria-expanded={isMenuOpen}>
                {/* Universal accessibility icon */}
                <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="8" r="1"></circle>
                <path d="M12 12v6"></path>
                <path d="M9 12h6"></path>
                </svg>
            </button>

            {isMenuOpen && (
                <div className="accessibility-menu" role = "dialog" aria-label = "Accessibility options" aria-modal = "true">
                <div className="accessibility-header">
                    <h2>Accessibility Options</h2>
                    <button className="close-button" 
                    onClick={toogleMenu} 
                    aria-label="Close accessibility menu">
                        &times
                    </button>
                </div>

                <div className="accessibility-options">
                    <div className="option">
                    <input
                        type="checkbox"
                        id="highContrast"
                        checked={settings.highContrast}
                        onChange={() => updateSetting('highContrast')}
                    />
                    <label htmlFor="highContrast">High Contrast Mode</label>
                </div>

                <div className="option">
                <input
                    type="checkbox"
                    id="largerText"
                    checked={settings.largerText}
                    onChange={() => updateSetting('largerText')}
                />
                <label htmlFor="largerText">Larger Text</label>
                </div>

                <div className="option">
                <input
                    type="checkbox"
                    id="reducedMotion"
                    checked={settings.reducedMotion}
                    onChange={() => updateSetting('reducedMotion')}
                />
                <label htmlFor="reducedMotion">Reduced Motion</label>
                </div>

                <div className="option">
                <input
                    type="checkbox"
                    id="dyslexiaFont"
                    checked={settings.dyslexiaFont}
                    onChange={() => updateSetting('dyslexiaFont')}
                />
                <label htmlFor="dyslexiaFont">Dyslexia-Friendly Font</label>
                </div>

                <div className="option">
                <input
                    type="checkbox"
                    id="keyboardNavigation"
                    checked={settings.keyboardNavigation}
                    onChange={() => updateSetting('keyboardNavigation')}
                />
                <label htmlFor="keyboardNavigation">Enhanced Keyboard Navigation</label>
                </div>

                <div className="option">
                <input
                    type="checkbox"
                    id="screenReader"
                    checked={settings.screenReader}
                    onChange={() => updateSetting('screenReader')}
                />
                <label htmlFor="screenReader">Screen Reader Optimization</label>
                </div>
            </div>

            <button 
                className="reset-button"
                onClick={resetSettings}
                aria-label="Reset all accessibility settings"
            >
                Reset All Settings
            </button>
            </div>
        )}
        </div>
  );
};

export default AccessibilityMenu;