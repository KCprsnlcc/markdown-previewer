import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Previewer from './components/Previewer';
import SettingsPanel from './components/SettingsPanel';
import { IconSettings, IconArrowUp } from '@tabler/icons-react';
import './App.css';

const App: React.FC = () => {
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  
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

// Use memo to prevent unnecessary re-renders
const AppContent = memo(({ 
  settingsPanelOpen, 
  setSettingsPanelOpen 
}: AppContentProps) => {
  const {
    currentDocument,
    updateCurrentDocument,
    darkMode,
    hideEditor,
    hidePreview,
    hideSidebar
  } = require('./context/AppContext').useAppContext();
  
  // States for scroll synchronization
  const [editorScrollPosition, setEditorScrollPosition] = useState<number | undefined>(undefined);
  const [previewScrollPosition, setPreviewScrollPosition] = useState<number | undefined>(undefined);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollSourceRef = useRef<'editor' | 'preview' | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoize styles to prevent recalculations on every render
  const containerStyle = React.useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: darkMode ? '#121212' : '#f8f9fa',
    color: darkMode ? '#e0e0e0' : '#333',
  }), [darkMode]);
  
  const mainContainerStyle = React.useMemo<React.CSSProperties>(() => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }), []);
  
  const toolbarStyle = React.useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0.5rem 1rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: darkMode ? '#1a1a1a' : '#fff',
  }), [darkMode]);
  
  const contentContainerStyle = React.useMemo<React.CSSProperties>(() => ({
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  }), []);
  
  const panelStyle = React.useMemo<React.CSSProperties>(() => ({
    flex: 1,
    height: '100%',
    overflow: 'auto',
    borderRight: '1px solid #e0e0e0',
  }), []);
  
  // Memoize document change handler
  const handleDocumentChange = useCallback((content: string) => {
    if (currentDocument) {
      updateCurrentDocument(content);
    }
  }, [currentDocument, updateCurrentDocument]);

  // Debounce scroll events for better performance
  const debounceScroll = useCallback((callback: () => void, delay: number = 10) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, []);

  // Optimized Editor scroll handler
  const handleEditorScroll = useCallback((scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => {
    if (scrollSourceRef.current === 'preview') return;
    
    scrollSourceRef.current = 'editor';
    
    debounceScroll(() => {
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
    });
    
    // Reset scroll source after a short delay
    setTimeout(() => {
      scrollSourceRef.current = null;
    }, 50);
  }, [hidePreview, debounceScroll]);
  
  // Optimized Preview scroll handler
  const handlePreviewScroll = useCallback((scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => {
    if (scrollSourceRef.current === 'editor') return;
    
    scrollSourceRef.current = 'preview';
    
    debounceScroll(() => {
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
    });
    
    // Reset scroll source after a short delay
    setTimeout(() => {
      scrollSourceRef.current = null;
    }, 50);
  }, [hideEditor, debounceScroll]);
  
  // Memoized scroll to top function
  const handleScrollToTop = useCallback(() => {
    setEditorScrollPosition(0);
    setPreviewScrollPosition(0);
    setShowScrollToTop(false);
  }, []);
  
  // Clean up timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div style={containerStyle} className="optimize-gpu">
      {!hideSidebar && <Sidebar />}
      
      <div style={mainContainerStyle}>
        <div style={toolbarStyle}>
          <button
            onClick={() => setSettingsPanelOpen(true)}
            className="btn btn-secondary"
          >
            <IconSettings size={18} />
            Settings
          </button>
        </div>
        
        <div style={contentContainerStyle}>
          {currentDocument ? (
            <>
              {!hideEditor && (
                <div style={panelStyle} className="optimize-gpu">
                  <Editor 
                    content={currentDocument.content} 
                    onChange={handleDocumentChange}
                    onScroll={handleEditorScroll}
                    scrollToPosition={editorScrollPosition}
                  />
                </div>
              )}
              
              {!hidePreview && (
                <div style={panelStyle} className="optimize-gpu">
                  <Previewer 
                    content={currentDocument.content}
                    onScroll={handlePreviewScroll}
                    scrollToPosition={previewScrollPosition}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <h2 style={{ marginBottom: '1rem' }}>Welcome to Markdown Previewer</h2>
              <p>Create a new document or select an existing one from the sidebar to get started.</p>
            </div>
          )}
        </div>
      </div>
      
      {settingsPanelOpen && (
        <SettingsPanel isOpen={settingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} />
      )}
      
      {showScrollToTop && (
        <button 
          onClick={handleScrollToTop}
          className={`scroll-to-top-button visible`}
          aria-label="Scroll to top"
        >
          <IconArrowUp size={20} />
        </button>
      )}
    </div>
  );
});

export default App;
