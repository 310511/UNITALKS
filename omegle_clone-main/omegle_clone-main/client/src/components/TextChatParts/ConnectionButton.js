import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 14px 24px;
  border: 1px solid ${props => props.$isStop ? 'rgba(248,113,113,0.6)' : 'rgba(29,185,84,0.6)'};
  border-radius: 999px;
  background: ${props => props.$isStop ? 'linear-gradient(135deg, #3a0d0d 0%, #1a0b0b 100%)' : 'linear-gradient(135deg, #181818 0%, #121212 100%)'};
  color: #FFFFFF;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 10px 30px ${props => props.$isStop ? 'rgba(248,113,113,0.2)' : 'rgba(29,185,84,0.22)'};
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  opacity: ${props => props.disabled ? 0.75 : 1};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: 0 12px 36px ${props => props.$isStop ? 'rgba(248,113,113,0.25)' : 'rgba(29,185,84,0.28)'};
    border-color: ${props => props.$isStop ? 'rgba(248,113,113,0.75)' : 'rgba(29,185,84,0.75)'};
  }

  span { position: relative; z-index: 1; }
`;

// FIX: React.memo prevents re-renders when parent state that doesn't affect
// button appearance changes (e.g. incoming messages, watch-along state).
const ConnectionButton = React.memo(function ConnectionButton({ 
  connectionStatus, 
  onStart, 
  onStop, 
  buttonRef,
  isConnected,
  className
}) {
  const getButtonText = () => {
    if (!isConnected) {
      if (connectionStatus === 'idle') return 'Start Chatting';
      if (connectionStatus === 'finding') return 'Finding online users...';
      if (connectionStatus === 'establishing') return 'Establishing connection...';
      return 'Start Chatting';
    }
    return 'Stop';
  };

  const handleClick = () => {
    if (isConnected) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <StyledButton
      onClick={handleClick}
      disabled={!isConnected && connectionStatus !== 'idle'}
      ref={buttonRef}
      $isStop={isConnected}
      className={className}
    >
      <span>{getButtonText()}</span>
    </StyledButton>
  );
});

export default ConnectionButton;