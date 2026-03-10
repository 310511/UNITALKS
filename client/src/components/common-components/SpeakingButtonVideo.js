import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.$isMuted 
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
  color: ${props => props.$isMuted ? '#fff' : '#FFFFFF'};
  position: relative;
  box-shadow: ${props => props.$isMuted 
    ? '0 6px 18px rgba(239, 68, 68, 0.35)' 
    : '0 6px 18px rgba(2,6,23,0.35)'};

  &:hover { 
    transform: translateY(-2px); 
    box-shadow: ${props => props.$isMuted 
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

function SpeakingButtonVideo({ isMuted, onClick, size }) {
  return (
    <Button onClick={onClick} $isMuted={isMuted} size={size} aria-label={isMuted ? 'Unmute' : 'Mute'}>
      {isMuted ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
        </svg>
      )}
      <Tooltip>{isMuted ? 'Unmute' : 'Mute'}</Tooltip>
    </Button>
  );
}

export default SpeakingButtonVideo; 