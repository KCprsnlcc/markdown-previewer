import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Previewer from './components/Previewer';
import SettingsPanel from './components/SettingsPanel';
import Logo from './components/Logo';
import Auth from './components/Auth';
import { IconSettings, IconArrowUp, IconLogout } from '@tabler/icons-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="App">
          <AuthContent />
          <ToastContainer theme="colored" />
        </div>
      </AppProvider>
    </AuthProvider>
  );
};

const AuthContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--bg-light)'
      }}>
        <div style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-light)' 
        }}>
          Loading...
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Auth />;
  }
  
  return (
    <AppContent 
      settingsPanelOpen={settingsPanelOpen}
      setSettingsPanelOpen={setSettingsPanelOpen}
    />
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
  
  const { signOut } = useAuth();
  
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
    justifyContent: 'space-between',
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
      const scrollPercentage = scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight || 1);
      
      // Update preview scroll position if preview is visible
      if (!hidePreview) {
        const previewContent = document.querySelector('.previewer-content');
        if (previewContent) {
          const previewScrollHeight = previewContent.scrollHeight;
          const previewClientHeight = previewContent.clientHeight;
          const previewTargetScrollTop = scrollPercentage * (previewScrollHeight - previewClientHeight || 1);
          
          setPreviewScrollPosition(previewTargetScrollTop);
        }
      }
      
      // Show or hide scroll to top button
      setShowScrollToTop(scrollInfo.scrollTop > 300);
    });
    
    // Reset scroll source after a short delay
    setTimeout(() => {
      scrollSourceRef.current = null;
    }, 100);
  }, [hidePreview, debounceScroll]);
  
  // Optimized Preview scroll handler
  const handlePreviewScroll = useCallback((scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => {
    if (scrollSourceRef.current === 'editor') return;
    
    scrollSourceRef.current = 'preview';
    
    debounceScroll(() => {
      // Calculate scroll percentage
      const scrollPercentage = scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight || 1);
      
      // Update editor scroll position if editor is visible
      if (!hideEditor) {
        const editorTextArea = document.querySelector('.editor-textarea');
        if (editorTextArea) {
          const editorScrollHeight = editorTextArea.scrollHeight;
          const editorClientHeight = editorTextArea.clientHeight;
          const editorTargetScrollTop = scrollPercentage * (editorScrollHeight - editorClientHeight || 1);
          
          setEditorScrollPosition(editorTargetScrollTop);
        }
      }
      
      // Show or hide scroll to top button
      setShowScrollToTop(scrollInfo.scrollTop > 300);
    });
    
    // Reset scroll source after a short delay
    setTimeout(() => {
      scrollSourceRef.current = null;
    }, 100);
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
      {!hideSidebar && <div className="sidebar-enter"><Sidebar /></div>}
      
      <div style={mainContainerStyle}>
        <div style={toolbarStyle} className="flex items-center justify-between">
          <Logo size="medium" />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => signOut()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
                cursor: 'pointer'
              }}
            >
              <IconLogout size={18} />
              Sign Out
            </button>
            <button
              onClick={() => setSettingsPanelOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <IconSettings size={18} />
              Settings
            </button>
          </div>
        </div>
        
        <div style={contentContainerStyle}>
          {currentDocument ? (
            <div className="split-view">
              {!hideEditor && (
                <div className="editor-panel optimize-gpu editor-enter">
                  <Editor 
                    content={currentDocument.content} 
                    onChange={handleDocumentChange}
                    onScroll={handleEditorScroll}
                    scrollToPosition={editorScrollPosition}
                  />
                </div>
              )}
              
              {!hidePreview && (
                <div className="preview-panel optimize-gpu preview-enter">
                  <Previewer 
                    content={currentDocument.content}
                    onScroll={handlePreviewScroll}
                    scrollToPosition={previewScrollPosition}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bounce-in" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <Logo size="large" />
              <h2 style={{ marginBottom: '1rem', marginTop: '1.5rem' }} className="slide-in">Welcome to MarkDown</h2>
              <p className="slide-in" style={{ animationDelay: '0.1s' }}>Create a new document or select an existing one from the sidebar to get started.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings panel */}
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
