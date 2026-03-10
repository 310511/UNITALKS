import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.$isVideoOff 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
    : 'linear-gradient(135deg, #121212 0%, #181818 100%)'};
  border: 1px solid rgba(29,185,84,0.45);
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.2s ease;
  color: #FFFFFF;
  position: relative;
  box-shadow: ${props => props.$isVideoOff 
    ? '0 6px 18px rgba(239, 68, 68, 0.35)' 
    : '0 6px 18px rgba(2,6,23,0.35)'};

  &:hover { 
    transform: translateY(-2px); 
    box-shadow: ${props => props.$isVideoOff 
      ? '0 12px 28px rgba(239, 68, 68, 0.25)' 
      : '0 12px 28px rgba(2,6,23,0.25)'};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: ${props => props.size || 24}px;
    height: ${props => props.size || 24}px;
  }
`;

const Tooltip = styled.span`
  visibility: hidden;
  background-color: #121212;
  color: #fff;
  text-align: center;
  border-radius: 8px;
  padding: 8px 12px;
  position: absolute;
  z-index: 1;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 0.9rem;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  ${Button}:hover & {
    visibility: visible;
    opacity: 1;
  }
`;

function VideoButton({ isVideoOff, onClick, size }) {
  return (
    <Button onClick={onClick} $isVideoOff={isVideoOff} size={size} aria-label={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}>
      {isVideoOff ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98zm-2-.48l4 4v-8l-4 4v-4H4v12h12v-4zM2 4.27l2.28 2.28.45.45C3.66 7.62 3 9.22 3 11v1h2v-1c0-1.17.43-2.26 1.13-3.08l1.45 1.45C7.21 9.87 7 10.42 7 11v1h2v-1c0-.44.1-.85.27-1.22l1.63 1.63C10.37 11.16 10 11.55 10 12v1h2v-1c0-.44.09-.85.26-1.22l1.63 1.63C13.36 12.16 13 12.55 13 13v1h2v-1c0-.44.09-.85.25-1.21l5.48 5.48L22 19.73 3.27 1z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM15 16H5V8h10v8z"/>
        </svg>
      )}
      <Tooltip>{isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}</Tooltip>
    </Button>
  );
}

export default VideoButton;
