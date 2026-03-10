import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const HeaderContainer = styled.nav`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(12px);
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
`;

const NavInner = styled.div`
  width: 100%;
  max-width: 1300px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #fff;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  img {
    height: 44px;
    width: 44px;
    border-radius: 10px;
    object-fit: contain;
    box-shadow: 0 0 15px rgba(29, 185, 84, 0.2);
  }

  @media (max-width: 720px) {
    img { height: 38px; width: 38px; }
  }
`;

const BrandText = styled.span`
  font-family: 'Press Start 2P', cursive, system-ui;
  font-size: 20px;
  line-height: 1;
  letter-spacing: 1px;
  color: #ffffff;
  text-transform: uppercase;
  
  @media (max-width: 720px) {
    font-size: 16px;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const OnlineBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(29, 185, 84, 0.12);
  border: 1px solid rgba(29, 185, 84, 0.35);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  color: #1DB954;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const OnlineDot = styled.div`
  width: 8px;
  height: 8px;
  background: #1DB954;
  border-radius: 50%;
  box-shadow: 0 0 8px #1DB954;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.1); }
  }
`;

const SidebarIndicator = styled.div`
  height: 24px;
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8px;
`;

/**
 * NameHeader Component
 * @param {string} logo - The text brand name
 * @param {number|string} onlineCount - Optional count of users online
 * @param {boolean} hasSidebar - Whether a sidebar indicator should be shown
 */
const NameHeader = ({ logo, onlineCount, hasSidebar }) => {
    return (
        <HeaderContainer>
            <NavInner>
                <Brand to="/">
                    <img src="/assets/logos/logo.png" alt="Unitalks Logo" onError={(e) => {
                        e.target.style.display = 'none';
                    }} />
                    <BrandText>{logo || 'UniTalks'}</BrandText>
                </Brand>

                <RightSection>
                    {onlineCount !== undefined && onlineCount !== null && (
                        <OnlineBadge>
                            <OnlineDot />
                            {onlineCount} ONLINE
                        </OnlineBadge>
                    )}

                    {hasSidebar && <SidebarIndicator />}

                    {/* Menu icons or other actions can be added here if needed */}
                </RightSection>
            </NavInner>
        </HeaderContainer>
    );
};

export default NameHeader;
