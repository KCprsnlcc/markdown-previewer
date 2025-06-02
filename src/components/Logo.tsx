import React from 'react';
import { useAppContext } from '../context/AppContext';

interface LogoProps {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ showText = true, size = 'medium' }) => {
  const { darkMode } = useAppContext();
  
  // Size mapping for the logo icon
  const sizeMap = {
    small: 22,
    medium: 28,
    large: 36
  };
  
  // Size mapping for the font
  const fontSizeMap = {
    small: 16,
    medium: 18,
    large: 22
  };
  
  return (
    <div className={`app-logo ${size}`}>
      <div className="logo-icon">
        <svg 
          width={sizeMap[size]} 
          height={sizeMap[size]} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M3 4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V4.5Z" 
            fill={darkMode ? "#3b82f6" : "#2563eb"} 
          />
          <path 
            d="M7 7.5L12 12.5L17 7.5" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M7 12.5L9.5 15L12 12.5L14.5 15L17 12.5" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M7 17.5H17" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
      
      {showText && (
        <span 
          className="logo-text" 
          style={{ fontSize: fontSizeMap[size] }}
        >
          MarkDown
        </span>
      )}
    </div>
  );
};

export default Logo;
