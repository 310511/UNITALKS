import React from 'react';
import styled from 'styled-components';
import {
    FiVideo,
    FiMic,
    FiX,
    FiChevronsRight,
    FiPlayCircle
} from 'react-icons/fi';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 80px;
  align-items: center;
  padding: 16px 8px;
  background: rgba(17, 24, 39, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    flex-direction: row;
    max-width: 100%;
    justify-content: center;
    padding: 8px;
    border-radius: 999px;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    gap: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    background: rgba(10, 10, 15, 0.85);
  }
`;

const ActionButton = styled.button`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.$danger ? 'rgba(239, 68, 68, 0.3)' : props.$active ? 'rgba(29, 185, 84, 0.6)' : 'rgba(255, 255, 255, 0.08)'};
  background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.1)' : props.$active ? 'rgba(29, 185, 84, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
  color: ${props => props.$danger ? '#ef4444' : props.$active ? '#1DB954' : '#E5E7EB'};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
    border-color: ${props => props.$danger ? '#ef4444' : props.$active ? '#1DB954' : 'rgba(255, 255, 255, 0.2)'};
    color: ${props => props.$danger ? '#ef4444' : '#fff'};
    box-shadow: 0 4px 20px ${props => props.$danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.2)'};
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.95);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  left: 64px;
  background: #000;
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  ${ActionButton}:hover & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  background: #1DB954;
  border-radius: 50%;
  border: 2px solid #000;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.6; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const SidebarControls = ({
    isConnected,
    onVoiceCall,
    onVideoCall,
    onStop,
    onSkip,
    voiceCallStatus,
    videoCallStatus,
    connectionStatus,
    onGameClick,
    gameActive
}) => {
    return (
        <SidebarContainer>
            {/* Skip Button */}
            <ActionButton onClick={onSkip} title="Skip to next (S)">
                <FiChevronsRight size={22} />
                <Tooltip>Skip (S)</Tooltip>
            </ActionButton>

            {/* Video Call Button */}
            {onVideoCall && (
                <ActionButton
                    onClick={onVideoCall}
                    disabled={videoCallStatus === 'requesting'}
                    $active={videoCallStatus === 'requesting'}
                    title="Video Call"
                >
                    <FiVideo size={20} />
                    {videoCallStatus === 'requesting' && <StatusIndicator />}
                    <Tooltip>Video Call</Tooltip>
                </ActionButton>
            )}

            {/* Voice Call Button */}
            {onVoiceCall && (
                <ActionButton
                    onClick={onVoiceCall}
                    disabled={voiceCallStatus === 'requesting'}
                    $active={voiceCallStatus === 'requesting'}
                    title="Voice Call"
                >
                    <FiMic size={20} />
                    {voiceCallStatus === 'requesting' && <StatusIndicator />}
                    <Tooltip>Voice Call</Tooltip>
                </ActionButton>
            )}

            {/* Games Button */}
            <ActionButton
                onClick={onGameClick}
                $active={gameActive}
                title="Play Games"
            >
                <FiPlayCircle size={20} />
                <Tooltip>Play Games</Tooltip>
            </ActionButton>

            {/* Stop/End Button */}
            <ActionButton $danger onClick={onStop} title="Stop and exit (X)">
                <FiX size={20} />
                <Tooltip>Stop (X)</Tooltip>
            </ActionButton>
        </SidebarContainer>
    );
};

export default SidebarControls;
