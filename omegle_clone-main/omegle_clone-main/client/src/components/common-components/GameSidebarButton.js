import React from 'react';
import styled from 'styled-components';

const SidebarButton = styled.button`
  width: 46px;
  height: 46px;
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 12px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)' : 'linear-gradient(135deg, #121212 0%, #181818 100%)'};
  color: #E5E7EB;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  backdrop-filter: saturate(120%) blur(2px);
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(29,185,84,0.25); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
  @media (max-width: 768px) { width: 44px; height: 44px; border-radius: 10px; }
`;



const GameSidebarButton = ({ onClick, active, title = 'Games', ...props }) => (
  <SidebarButton onClick={onClick} $active={active} title={title} {...props}>
    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🎮</span>
  </SidebarButton>
);

export default GameSidebarButton; 