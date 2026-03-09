import React from 'react';
import styled from 'styled-components';

const StatusAreaContainer = styled.div`
  font-size: 1.18rem;
  font-weight: 600;
  color: #F8FAFC;
  margin-bottom: 2.2rem;
  text-align: center;
  min-height: 2.2rem;
`;

const StatusArea = React.memo(function StatusArea({
  error,
  modeTransition,
  isConnected,
  connectionStatus,
  textChatStatus,
  videoCallStatus
}) {
  if (error) {
    return (
      <StatusAreaContainer>
        <span style={{ color: '#EF4444' }}>{error}</span>
      </StatusAreaContainer>
    );
  }

  if (modeTransition) {
    return (
      <StatusAreaContainer>
        <span style={{ color: '#1DB954' }}>
          Switching to {modeTransition === 'text' ? 'text chat' : 'video call'}...
        </span>
      </StatusAreaContainer>
    );
  }

  if (!isConnected) {
    let statusText = 'Ready to connect!';
    if (connectionStatus === 'finding') {
      statusText = 'Finding a random online user...';
    } else if (connectionStatus === 'establishing') {
      statusText = 'Establishing connection...';
    }

    return (
      <StatusAreaContainer>
        {statusText}
      </StatusAreaContainer>
    );
  }

  // Only show status if there's an active request or transition
  const hasActiveStatus = textChatStatus === 'requesting' || 
                         textChatStatus === 'received' || 
                         videoCallStatus === 'requesting' || 
                         videoCallStatus === 'received';

  if (!hasActiveStatus) {
    return null; // Don't show anything when just connected normally
  }

  return (
    <StatusAreaContainer>
      <div>
        {textChatStatus === 'requesting' && (
          <div style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
            Requesting text chat...
          </div>
        )}
        {textChatStatus === 'received' && (
          <div style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
            Text chat request received
          </div>
        )}
        {videoCallStatus === 'requesting' && (
          <div style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
            Requesting video call...
          </div>
        )}
        {videoCallStatus === 'received' && (
          <div style={{ fontSize: '0.9rem', color: '#94A3B8' }}>
            Video call request received
          </div>
        )}
      </div>
    </StatusAreaContainer>
  );
});

export default StatusArea; 