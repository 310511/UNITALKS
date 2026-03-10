import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 14px 24px;
  border: 1px solid rgba(29,185,84,0.6);
  border-radius: 999px;
  background: linear-gradient(135deg, #181818 0%, #121212 100%);
  color: #FFFFFF;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 10px 30px rgba(29,185,84,0.22);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  margin-top: 1.25rem;
  opacity: ${props => props.disabled ? 0.75 : 1};
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: 0 12px 36px rgba(29,185,84,0.28);
    border-color: rgba(29,185,84,0.75);
  }
`;

function ConnectionButton({ 
  connectionStatus, 
  onStart, 
  buttonRef,
  isSocketConnected,
  hasError
}) {
  const getButtonText = () => {
    if (hasError) {
      return 'Retry Connection';
    }
    if (connectionStatus === 'idle') {
      return 'Start Voice Chat';
    }
    if (connectionStatus === 'finding') {
      return 'Finding online users...';
    }
    if (connectionStatus === 'establishing') {
      return 'Establishing connection...';
    }
    return 'Start Voice Chat';
  };

  const isDisabled = (connectionStatus !== 'idle' && !hasError);

  return (
    <StyledButton
      ref={buttonRef}
      onClick={onStart}
      disabled={isDisabled}
    >
      {getButtonText()}
    </StyledButton>
  );
}

export default ConnectionButton; 