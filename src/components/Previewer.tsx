import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useAppContext } from '../context/AppContext';
import { IconDownload, IconSearch, IconX } from '@tabler/icons-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';

// Add this declaration at the top of the file, after imports
declare global {
  interface Window {
    find: (
      searchString: string,
      caseSensitive?: boolean,
      backwards?: boolean,
      wrapAround?: boolean,
      wholeWord?: boolean,
      searchInFrames?: boolean,
      showDialog?: boolean
    ) => boolean;
  }
}

interface PreviewerProps {
  content: string;
  onScroll?: (scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => void;
  scrollToPosition?: number;
}

// Use memo to prevent unnecessary re-renders
const Previewer = memo(({ content, onScroll, scrollToPosition }: PreviewerProps) => {
  const {
    fontSize,
  } = useAppContext();
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<{ count: number, currentIndex: number }>({ count: 0, currentIndex: -1 });

  const previewerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isScrolling = useRef(false);
  const contentRef = useRef(content);
  const matchesRef = useRef<HTMLElement[]>([]);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
  // Apply syntax highlighting after rendering
  useEffect(() => {
    if (contentRef.current !== content) {
      contentRef.current = content;
      
      // Use requestIdleCallback for better performance (or setTimeout as fallback)
      const highlightCode = () => {
        if (previewerRef.current && previewerRef.current.querySelectorAll('pre code').length > 0) {
          Prism.highlightAllUnder(previewerRef.current);
        }
      };
      
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(highlightCode, { timeout: 300 });
      } else {
        setTimeout(highlightCode, 100);
      }
    }
  }, [content]);

  // Update search results after the preview content has been rendered
  useEffect(() => {
    if (!showSearch || !searchText || !previewerRef.current) {
      return;
    }

    // Use a short delay to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      try {
        // Don't focus the preview container when updating search results
        // This was causing the search input to lose focus
        // previewerRef.current?.focus();
        
        // Count word occurrences in plain text (case insensitive)
        const plainText = previewerRef.current?.textContent || '';
        const regex = new RegExp(escapeRegExp(searchText), 'gi');
        const occurrences = (plainText.match(regex) || []).length;
        
        setSearchResults({
          count: occurrences,
          currentIndex: occurrences > 0 ? 0 : -1
        });
        
        // Prepare for navigation
        if (occurrences > 0) {
          // Clear any existing selection
          if (window.getSelection) {
            const selection = window.getSelection();
            if (selection) selection.removeAllRanges();
          }
          
          // Find the first match but don't scroll yet (wait for user navigation)
          // This prevents auto-scrolling on every keystroke
          collectMatchingNodes(searchText);
        }
      } catch (error) {
        console.error("Error processing search:", error);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchText, showSearch, content]);
  
  // Helper function to escape special characters in regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Collect all matching nodes without affecting other components
  const collectMatchingNodes = (text: string) => {
    if (!previewerRef.current || !text) return [];
    
    // Get all text nodes within the preview container only
    const textNodes: Node[] = [];
    const findTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        textNodes.push(node);
      } else {
        node.childNodes.forEach(child => findTextNodes(child));
      }
    };
    
    findTextNodes(previewerRef.current);
    
    // Find nodes containing the search text
    const matchingNodes: {node: Node, index: number}[] = [];
    
    textNodes.forEach(node => {
      const content = node.textContent || '';
      let index = content.toLowerCase().indexOf(text.toLowerCase());
      while (index !== -1) {
        matchingNodes.push({node, index});
        index = content.toLowerCase().indexOf(text.toLowerCase(), index + 1);
      }
    });
    
    // Store matching nodes for navigation
    matchesRef.current = matchingNodes.map(match => {
      const element = match.node.parentElement as HTMLElement;
      return element;
    }).filter(Boolean);
    
