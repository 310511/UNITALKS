import React from 'react';

import GameSidebarButton from '../common-components/GameSidebarButton';
import { SidebarContainer, SidebarButton, SidebarLabel } from './StyledComponents';

function SidebarControls({
  isConnected,
  onTextChat,
  onVoiceCall,
  onStop,
  onSkip,
  onSongs,
  onWatchAlongClick,
  onGameClick,
  textChatStatus,
  voiceCallStatus,
  connectionStatus,
  gameActive
}) {
  if (!isConnected) {
    return null;
  }

  return (
    <SidebarContainer>
      {/* Removed Text/Voice switching in Video mode per requirement */}

      {/* Songs Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <SidebarButton
          onClick={onSongs}
          title="Songs"
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🎵</span>
        </SidebarButton>
        <SidebarLabel>Songs</SidebarLabel>
      </div>

      {/* Watch Along Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <SidebarButton
          onClick={onWatchAlongClick}
          title="Watch Along"
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📺</span>
        </SidebarButton>
        <SidebarLabel>Watch</SidebarLabel>
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
          disabled={voiceCallStatus === 'requesting'}
          title="Skip User"
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⏭️</span>
        </SidebarButton>
        <SidebarLabel>Skip</SidebarLabel>
      </div>

      {/* Stop Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <SidebarButton
          onClick={onStop}
          title="Stop Chat"
        >
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🔴</span>
        </SidebarButton>
        <SidebarLabel>Stop</SidebarLabel>
      </div>


    </SidebarContainer>
  );
}

export default SidebarControls; 