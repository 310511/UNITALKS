import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.isOff 
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
  color: ${props => props.isOff ? '#fff' : '#FFFFFF'};
  position: relative;
  box-shadow: ${props => props.isOff 
    ? '0 6px 18px rgba(239, 68, 68, 0.35)' 
    : '0 6px 18px rgba(2,6,23,0.35)'};

  &:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(29,185,84,0.25); }

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

function CameraButton({ isOff, onClick, size }) {
  return (
    <Button onClick={onClick} isOff={isOff} size={size} aria-label={isOff ? 'Turn on camera' : 'Turn off camera'}>
      {isOff ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
      )}
      <Tooltip>{isOff ? 'Turn on camera' : 'Turn off camera'}</Tooltip>
    </Button>
  );
}

export default CameraButton; 