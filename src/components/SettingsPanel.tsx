import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSettings, IconX } from '@tabler/icons-react';
import { showSuccess, showInfo } from '../utils/toast';

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
    hideEditor,
    hidePreview,
    hideSidebar,
    setEditorTheme,
    setPreviewTheme,
    setFontSize,
    setAutoSave,
    setDarkMode,
    setHideEditor,
    setHidePreview,
    setHideSidebar,
  } = useAppContext();
  
  if (!isOpen) return null;
  
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    maxWidth: '90%',
    backgroundColor: darkMode ? 'var(--bg-dark)' : 'var(--bg-light)',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-lg)',
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
    borderBottom: darkMode ? `1px solid var(--border-color-dark)` : `1px solid var(--border-color)`,
    paddingBottom: '1rem',
  };
  
  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  };
  
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
  };
  
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '8px',
    border: darkMode ? `1px solid var(--border-color-dark)` : `1px solid var(--border-color)`,
    backgroundColor: darkMode ? 'var(--input-bg-dark)' : 'var(--input-bg-light)',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
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
    backgroundColor: checked ? 'var(--primary-color)' : darkMode ? 'var(--border-color-dark)' : 'var(--border-color)',
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
                onChange={(e) => {
                  setDarkMode(e.target.checked);
                  showInfo(`Dark mode ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
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
              onChange={(e) => {
                setEditorTheme(e.target.value);
                showSuccess(`Editor theme changed to ${e.target.value}`);
              }}
              style={selectStyle}
            >
              <option value="default">Default</option>
              <option value="github">GitHub</option>
              <option value="github-dark">GitHub Dark</option>
              <option value="atom-one-dark">Atom One Dark</option>
              <option value="atom-one-light">Atom One Light</option>
              <option value="space-invader">Space Invader</option>
              <option value="dracula">Dracula</option>
              <option value="monokai">Monokai</option>
              <option value="nord">Nord</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Preview Theme
            </label>
            <select
              value={previewTheme}
              onChange={(e) => {
                setPreviewTheme(e.target.value);
                showSuccess(`Preview theme changed to ${e.target.value}`);
              }}
              style={selectStyle}
            >
              <option value="default">Default</option>
              <option value="github">GitHub</option>
              <option value="github-dark">GitHub Dark</option>
              <option value="atom-one-dark">Atom One Dark</option>
              <option value="atom-one-light">Atom One Light</option>
              <option value="space-invader">Space Invader</option>
              <option value="documentation">Documentation</option>
              <option value="minimal">Minimal</option>
              <option value="sepia">Sepia</option>
            </select>
          </div>
        </div>
        
        <div style={sectionStyle}>
          <h3>Layout</h3>
          
          <div style={switchContainerStyle}>
            <p style={switchLabelStyle}>Hide Editor</p>
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={hideEditor}
                onChange={(e) => {
                  setHideEditor(e.target.checked);
                  showInfo(`Editor ${e.target.checked ? 'hidden' : 'visible'}`);
                }}
                style={switchInputStyle}
              />
              <span style={sliderStyle(hideEditor)}>
                <span style={sliderKnobStyle(hideEditor)}></span>
              </span>
            </label>
          </div>
          
          <div style={switchContainerStyle}>
            <p style={switchLabelStyle}>Hide Preview</p>
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={hidePreview}
                onChange={(e) => {
                  setHidePreview(e.target.checked);
                  showInfo(`Preview ${e.target.checked ? 'hidden' : 'visible'}`);
                }}
                style={switchInputStyle}
              />
              <span style={sliderStyle(hidePreview)}>
                <span style={sliderKnobStyle(hidePreview)}></span>
              </span>
            </label>
          </div>
          
          <div style={switchContainerStyle}>
            <p style={switchLabelStyle}>Hide Sidebar</p>
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={hideSidebar}
                onChange={(e) => {
                  setHideSidebar(e.target.checked);
                  showInfo(`Sidebar ${e.target.checked ? 'hidden' : 'visible'}`);
                }}
                style={switchInputStyle}
              />
              <span style={sliderStyle(hideSidebar)}>
                <span style={sliderKnobStyle(hideSidebar)}></span>
              </span>
            </label>
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
              onChange={(e) => {
                setFontSize(Number(e.target.value));
                showInfo(`Font size set to ${e.target.value}px`);
              }}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={switchContainerStyle}>
            <p style={switchLabelStyle}>Auto Save</p>
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => {
                  setAutoSave(e.target.checked);
                  showInfo(`Auto-save ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
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
              backgroundColor: 'var(--primary-color)',
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