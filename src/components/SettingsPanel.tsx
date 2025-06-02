import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSettings, IconX } from '@tabler/icons-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    editorTheme,
    previewTheme,
    fontSize,
    autoSave,
    darkMode,
    setEditorTheme,
    setPreviewTheme,
    setFontSize,
    setAutoSave,
    setDarkMode,
  } = useAppContext();
  
  if (!isOpen) return null;
  
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    maxWidth: '90%',
    backgroundColor: darkMode ? '#333' : '#fff',
    color: darkMode ? '#fff' : '#333',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    padding: '1.5rem',
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  };
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: darkMode ? '1px solid #555' : '1px solid #eee',
    paddingBottom: '1rem',
  };
  
  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  };
  
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: darkMode ? '#aaa' : '#666',
  };
  
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: darkMode ? '1px solid #555' : '1px solid #ccc',
    backgroundColor: darkMode ? '#444' : '#fff',
    color: darkMode ? '#fff' : '#333',
  };
  
  const switchContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  };
  
  const switchLabelStyle: React.CSSProperties = {
    margin: 0,
  };
  
  const switchStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '22px',
  };
  
  const switchInputStyle: React.CSSProperties = {
    opacity: 0,
    width: 0,
    height: 0,
  };
  
  const sliderStyle = (checked: boolean): React.CSSProperties => ({
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? '#4caf50' : darkMode ? '#555' : '#ccc',
    borderRadius: '22px',
    transition: '0.4s',
  });
  
  const sliderKnobStyle = (checked: boolean): React.CSSProperties => ({
    position: 'absolute',
    height: '18px',
    width: '18px',
    left: checked ? '22px' : '2px',
    bottom: '2px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: '0.4s',
  });
  
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <button style={buttonStyle} onClick={onClose}>
            <IconX size={24} />
          </button>
        </div>
        
        <div style={sectionStyle}>
          <h3>Theme</h3>
          
          <div style={switchContainerStyle}>
            <p style={switchLabelStyle}>Dark Mode</p>
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                style={switchInputStyle}
              />
              <span style={sliderStyle(darkMode)}>
                <span style={sliderKnobStyle(darkMode)}></span>
              </span>
            </label>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Editor Theme
            </label>
            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value)}
              style={selectStyle}
            >
              <option value="default">Default</option>
              <option value="github">GitHub</option>
              <option value="dark">Dark</option>
              <option value="monokai">Monokai</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Preview Theme
            </label>
            <select
              value={previewTheme}
              onChange={(e) => setPreviewTheme(e.target.value)}
              style={selectStyle}
            >
              <option value="default">Default</option>
              <option value="github">GitHub</option>
              <option value="documentation">Documentation</option>
              <option value="minimal">Minimal</option>
              <option value="sepia">Sepia</option>
            </select>
          </div>
        </div>
        
        <div style={sectionStyle}>
          <h3>Editor</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={switchContainerStyle}>
            <p style={switchLabelStyle}>Auto Save</p>
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                style={switchInputStyle}
              />
              <span style={sliderStyle(autoSave)}>
                <span style={sliderKnobStyle(autoSave)}></span>
              </span>
            </label>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;