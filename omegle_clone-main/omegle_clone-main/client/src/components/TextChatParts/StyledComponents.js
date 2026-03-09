import styled from 'styled-components';

export const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
`;

export const ChatContainer = styled.div`
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 0;
  gap: 0;
  height: 100%;
`;

export const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background:
    radial-gradient(1000px 300px at 20% 0%, rgba(29,185,84,0.08), rgba(0,0,0,0) 60%),
    rgba(0, 0, 0, 0.6);
  box-sizing: border-box;
  min-height: 0;
  border-radius: 16px;
  border: 1px solid rgba(29,185,84,0.25);
  box-shadow: 0 8px 28px rgba(29,185,84,0.2);
  backdrop-filter: blur(4px) saturate(120%);
  max-height: 320px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    /* On mobile, keep the messages area scrollable with momentum scrolling */
    max-height: none;
    min-height: 0;
    margin-bottom: 12px;
    padding: 0.85rem 0.6rem 0.7rem 0.6rem;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
`;

export const Message = styled.div`
  margin: 0.5rem 0;
  padding: 0.7rem 1rem;
  border-radius: 18px;
  max-width: 80%;
  width: fit-content; /* shrink-to-content like WhatsApp */
  display: block; /* force one bubble per line */
  font-size: 1rem;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.45;
  ${props => props.$isMine ? `
    background: linear-gradient(135deg, rgba(29,185,84,0.25), rgba(29,185,84,0.15));
    color: #EAFBF0;
    margin-left: auto;
    border: 1px solid rgba(29,185,84,0.5);
    box-shadow: 0 6px 18px rgba(29,185,84,0.25);
  ` : `
    background: rgba(18,18,18,0.85);
    color: #E5E7EB;
    margin-right: auto;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 14px rgba(0,0,0,0.45);
  `}
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.6rem 0.6rem;
  gap: 0.5rem;
  background: rgba(0,0,0,0.5);
  box-sizing: border-box;
  flex-shrink: 0;
  min-height: 54px;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(29,185,84,0.25);
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(2,6,23,0.35);
  backdrop-filter: blur(4px) saturate(120%);

  @media (max-width: 768px) {
    padding: 0.4rem 0.5rem;
    height: auto;
    min-height: 48px;
  }
`;

export const Input = styled.textarea`
  flex: 1;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 12px;
  outline: none;
  font-size: 1.08rem;
  background: rgba(18,18,18,0.9);
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: border 0.2s;
  resize: none;
  min-height: 46px;
  max-height: 140px;
  overflow-y: auto;
  font-family: inherit;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  
  &:focus { border-color: rgba(29,185,84,0.7); }
  &::placeholder {
    color: #888;
  }

  /* Mobile-specific tweaks to avoid iOS zoom and improve tap behavior */
  @media (max-width: 768px) {
    font-size: 16px;
    -webkit-appearance: none;
    touch-action: manipulation;
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #1DB954;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #19a64c;
  }
`;

export const Button = styled.button`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #181818 0%, #121212 100%);
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid rgba(29,185,84,0.45);
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 10px 24px rgba(29,185,84,0.22);
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 34px rgba(29,185,84,0.25);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 8px 18px rgba(29,185,84,0.2);
  }
  &:disabled {
    background: rgba(17,24,39,0.6);
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.appBg};
  overflow: hidden;
  position: relative;
  z-index: 0;

  @media (max-width: 768px) {
    /* Use dynamic viewport height on modern mobile browsers */
    min-height: 100dvh;
    padding-bottom: 60px;
    overflow-y: auto;
  }
`;

export const ChatCard = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: none;
  padding: 0;
  border-radius: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    height: calc(100dvh - 140px);
  }
`;

export const FlexResponsiveContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  height: 100vh;
  
  @media (max-width: 768px) {
    flex-direction: column;
    height: 100dvh;
  }
`;

export const PanelCard = styled.div`
  background: transparent;
  border-radius: 12px;
  box-shadow: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  flex: 1;
  min-width: 0;
  height: 80vh;
  overflow: hidden;
  max-width: 1000px;
  gap: 0.3rem;

  @media (max-width: 768px) {
    min-width: 0;
    max-width: 100vw;
    border-radius: 8px;
    height: calc(100dvh - 140px);
    overflow-y: auto;
  }
`;

export const VideoPanelCard = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  height: 100vh;
  z-index: 1000;

  @media (max-width: 768px) {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    width: 100% !important;
    max-width: 100vw !important;
    height: 60px !important;
    flex-direction: row !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 9999 !important;
  }
`;

export const CenteredStatus = styled.div`
  width: 100%;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
`;

export const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  max-width: 1000px;
  margin: 0 auto;
  height: 80vh;
  overflow: hidden;
  background: transparent;
  margin-top: 70px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 100vw;
    height: calc(100dvh - 140px);
    padding-bottom: 20px;
    overflow-y: auto;
    margin-top: 70px;
  }
`;

export const ChatAndWatchContainer = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  height: 100%;
  align-items: stretch;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

export const ChatSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const WatchAlongSection = styled.div`
  width: 400px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 350px;
    align-self: center;
    height: 80%;
    min-height: 400px;
  }
`;

// New components for the sidebar
export const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1rem 0.5rem;
  padding-top: 80px;
  gap: 1rem;
  background: linear-gradient(180deg, rgba(3,7,18,0.85) 0%, rgba(17,24,39,0.9) 100%);
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);

  @media (max-width: 768px) {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    flex-direction: row !important;
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    height: 72px !important; /* thicker to avoid clipping labels */
    padding: 0.4rem 0.8rem !important;
    justify-content: space-around !important;
    align-items: center !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-left: none !important;
    z-index: 9999 !important;
    overflow-x: hidden !important; /* prevent left-right scrolling */
    overflow-y: hidden !important;
    box-sizing: border-box !important;
    flex-wrap: nowrap !important;
  }
`;

export const SidebarButton = styled.button`
  width: 46px;
  height: 46px;
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 12px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)' : 'linear-gradient(135deg, #0b1220 0%, #111827 100%)'};
  color: #E5E7EB;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(29,185,84,0.18);
  backdrop-filter: saturate(120%) blur(2px);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(29,185,84,0.25);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
    border-radius: 10px;
  }
`;

export const SidebarIcon = styled.img`
  width: 28px;
  height: 28px;
  filter: grayscale(1) brightness(1.55) contrast(1.05) drop-shadow(0 2px 8px rgba(0,0,0,0.35));
  
  @media (max-width: 768px) {
    width: 26px;
    height: 26px;
  }
`;

export const SidebarLabel = styled.span`
  font-size: 10px;
  color: #c7f9d4;
  text-align: center;
  letter-spacing: 0.02em;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const ChatHeader = styled.div`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-radius: 12px;
`;

export const ChatTitle = styled.div`
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
`;

export const OnlineIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1DB954;
  font-size: 0.9rem;
`;

export const OnlineDot = styled.div`
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