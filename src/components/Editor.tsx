import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onScroll?: (scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => void;
  scrollToPosition?: number;
}

// Use memo to prevent unnecessary re-renders
const Editor = memo(({ content, onChange, onScroll, scrollToPosition }: EditorProps) => {
  const {
    fontSize,
    editorTheme,
    autoSave,
  } = useAppContext();
  
  const [value, setValue] = useState(content);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);
  const previousValueRef = useRef(value);
  
  // Update local state when the prop changes
  useEffect(() => {
    if (content !== value) {
      setValue(content);
    }
  }, [content, value]);
  
  // Handle auto-save functionality with debouncing
  useEffect(() => {
    // Only trigger if value has actually changed
    if (autoSave && value !== content && previousValueRef.current !== value) {
      previousValueRef.current = value;
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 500); // Reduced auto-save delay for better responsiveness
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, value, content, onChange]);

  // Memoized scroll handler for better performance
  const handleScroll = useCallback(() => {
    if (editorRef.current && !isScrolling.current && onScroll) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (editorRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = editorRef.current;
          onScroll({ scrollTop, scrollHeight, clientHeight });
        }
      });
    }
  }, [onScroll]);

  // Add scroll event listener with passive option for better performance
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && onScroll) {
      editor.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (editor && onScroll) {
        editor.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, onScroll]);

  // Handle external scroll requests
  useEffect(() => {
    if (scrollToPosition !== undefined && editorRef.current) {
      isScrolling.current = true;
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.scrollTop = scrollToPosition;
        }
        // Reset the flag after a short delay to avoid scroll loops
        setTimeout(() => {
          isScrolling.current = false;
        }, 50);
      });
    }
  }, [scrollToPosition]);
  
  // Memoized change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);
  
  // Memoized save handler
  const handleSave = useCallback(() => {
    onChange(value);
  }, [onChange, value]);
  
  // Get theme styles based on selected theme - memoized for performance
  const themeStyles = React.useMemo((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontSize: `${fontSize}px`,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      lineHeight: '1.5',
      padding: '1rem',
      resize: 'none',
      height: '100%',
      width: '100%',
      border: 'none',
      outline: 'none',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      caretColor: '#1a73e8',
    };
    
    // Theme-specific styles
    switch (editorTheme) {
      case 'github':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          color: '#24292e',
        };
      
      case 'github-dark':
        return {
          ...baseStyles,
          backgroundColor: '#0d1117',
          color: '#c9d1d9',
        };
      
      case 'atom-one-dark':
        return {
          ...baseStyles,
          backgroundColor: '#282c34',
          color: '#abb2bf',
        };
      
      case 'atom-one-light':
        return {
          ...baseStyles,
          backgroundColor: '#fafafa',
          color: '#383a42',
        };
      
      case 'space-invader':
        return {
          ...baseStyles,
          backgroundColor: '#1a1a2e',
          color: '#16e0bd',
          caretColor: '#ff0055',
        };
      
      case 'dracula':
        return {
          ...baseStyles,
          backgroundColor: '#282a36',
          color: '#f8f8f2',
        };
      
      case 'monokai':
        return {
          ...baseStyles,
          backgroundColor: '#272822',
          color: '#f8f8f2',
        };
      
      case 'nord':
        return {
          ...baseStyles,
          backgroundColor: '#2e3440',
          color: '#d8dee9',
        };
      
      default: // default theme
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          color: '#333333',
        };
    }
  }, [fontSize, editorTheme]);
  
  // Memoized container style
  const containerStyle = React.useMemo((): React.CSSProperties => ({
    height: '100%', 
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  }), []);
  
  // Memoized save button style
  const saveButtonStyle = React.useMemo((): React.CSSProperties => ({
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    opacity: 0.9,
    transform: 'translateY(0)',
    transition: 'opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease',
  }), []);
  
  return (
    <div className="editor-container optimize-gpu" style={containerStyle}>
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        style={themeStyles}
        placeholder="Start writing your markdown here..."
        className="optimize-gpu"
        spellCheck={false}
      />
      
      {!autoSave && (
        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={saveButtonStyle}
          title="Save changes"
        >
          <IconDeviceFloppy size={18} />
          Save
        </button>
      )}
    </div>
  );
});

export default Editor;