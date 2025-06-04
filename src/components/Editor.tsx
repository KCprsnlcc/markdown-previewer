import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconDeviceFloppy, IconCode } from '@tabler/icons-react';
import { showSuccess, showError } from '../utils/toast';

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
  const contentRef = useRef(content);
  
  // Update local state ONLY when the content prop changes from outside
  useEffect(() => {
    if (content !== contentRef.current) {
      setValue(content);
      contentRef.current = content;
    }
  }, [content]);
  
  // Handle auto-save functionality with debouncing
  useEffect(() => {
    // Only trigger if value has actually changed
    if (autoSave && value !== contentRef.current && previousValueRef.current !== value) {
      previousValueRef.current = value;
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        onChange(value);
        contentRef.current = value;
      }, 500); // Reduced auto-save delay for better responsiveness
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, value, onChange]);

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
    try {
      onChange(value);
      contentRef.current = value;
      showSuccess('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      showError('Failed to save document. Please try again.');
    }
  }, [onChange, value]);
  
  return (
    <div className="editor-container">
      <div className="editor-header">
        <h3>Editor</h3>
        <div className="editor-actions">
          <button 
            onClick={handleSave}
            className="editor-action-button"
            title="Save document"
          >
            <IconDeviceFloppy size={18} />
          </button>
          <button 
            className="editor-action-button"
            title="Format code"
          >
            <IconCode size={18} />
          </button>
        </div>
      </div>
      
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        className="editor-textarea"
        placeholder="Start typing your markdown here..."
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          lineHeight: '1.6',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        spellCheck={false}
      />
    </div>
  );
});

export default Editor;