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
  
  // Apply editor theme and font size
  const editorStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontFamily: 'monospace',
    lineHeight: '1.5',
    padding: '1rem',
    resize: 'none',
    height: '100%',
    width: '100%',
    border: 'none',
    outline: 'none',
    backgroundColor: editorTheme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: editorTheme === 'dark' ? '#d4d4d4' : '#333333',
  };
  
  return (
    <div className="editor-container" style={{ height: '100%', position: 'relative' }}>
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        style={editorStyle}
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