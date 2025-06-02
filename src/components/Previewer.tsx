import React, { useEffect, useRef, useCallback, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useAppContext } from '../context/AppContext';
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
  
  // Memoized preview theme styles
  const previewThemeStyles = useMemo((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontSize: `${fontSize}px`,
      lineHeight: '1.6',
      padding: '1rem',
      height: '100%',
      overflow: 'auto',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    };
    
    // Apply theme-specific styles
    switch (previewTheme) {
      case 'github':
        return {
          ...baseStyles,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          color: darkMode ? '#c9d1d9' : '#24292e',
          backgroundColor: darkMode ? '#0d1117' : '#ffffff',
        };
        
      case 'github-dark':
        return {
          ...baseStyles,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          color: '#c9d1d9',
          backgroundColor: '#0d1117',
        };
      
      case 'atom-one-dark':
        return {
          ...baseStyles,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#abb2bf',
          backgroundColor: '#282c34',
        };
      
      case 'atom-one-light':
        return {
          ...baseStyles,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#383a42',
          backgroundColor: '#fafafa',
        };
      
      case 'space-invader':
        return {
          ...baseStyles,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          color: '#16e0bd',
          backgroundColor: '#1a1a2e',
          border: '1px solid #16e0bd',
          borderRadius: '4px',
        };
      
      case 'documentation':
        return {
          ...baseStyles,
          fontFamily: 'Georgia, serif',
          color: darkMode ? '#e6e6e6' : '#333333',
          backgroundColor: darkMode ? '#1a1a1a' : '#f9f9f9',
          maxWidth: '800px',
          margin: '0 auto',
        };
      
      case 'minimal':
        return {
          ...baseStyles,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: darkMode ? '#cccccc' : '#333333',
          backgroundColor: darkMode ? '#222222' : '#ffffff',
          padding: '2rem',
        };
      
      case 'sepia':
        return {
          ...baseStyles,
          fontFamily: 'Georgia, serif',
          color: '#704214',
          backgroundColor: '#f4ecd8',
        };
      
      default: // default theme
        return {
          ...baseStyles,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: darkMode ? '#f0f0f0' : '#333333',
          backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
        };
    }
  }, [fontSize, previewTheme, darkMode]);
  
  // Memoized component renderers for better performance
  const componentRenderers = useMemo(() => ({
    h1: ({ children, ...props }: any) => (
      <h1 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.3em' }} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.3em' }} {...props}>
        {children}
      </h2>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote 
        style={{ 
          borderLeft: '4px solid #ddd', 
          paddingLeft: '1em', 
          color: '#6a737d',
          margin: '1em 0'
        }} 
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: (props: any) => {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        <pre className={className} style={{ margin: '1em 0' }}>
          <code className={className} {...rest}>
            {children}
          </code>
        </pre>
      ) : (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
  }), []);
  
  return (
    <div 
      className="previewer-container optimize-gpu" 
      style={previewThemeStyles} 
      ref={previewerRef}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={componentRenderers}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default Previewer;