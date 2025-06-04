import React, { useState, useEffect, useRef, useCallback, memo, createContext } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Previewer from './components/Previewer';
import SettingsPanel from './components/SettingsPanel';
import Logo from './components/Logo';
import Auth from './components/Auth';
import { IconSettings, IconArrowUp, IconLogout, IconMenu2, IconPlus } from '@tabler/icons-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { showError } from './utils/toast';

// Create MobileSidebarContext and export it
export const MobileSidebarContext = createContext<{
  setShowMobileSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
}>({});

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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
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
  const handleDocumentChange = useCallback(async (content: string) => {
    if (currentDocument) {
      try {
        await updateCurrentDocument(content);
      } catch (error) {
        console.error('Error updating document:', error);
        showError('Failed to update document. Please try again.');
      }
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
    <MobileSidebarContext.Provider value={{ setShowMobileSidebar }}>
      <div style={containerStyle} className="optimize-gpu">
        {!hideSidebar && (
          <div className={`sidebar-enter ${showMobileSidebar ? 'show-mobile' : ''}`}>
            <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)}></div>
            <Sidebar />
          </div>
        )}
        
        <div style={mainContainerStyle}>
          <div className="app-header">
            <div className="header-left">
              <button 
                className="toolbar-mobile-toggle"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                aria-label="Toggle sidebar"
              >
                <div className={`hamburger-icon ${showMobileSidebar ? 'open' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
              <Logo size="medium" />
            </div>
            <div className="header-actions">
              <button
                onClick={() => signOut()}
                className="header-icon-button signout-button-desktop"
                aria-label="Sign Out"
                title="Sign Out"
              >
                <IconLogout size={20} stroke={1.5} />
                <span className="header-button-text">Sign Out</span>
              </button>
              <button
                onClick={() => setSettingsPanelOpen(true)}
                className="header-icon-button settings-button-desktop"
                aria-label="Settings"
                title="Settings"
              >
                <IconSettings size={20} stroke={1.5} />
                <span className="header-button-text">Settings</span>
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
                padding: '3rem',
                textAlign: 'center',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                <h2 style={{ 
                  marginBottom: '1rem', 
                  marginTop: '0',
                  fontSize: '2.5rem',
                  fontWeight: 600,
                  background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color, #7c4dff))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }} className="slide-in">Get Started</h2>
                <p className="slide-in" style={{ 
                  animationDelay: '0.1s',
                  fontSize: '1.2rem',
                  lineHeight: '1.7',
                  opacity: 0.9,
                  maxWidth: '550px',
                  marginBottom: '3rem'
                }}>
                  Create a new document or select an existing one from the sidebar to begin your markdown journey.
                </p>
                <div className="slide-in" style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  animationDelay: '0.2s',
                  marginTop: '0.5rem' 
                }}>
                  <button 
                    onClick={() => {
                      const sidebar = document.querySelector('.sidebar');
                      if (sidebar) {
                        const newButton = sidebar.querySelector('button[aria-label="New Document"]');
                        if (newButton) {
                          (newButton as HTMLButtonElement).click();
                        }
                      }
                    }}
                    style={{
                      padding: '0.85rem 2rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-color)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontWeight: 500,
                      fontSize: '1.1rem',
                      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <IconPlus size={20} />
                    <span>New Document</span>
                  </button>
                </div>
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
    </MobileSidebarContext.Provider>
  );
});

export default App;
