import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiMessageCircle, FiMic, FiVideo, FiArrowRight } from 'react-icons/fi';
import NameHeader from './common-components/NameHeader';
import Footer from './common-components/Footer';

const StartChatContainer = styled.div`
  min-height: 100vh;
  max-width: 100vw;
  background: ${({ theme }) => theme.colors.appBg};
  color: #F8FAFC;
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 0;
`;

const MainContent = styled.div`
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 56px 20px 48px;
  margin-top: 70px;
  position: relative;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 80% at 50% 20%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%),
      radial-gradient(600px 300px at 50% 10%, rgba(29,185,84,0.15), rgba(0,0,0,0) 60%);
    z-index: 0;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  line-height: 1.12;

  @media (max-width: 768px) {
    font-size: 2.1rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.05rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 28px;
  max-width: 640px;
  text-align: center;
  line-height: 1.7;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const OptionsContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  max-width: 1000px;
  width: 100%;
  justify-content: center;
  align-items: stretch;
  margin-top: 18px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }
`;

const ChatOption = styled(Link)`
  flex: 1;
  max-width: 320px;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-decoration: none;
  color: #F8FAFC;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 10px 40px rgba(29,185,84,0.08);
  backdrop-filter: blur(6px);

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(29,185,84,0.7);
    box-shadow: 0 10px 40px rgba(29,185,84,0.15);
  }

  @media (max-width: 768px) {
    max-width: none;
    padding: 1.75rem 1.25rem;
  }
`;

const IconContainer = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: radial-gradient(120px 120px at 50% 0%, rgba(29,185,84,0.5), rgba(0,0,0,0.9));
  border: 1px solid rgba(29,185,84,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  color: #E5E7EB;

  svg {
    width: 32px;
    height: 32px;
  }
`;

const OptionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 1.15rem;
  }
`;

const OptionDescription = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
`;

const ArrowIcon = styled.div`
  position: relative;
  z-index: 2;
  color: #1DB954;
  font-size: 1.2rem;
  transition: transform 0.25s ease;

  ${ChatOption}:hover & {
    transform: translateX(4px);
  }
`;

function StartChat() {
  return (
    <StartChatContainer>
      <NameHeader
        logo="Unitalks"
        hasSidebar={false}
      />
      <MainContent>
        <Title>Choose Your Chat Experience</Title>
        <Subtitle>
          Pick a mode and start connecting instantly — in text, voice, or video.
        </Subtitle>

        <OptionsContainer>
          <ChatOption to="/text">
            <IconContainer>
              <FiMessageCircle />
            </IconContainer>
            <OptionTitle>Text Chat</OptionTitle>
            <OptionDescription>
              Connect with strangers through instant messaging. Perfect for those who prefer text-based communication.
            </OptionDescription>
            <ArrowIcon>
              <FiArrowRight />
            </ArrowIcon>
          </ChatOption>

          <ChatOption to="/voice">
            <IconContainer>
              <FiMic />
            </IconContainer>
            <OptionTitle>Voice Chat</OptionTitle>
            <OptionDescription>
              Have real-time voice conversations with random people. Experience natural audio communication.
            </OptionDescription>
            <ArrowIcon>
              <FiArrowRight />
            </ArrowIcon>
          </ChatOption>

          <ChatOption to="/video">
            <IconContainer>
              <FiVideo />
            </IconContainer>
            <OptionTitle>Video Chat</OptionTitle>
            <OptionDescription>
              Face-to-face video conversations with strangers. The most immersive chat experience.
            </OptionDescription>
            <ArrowIcon>
              <FiArrowRight />
            </ArrowIcon>
          </ChatOption>
        </OptionsContainer>
      </MainContent>
      <Footer />
    </StartChatContainer>
  );
}

export default StartChat; 