import React, { useEffect, useRef, useCallback, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useAppContext } from '../context/AppContext';
import { IconEye, IconDownload } from '@tabler/icons-react';
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

interface PreviewerProps {
  content: string;
  onScroll?: (scrollInfo: { scrollTop: number, scrollHeight: number, clientHeight: number }) => void;
  scrollToPosition?: number;
}

// Use memo to prevent unnecessary re-renders
const Previewer = memo(({ content, onScroll, scrollToPosition }: PreviewerProps) => {
  const {
    fontSize,
    previewTheme,
    darkMode,
  } = useAppContext();
  
  const previewerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const contentRef = useRef(content);
  
  // Apply syntax highlighting after rendering with debouncing
  useEffect(() => {
    // Only highlight if content actually changed
    if (contentRef.current !== content) {
      contentRef.current = content;
      
      // Use requestIdleCallback for better performance (or setTimeout as fallback)
      const highlightCode = () => {
        // Only run Prism if the element is still in the DOM
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
            onClick={exportAsHTML}
            className="editor-action-button"
            title="Export as HTML"
          >
            <IconDownload size={18} />
          </button>
        </div>
      </div>
      
      <div 
        ref={previewerRef} 
        className="previewer-content"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.6',
          wordWrap: 'break-word'
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default Previewer;