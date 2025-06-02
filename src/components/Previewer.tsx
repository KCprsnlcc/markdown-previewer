import React, { useEffect } from 'react';
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
}

const Previewer: React.FC<PreviewerProps> = ({ content }) => {
  const {
    fontSize,
    previewTheme,
    darkMode,
  } = useAppContext();
  
  // Apply syntax highlighting after rendering
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);
  
  // Preview themes
  const getPreviewThemeStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontSize: `${fontSize}px`,
      lineHeight: '1.6',
      padding: '1rem',
      height: '100%',
      overflow: 'auto',
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
  };
  
  return (
    <div className="previewer-container" style={getPreviewThemeStyles()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.3em' }} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.3em' }} {...props}>
              {children}
            </h2>
          ),
          blockquote: ({ children, ...props }) => (
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
          code: (props) => {
            const { className, children, ...rest } = props;
            // @ts-ignore - inline is a valid prop for code elements in react-markdown
            const inline = props.inline;
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className={className} style={{ borderRadius: '4px', padding: '1em', overflow: 'auto' }}>
                <code className={match ? `language-${match[1]}` : ''} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code 
                className={className} 
                style={{ 
                  backgroundColor: darkMode ? '#2d2d2d' : '#f6f8fa',
                  padding: '0.2em 0.4em',
                  borderRadius: '3px',
                  fontSize: '85%'
                }} 
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Previewer;