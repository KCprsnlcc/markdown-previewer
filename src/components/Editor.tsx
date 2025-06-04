import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconDeviceFloppy, IconCode, IconSearch, IconX } from '@tabler/icons-react';
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
    autoSave,
  } = useAppContext();
  
  const [value, setValue] = useState(content);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<{ count: number, currentIndex: number }>({ count: 0, currentIndex: -1 });
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  
  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
  // Perform search when search text changes
  useEffect(() => {
    if (!showSearch || !searchText || !editorRef.current) {
      setSearchResults({ count: 0, currentIndex: -1 });
      return;
    }
    
    // Count occurrences of the search text in the content
    const regex = new RegExp(escapeRegExp(searchText), 'gi');
    const matches = value.match(regex);
    const count = matches ? matches.length : 0;
    
    setSearchResults({
      count,
      currentIndex: count > 0 ? 0 : -1
    });
    
    // Remove the automatic editor focus
    // if (count > 0) {
    //   editorRef.current.focus();
    // }
  }, [searchText, value, showSearch]);
  
  // Helper function to escape special characters in regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
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

  // Highlight a specific match in the editor
  const highlightMatch = (index: number) => {
    if (!editorRef.current || !searchText || searchResults.count === 0) return;
    
    // Ensure the editor has focus to prevent affecting other components
    editorRef.current.focus();
    
    const regex = new RegExp(escapeRegExp(searchText), 'gi');
    let i = 0;
    let match;
    
    // Find the position of the specified match
    while ((match = regex.exec(value)) !== null) {
      if (i === index) {
        const matchStart = match.index;
        const matchEnd = matchStart + searchText.length;
        
        // Set selection to the match
        editorRef.current.setSelectionRange(matchStart, matchEnd);
        
        // Calculate scroll position to ensure the match is visible
        const textBeforeMatch = value.substring(0, matchStart);
        const lineCount = (textBeforeMatch.match(/\n/g) || []).length;
        const lineHeight = parseInt(getComputedStyle(editorRef.current).lineHeight);
        const approxScrollPosition = lineHeight * lineCount;
        
        // Scroll to the position with smooth behavior for better UX
        editorRef.current.scrollTop = approxScrollPosition - editorRef.current.clientHeight / 3;
        
        break;
      }
      i++;
    }
  };
  
  // Navigate to the next search result
  const goToNextMatch = () => {
    if (searchResults.count === 0 || !editorRef.current) return;
    
    // Ensure the editor has focus
    editorRef.current.focus();
    
    const nextIndex = (searchResults.currentIndex + 1) % searchResults.count;
    setSearchResults({ ...searchResults, currentIndex: nextIndex });
    highlightMatch(nextIndex);
  };
  
  // Navigate to the previous search result
  const goToPrevMatch = () => {
    if (searchResults.count === 0 || !editorRef.current) return;
    
    // Ensure the editor has focus
    editorRef.current.focus();
    
    const prevIndex = (searchResults.currentIndex - 1 + searchResults.count) % searchResults.count;
    setSearchResults({ ...searchResults, currentIndex: prevIndex });
    highlightMatch(prevIndex);
  };
  
  // Toggle the search interface
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchText('');
      setSearchResults({ count: 0, currentIndex: -1 });
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  // Close search interface
  const closeSearch = () => {
    setShowSearch(false);
    setSearchText('');
    setSearchResults({ count: 0, currentIndex: -1 });
  };
  
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
            onClick={toggleSearch}
            className="editor-action-button"
            title="Search in editor"
          >
            <IconSearch size={18} />
          </button>
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
      
      {showSearch && (
        <div className="search-bar">
          <div className="search-input-container">
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Search in editor..."
              className="search-input"
            />
            {searchText && searchResults.count > 0 && (
              <div className="search-counter">
                {searchResults.currentIndex + 1} of {searchResults.count}
              </div>
            )}
          </div>
          <div className="search-actions">
            <button 
              onClick={goToPrevMatch}
              disabled={searchResults.count === 0}
              className="search-nav-button"
              title="Previous match"
            >
              ↑
            </button>
            <button 
              onClick={goToNextMatch}
              disabled={searchResults.count === 0}
              className="search-nav-button"
              title="Next match"
            >
              ↓
            </button>
            <button 
              onClick={closeSearch}
              className="search-close-button"
              title="Close search"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}
      
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