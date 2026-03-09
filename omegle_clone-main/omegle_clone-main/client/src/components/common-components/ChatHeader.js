import React from 'react';
import styled from 'styled-components';

const ChatHeaderContainer = styled.div`
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  border-radius: 12px;
  height: 84px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 10px 26px rgba(2,6,23,0.45);
  backdrop-filter: saturate(120%) blur(6px);
  background-image: linear-gradient(
      90deg,
      rgba(0,0,0,0.92) 0%,
      rgba(0,0,0,0.65) 18%,
      rgba(0,0,0,0.35) 32%,
      rgba(0,0,0,0.20) 45%,
      rgba(0,0,0,0.20) 55%,
      rgba(0,0,0,0.35) 68%,
      rgba(0,0,0,0.65) 82%,
      rgba(0,0,0,0.92) 100%
    ),
    url(${props => props.$bg});
  /* Cover fully with doodle and keep text readable */
  background-size: 100% 100%, 120% auto;
  background-position: center center, center 42%;
  background-repeat: no-repeat, no-repeat;

  @media (max-width: 768px) {
    padding: 0 0.75rem;
    height: 76px;
    margin-bottom: 15px;
    width: 99% !important;
    max-width: 100vw !important;
    border-radius: 0;
    margin-left: 0;
    margin-right: 0;
    /* Tweak scale/position for mobile */
    background-size: 100% 100%, 140% auto;
    background-position: center center, center 42%;
  }
`;

/* Side slots removed for full-width background */



/* Removed side badge styles */

const OnlineSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #CFFFD9;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  justify-self: center;
`;

const OnlineDot = styled.div`
  width: 8px;
  height: 8px;
  background: #1DB954;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(29,185,84,0.65);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

function ChatHeader({ onlineCount = 0, background = 'doodle.png' }) {
  const resolvedBg = React.useMemo(() => {
    const isFull = background.startsWith('http://') || background.startsWith('https://') || background.startsWith('/');
    const path = isFull ? background : `/${background}`;
    const base = process.env.PUBLIC_URL || '';
    return `${base}${path}`;
  }, [background]);

  return (
    <ChatHeaderContainer $bg={resolvedBg}>
      <OnlineSection>
        <OnlineDot />
        <span>{onlineCount} online</span>
      </OnlineSection>
    </ChatHeaderContainer>
  );
}

export default ChatHeader; 