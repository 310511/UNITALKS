import React from 'react';
import styled from 'styled-components';

const StatusAreaContainer = styled.div`
  font-size: 1.18rem;
  font-weight: 600;
  color: #1DB954;
  margin-bottom: 2.2rem;
  text-align: center;
  min-height: 2.2rem;
`;

const StatusArea = React.memo(function StatusArea({
  error,
  modeTransition,
  isConnected,
  connectionStatus
}) {
  if (error) {
    return (
      <StatusAreaContainer>
        <span style={{ color: 'red' }}>{error}</span>
      </StatusAreaContainer>
    );
  }

  if (modeTransition) {
    return (
      <StatusAreaContainer>
        <span style={{ color: '#1DB954' }}>
          Switching to {modeTransition === 'text' ? 'text chat' : 'voice call'}...
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

  return (
    <StatusAreaContainer>
      Connected with Stranger
    </StatusAreaContainer>
  );
});

export default StatusArea; 