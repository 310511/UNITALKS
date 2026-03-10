import React from 'react';
import { SidebarContainer, SidebarButton, SidebarIcon, SidebarLabel } from './StyledComponents';
import GameSidebarButton from '../common-components/GameSidebarButton';

function SidebarControls({
  isConnected,
  onVideoCall,
  onStop,
  onSkip,
  onGameClick,
  videoCallStatus,
  connectionStatus,
  gameActive
}) {
  if (!isConnected) {
    return null;
  }

  return (
    <SidebarContainer>
      {/* Video Call Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <SidebarButton
          onClick={onVideoCall}
          disabled={videoCallStatus === 'requesting'}
          title="Video Call"
        >
          <SidebarIcon 
            src="/assets/icons/video-call.png" 
            alt="Video Call" 
          />
        </SidebarButton>
        <SidebarLabel>Video</SidebarLabel>
      </div>

      {/* Game Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <GameSidebarButton
          onClick={onGameClick}
          active={gameActive}
          title="Games"
        />
        <SidebarLabel>Games</SidebarLabel>
      </div>

      {/* Skip Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <SidebarButton
          onClick={onSkip}
          disabled={videoCallStatus === 'requesting'}
          title="Skip User"
        >
          <SidebarIcon 
            src="/assets/icons/next-button.png" 
            alt="Skip User" 
          />
        </SidebarButton>
        <SidebarLabel>Skip</SidebarLabel>
      </div>

      {/* Stop Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <SidebarButton
          onClick={onStop}
          title="Stop Chat"
        >
          <SidebarIcon 
            src="/assets/icons/stop.png" 
            alt="Stop Chat" 
          />
        </SidebarButton>
        <SidebarLabel>Stop</SidebarLabel>
      </div>


    </SidebarContainer>
  );
}

export default SidebarControls; 