    return matchingNodes;
  };
  
  // Use browser's native find functionality to navigate between matches
  const scrollToNextMatch = () => {
    if (!searchText || searchResults.count === 0 || !previewerRef.current) return;
    
    // Focus the preview container when user navigates results
    previewerRef.current.focus();
    
    // Calculate new index
    const nextIndex = (searchResults.currentIndex + 1) % searchResults.count;
    setSearchResults(prev => ({ ...prev, currentIndex: nextIndex }));
    
    try {
      // Use our custom search method that's constrained to the preview container
      highlightTextInPreview(searchText, nextIndex);
    } catch (error) {
      console.error("Error navigating to next match:", error);
    }
  };
  
  const scrollToPrevMatch = () => {
    if (!searchText || searchResults.count === 0 || !previewerRef.current) return;
    
    // Focus the preview container when user navigates results
    previewerRef.current.focus();
    
    // Calculate new index
    const prevIndex = (searchResults.currentIndex - 1 + searchResults.count) % searchResults.count;
    setSearchResults(prev => ({ ...prev, currentIndex: prevIndex }));
    
    try {
      // Use our custom search method that's constrained to the preview container
      highlightTextInPreview(searchText, prevIndex);
    } catch (error) {
      console.error("Error navigating to previous match:", error);
    }
  };
  
  // Method to find and scroll to text within the preview container only
  const highlightTextInPreview = (text: string, targetIndex: number) => {
    if (!previewerRef.current || !text) return;
    
    // Find all matching nodes
    const matchingNodes = collectMatchingNodes(text);
    
    if (matchingNodes.length === 0) return;
    
    // Ensure target index is valid
    if (targetIndex < 0 || targetIndex >= matchingNodes.length) {
      targetIndex = 0;
    }
    
    // Get the target match
    const targetMatch = matchingNodes[targetIndex];
    
    if (targetMatch) {
      // Create a selection on this text
      const range = document.createRange();
      range.setStart(targetMatch.node, targetMatch.index);
      range.setEnd(targetMatch.node, targetMatch.index + text.length);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Scroll the matched text into view
      if (targetMatch.node.parentElement) {
        targetMatch.node.parentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
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
    // Clear any selection
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection) selection.removeAllRanges();
    }
  };
  
  // Optimized scroll handler with requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (previewerRef.current && !isScrolling.current && onScroll) {
      requestAnimationFrame(() => {
        if (previewerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = previewerRef.current;
          onScroll({ scrollTop, scrollHeight, clientHeight });
        }
      });
    }
  }, [onScroll]);

  // Add scroll event listener with passive option for performance
  useEffect(() => {
    const previewer = previewerRef.current;
    if (previewer && onScroll) {
      previewer.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (previewer && onScroll) {
        previewer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, onScroll]);

  // Handle external scroll requests with requestAnimationFrame
  useEffect(() => {
    if (scrollToPosition !== undefined && previewerRef.current) {
      isScrolling.current = true;
      
      requestAnimationFrame(() => {
        if (previewerRef.current) {
          previewerRef.current.scrollTop = scrollToPosition;
        }
        
        // Reset the flag after a short delay to avoid scroll loops
        setTimeout(() => {
          isScrolling.current = false;
        }, 50);
      });
    }
  }, [scrollToPosition]);
  
  // Export markdown as HTML
  const exportAsHTML = () => {
    try {
      // Create a blob with the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Markdown Export</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              color: #333;
            }
            pre {
              background: #f5f5f5;
              padding: 1rem;
              border-radius: 4px;
              overflow: auto;
            }
            code {
              font-family: monospace;
              background: #f5f5f5;
              padding: 0.2em 0.4em;
              border-radius: 3px;
            }
            blockquote {
              border-left: 4px solid #ddd;
              padding-left: 1rem;
              margin-left: 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${previewerRef.current?.innerHTML || ''}
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = 'markdown_export.html';
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting HTML:', error);
    }
  };
  
  return (
    <div className="previewer-container">
      <div className="previewer-header">
        <h3>Preview</h3>
        <div className="editor-actions">
          <button
            onClick={toggleSearch}
            className="editor-action-button"
            title="Search in preview"
          >
            <IconSearch size={18} />
          </button>
          <button
            onClick={exportAsHTML}
            className="editor-action-button"
            title="Export as HTML"
          >
            <IconDownload size={18} />
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
              placeholder="Search in preview..."
              className="search-input"
            />
            {searchResults.count > 0 && (
              <div className="search-counter">
                {searchResults.currentIndex + 1} / {searchResults.count}
              </div>
            )}
          </div>
          <div className="search-actions">
            <button
              className="search-nav-button"
              onClick={scrollToPrevMatch}
              disabled={searchResults.count === 0}
              title="Previous match"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              className="search-nav-button"
              onClick={scrollToNextMatch}
              disabled={searchResults.count === 0}
              title="Next match"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button className="search-close-button" onClick={closeSearch} title="Close search">
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}

      <div 
        ref={previewerRef} 
        className="previewer-content" 
        onScroll={handleScroll}
        tabIndex={0} 
        style={{ 
          fontSize: `${fontSize}px`,
          height: showSearch ? 'calc(100% - 6rem)' : 'calc(100% - 3rem)',
        }}
        data-testid="preview-content"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            // ... existing code ...
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default Previewer;