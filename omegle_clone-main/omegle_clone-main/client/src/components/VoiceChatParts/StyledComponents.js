import styled from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.appBg};
  position: relative;
  z-index: 0;
`;

export const VoiceCard = styled.div`
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 18px;
  box-shadow: 0 10px 40px rgba(29,185,84,0.12);
  max-width: 350px;
  width: 100%;
  min-width: 0;
  padding: 2rem 1.25rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  @media (max-width: 500px) {
    border-radius: 0;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
    max-width: 100vw;
  }
`;

// New layout components
export const VoiceChatLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  max-width: 1100px;
  padding: 0 24px;
  padding-right: 80px;
  padding-bottom: 140px; /* keep footer below first fold */
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding-right: 2rem; /* Reset padding on mobile */
    padding-bottom: 140px; /* match desktop to hide footer initially */
  }
`;

export const StrangerPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 300px;
`;

export const UserPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 300px;
`;

export const CenterPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex: 1;
  max-width: 400px;
  border-radius: 16px;
  padding: 1.5rem;
  padding-top: 2rem;
  min-height: 300px;
  margin-top: 2rem;
  background: rgba(17,24,39,0.8);
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 8px 28px rgba(29,185,84,0.18);
  backdrop-filter: blur(4px) saturate(120%);
`;

export const StrangerCircle = styled.div`
  width: 150px;
  height: 150px;
  border: 2px solid #1DB954;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(65% 65% at 50% 35%, rgba(29,185,84,0.18), rgba(2,6,23,0.35));
  box-shadow: inset 0 0 24px rgba(29,185,84,0.18);
  
  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

export const UserCircle = styled.div`
  width: 150px;
  height: 150px;
  border: 2px solid #1DB954;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(65% 65% at 50% 35%, rgba(29,185,84,0.18), rgba(2,6,23,0.35));
  box-shadow: inset 0 0 24px rgba(29,185,84,0.18);
  
  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

export const AudioVisualizer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 56px;
  width: 70px;
  padding-bottom: 0;
  visibility: visible;
  pointer-events: none;
  z-index: 2;
`;

export const VisualizerBar = styled.span`
  width: 4px;
  height: 10px;
  background: linear-gradient(180deg, #34D399 0%, #10B981 100%);
  border-radius: 3px;
  opacity: 0.95;
  transition: height 60ms linear;
`;

export const StrangerLabel = styled.div`
  color: #F8FAFC;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
`;

export const UserLabel = styled.div`
  color: #F8FAFC;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
`;

export const SidebarLabel = styled.span`
  font-size: 10px;
  color: #c7d2fe;
  text-align: center;
  letter-spacing: 0.02em;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const StrangerButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

export const UserButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

export const StrangerButton = styled.button`
  padding: 0.75rem 1rem;
  border: 2px solid rgba(29,185,84,0.55);
  border-radius: 8px;
  background: ${props => props.$primary ? '#1DB954' : 'transparent'};
  color: #F8FAFC;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$primary ? '#19a64c' : 'rgba(29,185,84,0.12)'};
  }
`;

export const UserButton = styled.button`
  padding: 0.75rem 1rem;
  border: 2px solid rgba(29,185,84,0.55);
  border-radius: 8px;
  background: ${props => props.$danger ? '#EF4444' : 'transparent'};
  color: #F8FAFC;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$danger ? '#DC2626' : 'rgba(29,185,84,0.12)'};
  }
`;

export const AudioControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: absolute;
  bottom: -40px;
  left: 49%;
  transform: translateX(-50%);
  z-index: 10;
`;

// Sidebar components
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
  overflow-y: hidden;
  z-index: 1000;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);

  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    flex-direction: row;
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    padding: 0.4rem 0.8rem;
    justify-content: space-around;
    height: 72px; /* thicker to avoid clipping */
    overflow-y: hidden;
    overflow-x: hidden;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
    flex-wrap: nowrap;
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
  
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(29,185,84,0.25); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

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