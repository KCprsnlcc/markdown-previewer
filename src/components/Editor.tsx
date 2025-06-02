import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, onChange }) => {
  const {
    fontSize,
    editorTheme,
    autoSave,
  } = useAppContext();
  
  const [value, setValue] = useState(content);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when the prop changes
  useEffect(() => {
    setValue(content);
  }, [content]);
  
  // Handle auto-save functionality
  useEffect(() => {
    if (autoSave && value !== content) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 1000); // Auto-save after 1 second of inactivity
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, value, content, onChange]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    
    // If auto-save is disabled, don't trigger onChange
    if (!autoSave) return;
  };
  
  const handleSave = () => {
    onChange(value);
  };
  
  // Get theme styles based on selected theme
  const getThemeStyles = (): React.CSSProperties => {
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
  };
  
  return (
    <div className="editor-container" style={{ height: '100%', position: 'relative' }}>
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        style={getThemeStyles()}
        placeholder="Start writing your markdown here..."
      />
      
      {!autoSave && (
        <button
          onClick={handleSave}
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            padding: '0.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <IconDeviceFloppy size={16} />
          Save
        </button>
      )}
    </div>
  );
};

export default Editor;