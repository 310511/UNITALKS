import React from 'react';
import styled from 'styled-components';
import SpeakingButtonVoice from '../common-components/SpeakingButtonVoice';

const AudioControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 1rem 0 0 0;
`;

function AudioControls({
  isMuted,
  toggleMute
}) {
  return (
    <AudioControlsContainer>
      <SpeakingButtonVoice isMuted={isMuted} toggleMute={toggleMute} size={32} />
    </AudioControlsContainer>
  );
}

export default AudioControls; 