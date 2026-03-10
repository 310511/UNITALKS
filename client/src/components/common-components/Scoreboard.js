import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  position: sticky;
  bottom: 0;
  background: rgba(15, 20, 30, 0.97);
  border-top: 2px solid #22c55e;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  font-size: 14px;
  border-radius: 0 0 12px 12px;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
  gap: 8px;
`;

const Title = styled.span`
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-right: 12px;
`;

const ScoresRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
`;

const LastLine = styled.span`
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  flex-shrink: 0;
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  &:hover {
    background: rgba(255,255,255,0.15);
  }
`;

function formatLastLine(lastGame, lastWinnerLabel) {
  if (!lastGame) return 'No wins yet';
  return `Last: ${lastGame} (${lastWinnerLabel || ''})`;
}

/**
 * Scoreboard – compact shared game score card.
 * Props: scores, onClose
 */
const Scoreboard = ({ scores, onClose }) => {
  if (!scores) return null;
  const { you = 0, partner = 0, lastGame = '', lastWinnerLabel = '' } = scores || {};

  return (
    <Card aria-label="Game scoreboard">
      <Title>🏆 SCOREBOARD</Title>
      <ScoresRow>
        <span>YOU</span>
        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{you}</span>
        <span style={{ opacity: 0.5 }}>──────────</span>
        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{partner}</span>
        <span>PARTNER</span>
      </ScoresRow>
      <LastLine>{formatLastLine(lastGame, lastWinnerLabel)}</LastLine>
      {onClose && (
        <CloseBtn onClick={onClose} type="button">Close</CloseBtn>
      )}
    </Card>
  );
};

export default Scoreboard;
