import styled from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  background: ${({ theme }) => theme.colors.appBg};
  width: 100%;
  overflow-x: hidden;
  position: relative;
  z-index: 0;
`;

export const VideoCard = styled.div`
  max-width: 100vw;
  width: 100%;
  min-width: 0;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  margin-top: 0;
  @media (max-width: 768px) {
    padding: 0 6px;
    max-width: 100vw;
  }
`;

export const Button = styled.button`
  padding: 0.7rem 1.5rem;
  border: 1px solid rgba(29,185,84,0.6);
  border-radius: 999px;
  background: linear-gradient(135deg, #181818 0%, #121212 100%);
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  font-weight: 700;
  margin: 0.5rem;
  box-shadow: 0 8px 24px rgba(29,185,84,0.18);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(29,185,84,0.22);
  }
  
  &:disabled {
    background: rgba(18,18,18,0.6);
    color: #8b8b8b;
    cursor: not-allowed;
  }
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
  background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(18,18,18,0.9) 100%);
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  height: 100vh;
  overflow-y: hidden;
  z-index: 1000;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);

  @media (max-width: 768px) {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    flex-direction: row !important;
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    height: 72px !important; /* thicker to avoid clipping */
    padding: 0.4rem 0.8rem !important;
    justify-content: space-around !important;
    align-items: center !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-left: none !important;
    z-index: 9999 !important;
    overflow-x: hidden !important; /* prevent left-right scrolling */
    overflow-y: hidden !important;
  }
`;

export const SidebarButton = styled.button`
  width: 46px;
  height: 46px;
  border: 1px solid rgba(29,185,84,0.45);
  border-radius: 12px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)' : 'linear-gradient(135deg, #0b1220 0%, #111827 100%)'};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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

export const SidebarLabel = styled.span`
  font-size: 10px;
  color: #c7d2fe;
  text-align: center;
  letter-spacing: 0.02em;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;