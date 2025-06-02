import React, { useState, useEffect, useRef } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Previewer from './components/Previewer';
import SettingsPanel from './components/SettingsPanel';
import { IconSettings, IconArrowUp } from '@tabler/icons-react';
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
  
  // States for scroll synchronization
  const [editorScrollPosition, setEditorScrollPosition] = useState<number | undefined>(undefined);
  const [previewScrollPosition, setPreviewScrollPosition] = useState<number | undefined>(undefined);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollSourceRef = useRef<'editor' | 'preview' | null>(null);
  
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
    position: 'relative', // For positioning the scroll to top button
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

  // Handle Editor scroll
  const handleEditorScroll = (scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => {
    if (scrollSourceRef.current === 'preview') return;
    
    scrollSourceRef.current = 'editor';
    
    // Calculate scroll percentage
    const scrollPercentage = scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight);
    
    // Update preview scroll position if preview is visible
    if (!hidePreview) {
      const previewElement = document.querySelector('.previewer-container');
      if (previewElement) {
        const previewScrollHeight = previewElement.scrollHeight;
        const previewClientHeight = previewElement.clientHeight;
        const previewTargetScrollTop = scrollPercentage * (previewScrollHeight - previewClientHeight);
        
        setPreviewScrollPosition(previewTargetScrollTop);
      }
    }
    
    // Show or hide scroll to top button
    setShowScrollToTop(scrollInfo.scrollTop > 300);
    
    // Reset scroll source after a short delay
    setTimeout(() => {
      scrollSourceRef.current = null;
    }, 50);
  };
  
  // Handle Preview scroll
  const handlePreviewScroll = (scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => {
    if (scrollSourceRef.current === 'editor') return;
    
    scrollSourceRef.current = 'preview';
    
    // Calculate scroll percentage
    const scrollPercentage = scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight);
    
    // Update editor scroll position if editor is visible
    if (!hideEditor) {
      const editorElement = document.querySelector('textarea');
      if (editorElement) {
        const editorScrollHeight = editorElement.scrollHeight;
        const editorClientHeight = editorElement.clientHeight;
        const editorTargetScrollTop = scrollPercentage * (editorScrollHeight - editorClientHeight);
        
        setEditorScrollPosition(editorTargetScrollTop);
      }
    }
    
    // Show or hide scroll to top button
    setShowScrollToTop(scrollInfo.scrollTop > 300);
    
    // Reset scroll source after a short delay
    setTimeout(() => {
      scrollSourceRef.current = null;
    }, 50);
  };
  
  // Scroll to top function
  const handleScrollToTop = () => {
    setEditorScrollPosition(0);
    setPreviewScrollPosition(0);
    setShowScrollToTop(false);
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
                    onScroll={handleEditorScroll}
                    scrollToPosition={editorScrollPosition}
                  />
                </div>
              )}
              
              {!hidePreview && (
                <div style={panelStyle}>
                  <Previewer 
                    content={currentDocument.content}
                    onScroll={handlePreviewScroll}
                    scrollToPosition={previewScrollPosition}
                  />
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
              
              {/* Scroll to top button */}
              {showScrollToTop && (
                <button
                  className="scroll-to-top-button"
                  onClick={handleScrollToTop}
                  title="Scroll to top"
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    backgroundColor: darkMode ? '#333' : '#f0f0f0',
                    color: darkMode ? '#e0e0e0' : '#333',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <IconArrowUp size={20} />
                </button>
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
