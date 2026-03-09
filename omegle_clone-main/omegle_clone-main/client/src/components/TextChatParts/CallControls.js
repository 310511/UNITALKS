import React from 'react';
import styled from 'styled-components';
import ConnectionButton from './ConnectionButton';

const EqualButton = styled.button`
  width: 110px;
  height: 56px;
  font-size: 1.05rem;
  padding: 0;
  margin-top: 0;
  @media (max-width: 500px) {
    width: 90px;
    height: 48px;
    font-size: 1.05rem;
  }
`;

const CallButton = styled(EqualButton)`
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 8px;
  box-shadow: 0 4px 15px rgba(29, 185, 84, 0.28);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(29, 185, 84, 0.35);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CallControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  flex-wrap: wrap;

  @media (max-width: 500px) {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0.5rem;
    margin-top: 12px;
  }
`;

function CallControls({
  isConnected,
  onVoiceCall,
  onVideoCall,
  onStop,
  voiceCallStatus,
  videoCallStatus,
  connectionStatus,
  buttonRef
}) {
  if (!isConnected) {
    return null;
  }

  // Detect mobile for label shortening
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 500px)').matches;

  return (
    <CallControlsContainer>
      <CallButton
        onClick={onVoiceCall}
        disabled={voiceCallStatus === 'requesting' || videoCallStatus === 'requesting'}
      >
        {voiceCallStatus === 'requesting'
          ? 'Requesting...'
          : isMobile ? 'Voice' : 'Voice Call'}
      </CallButton>
      <CallButton
        onClick={onVideoCall}
        disabled={voiceCallStatus === 'requesting' || videoCallStatus === 'requesting'}
      >
        {videoCallStatus === 'requesting'
          ? 'Requesting...'
          : isMobile ? 'Video' : 'Video Call'}
      </CallButton>
      <ConnectionButton
        connectionStatus={connectionStatus}
        onStop={onStop}
        isConnected={isConnected}
        buttonRef={buttonRef}
        className="equal-size-btn"
      />
    </CallControlsContainer>
  );
}

export default CallControls; 