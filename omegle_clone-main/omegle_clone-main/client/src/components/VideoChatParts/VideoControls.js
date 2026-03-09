import React from 'react';
import styled from 'styled-components';
import SpeakingButtonVideo from '../common-components/SpeakingButtonVideo';
import VideoButton from '../common-components/VideoButton';

const ControlsContainer = styled.div`
  position: sticky;
  bottom: 24px; /* keeps from jumping on layout shifts */
  display: inline-flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(18,18,18,0.85) 100%);
  border-radius: 14px;
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 10px 24px rgba(2,6,23,0.45);
  z-index: 20;
`;

function VideoControls({
  isMuted,
  toggleMute,
  isVideoOff,
  toggleVideo
}) {

  return (
    <ControlsContainer>
      <SpeakingButtonVideo
        isMuted={isMuted}
        onClick={toggleMute}
        size={24}
      />
      <VideoButton
        isVideoOff={isVideoOff}
        onClick={toggleVideo}
        size={24}
      />
    </ControlsContainer>
  );
}

export default VideoControls; 