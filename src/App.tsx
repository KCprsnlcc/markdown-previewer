import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Previewer from './components/Previewer';
import SettingsPanel from './components/SettingsPanel';
import { IconSettings } from '@tabler/icons-react';
import './App.css';

const App: React.FC = () => {
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  
  console.log('App rendering');
  
  return (
    <AppProvider>
      <div className="App">
        <AppContent 
          settingsPanelOpen={settingsPanelOpen}
          setSettingsPanelOpen={setSettingsPanelOpen}
        />
      </div>
    </AppProvider>
  );
};

interface AppContentProps {
  settingsPanelOpen: boolean;
  setSettingsPanelOpen: (open: boolean) => void;
}

const AppContent: React.FC<AppContentProps> = ({ 
  settingsPanelOpen, 
  setSettingsPanelOpen 
}) => {
  const {
    currentDocument,
    updateCurrentDocument,
    darkMode,
    hideEditor,
    hidePreview,
    hideSidebar
  } = require('./context/AppContext').useAppContext();
  
  console.log('AppContent rendering');
  console.log('Current document:', currentDocument);
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: darkMode ? '#121212' : '#f8f9fa',
    color: darkMode ? '#e0e0e0' : '#333',
  };
  
  const mainContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
  
  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0.5rem 1rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: darkMode ? '#1a1a1a' : '#fff',
  };
  
  const contentContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  };
  
  const panelStyle: React.CSSProperties = {
    flex: 1,
    height: '100%',
    overflow: 'auto',
    borderRight: '1px solid #e0e0e0',
  };
  
  const handleDocumentChange = (content: string) => {
    if (currentDocument) {
      updateCurrentDocument(content);
    }
  };
  
  return (
    <div style={containerStyle}>
      {!hideSidebar && <Sidebar />}
      
      <div style={mainContainerStyle}>
        <div style={toolbarStyle}>
          <button
            onClick={() => setSettingsPanelOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: darkMode ? '#333' : '#f0f0f0',
              color: darkMode ? '#e0e0e0' : '#333',
              cursor: 'pointer',
            }}
          >
            <IconSettings size={18} />
            Settings
          </button>
        </div>
        
        <div style={contentContainerStyle}>
          {currentDocument ? (
            <>
              {!hideEditor && (
                <div style={panelStyle}>
                  <Editor 
                    content={currentDocument.content} 
                    onChange={handleDocumentChange} 
                  />
                </div>
              )}
              
              {!hidePreview && (
                <div style={panelStyle}>
                  <Previewer content={currentDocument.content} />
                </div>
              )}
              
              {hideEditor && hidePreview && (
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flex: 1,
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '2rem',
                    textAlign: 'center',
                  }}
                >
                  <h2>Both Editor and Preview are hidden</h2>
                  <p>Open the settings panel to show at least one component.</p>
                </div>
              )}
            </>
          ) : (
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flex: 1,
                flexDirection: 'column',
                gap: '1rem',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <h2>No Document Selected</h2>
              <p>Select a document from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      </div>
      
      <SettingsPanel 
        isOpen={settingsPanelOpen} 
        onClose={() => setSettingsPanelOpen(false)} 
      />
    </div>
  );
};

export default App;
