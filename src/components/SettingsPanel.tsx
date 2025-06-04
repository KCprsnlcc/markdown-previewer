import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSettings, IconX, IconMoon, IconSun } from '@tabler/icons-react';
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
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;
    
    // Scroll to top when opened
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
    
    // Handle escape key press
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel" ref={panelRef}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button 
            className="editor-action-button" 
            onClick={onClose} 
            aria-label="Close settings"
          >
            <IconX size={20} />
          </button>
        </div>
        
        <div className="settings-section">
          <h3>Theme</h3>
          
          <div className="switch-container">
            <p className="switch-label">Dark Mode</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => {
                  setDarkMode(e.target.checked);
                  showInfo(`Dark mode ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          
          <div className="settings-control">
            <label className="settings-label">Editor Theme</label>
            <select
              value={editorTheme}
              onChange={(e) => {
                setEditorTheme(e.target.value);
                showSuccess(`Editor theme changed to ${e.target.value}`);
              }}
              className="settings-select"
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
          
          <div className="settings-control">
            <label className="settings-label">Preview Theme</label>
            <select
              value={previewTheme}
              onChange={(e) => {
                setPreviewTheme(e.target.value);
                showSuccess(`Preview theme changed to ${e.target.value}`);
              }}
              className="settings-select"
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
        
        <div className="settings-section">
          <h3>Layout</h3>
          
          <div className="switch-container">
            <p className="switch-label">Hide Editor</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={hideEditor}
                onChange={(e) => {
                  setHideEditor(e.target.checked);
                  showInfo(`Editor ${e.target.checked ? 'hidden' : 'visible'}`);
                }}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          
          <div className="switch-container">
            <p className="switch-label">Hide Preview</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={hidePreview}
                onChange={(e) => {
                  setHidePreview(e.target.checked);
                  showInfo(`Preview ${e.target.checked ? 'hidden' : 'visible'}`);
                }}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
          
          <div className="switch-container">
            <p className="switch-label">Hide Sidebar</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={hideSidebar}
                onChange={(e) => {
                  setHideSidebar(e.target.checked);
                  showInfo(`Sidebar ${e.target.checked ? 'hidden' : 'visible'}`);
                }}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Editor</h3>
          
          <div className="settings-control">
            <label className="settings-label">Font Size: {fontSize}px</label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => {
                setFontSize(Number(e.target.value));
                showInfo(`Font size set to ${e.target.value}px`);
              }}
              className="settings-range"
            />
            <div className="range-labels">
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>
          
          <div className="switch-container">
            <p className="switch-label">Auto Save</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => {
                  setAutoSave(e.target.checked);
                  showInfo(`Auto-save ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="settings-footer">
          <button
            onClick={onClose}
            className="settings-btn"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;