import React from 'react';

// FIX: React.memo prevents this pure component from re-rendering when unrelated
// parent state changes (e.g. every keystroke in the chat input).
const StatusArea = React.memo(function StatusArea({
  isConnected,
  connectionStatus,
  modeTransition,
  voiceCallStatus,
  videoCallStatus,
  children
}) {
  return (
    <>
      {!isConnected ? (
        connectionStatus === 'finding' ? 'Finding a random online user...' :
        connectionStatus === 'establishing' ? 'Establishing connection...' :
        'Ready to connect!'
      ) : modeTransition ? (
        <span style={{ color: '#1DB954' }}>
          Switching to {modeTransition === 'voice' ? 'voice call' : 'video call'}...
        </span>
      ) : (
        <div>
          <div>Connected with Stranger</div>
          {voiceCallStatus === 'requesting' && (
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Requesting voice call...
            </div>
          )}
          {voiceCallStatus === 'received' && (
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Voice call request received
            </div>
          )}
          {videoCallStatus === 'requesting' && (
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Requesting video call...
            </div>
          )}
          {videoCallStatus === 'received' && (
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Video call request received
            </div>
          )}
          {children}
        </div>
      )}
    </>
  );
});

export default StatusArea;