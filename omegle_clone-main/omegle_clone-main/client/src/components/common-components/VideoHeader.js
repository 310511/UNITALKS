import React from 'react';
import styled from 'styled-components';

const VideoHeaderContainer = styled.div`
  background: rgba(17,24,39,0.8);
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border-radius: 12px;
  height: 60px;
  margin-top: 50px;
  margin-bottom: 20px;
  margin-left: auto;
  margin-right: auto;
  max-width: 1300px;
  border: 2px solid rgba(29,185,84,0.45);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
    height: auto;
    min-height: 50px;
    margin-top: 80px;
    margin-bottom: 15px;
  }
`;

const VideoTypeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VideoType = styled.div`
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
`;

const VideoIcon = styled.div`
  color: #1DB954;
  font-size: 1.2rem;
`;

const OnlineSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1DB954;
  font-size: 0.9rem;
`;

const OnlineDot = styled.div`
  width: 8px;
  height: 8px;
  background: #1DB954;
  border-radius: 50%;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

function VideoHeader({ 
  videoType = "Video Chat",
  onlineCount = 0,
  videoIcon = "📹"
}) {
  return (
    <VideoHeaderContainer>
      <VideoTypeSection>
        <VideoIcon>{videoIcon}</VideoIcon>
        <VideoType>{videoType}</VideoType>
      </VideoTypeSection>
      
      <OnlineSection>
        <OnlineDot />
        <span>{onlineCount} online</span>
      </OnlineSection>
    </VideoHeaderContainer>
  );
}

export default VideoHeader; 