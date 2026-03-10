import React from 'react';
import styled from 'styled-components';
import GameTicTacToe from '../common-components/GameTicTacToe';
import GameRPS from '../common-components/GameRPS';
import GameChess from '../common-components/GameChess';

const VideoGridContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: calc(100vw - 120px); /* Account for sidebar width */
  margin:  0;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    max-width: calc(100vw - 40px);
    gap: 1rem;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
  width: 35%;
  min-width: 250px;
  max-width: 320px;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
  }
`;

const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 30%;
  min-width: 350px;
  max-width: 400px;
  margin-top: 0px;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    order: 3; /* Place it after videos on mobile */
    margin-top: 20px;
  }
`;

const AdBanner = styled.div`
  width: 320px;
  height: 50px;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem auto;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
`;

const AdLabel = styled.div`
  position: absolute;
  top: 4px;
  left: 8px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
`;

const AdContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WatchAlongWrapper = styled.div`
  /* Override the WatchAlong component's top positioning for video chat page only */
  & > div {
    top: 0px !important;
  }
`;

const GameContainer = styled.div`
  background: linear-gradient(135deg, #232526 0%, #414345 100%);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 350px;
  max-height: 400px;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Status = styled.div`
  margin: 0;
  color: #B3B3B3;
`;

const GameChoiceModal = styled.div`
  background: linear-gradient(135deg, #232526 0%, #414345 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 350px;
  gap: 1rem;
`;

const GameChoiceTitle = styled.h3`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
`;

const GameChoiceDescription = styled.p`
  margin: 0;
  color: #ccc;
  font-size: 0.9rem;
  text-align: center;
  line-height: 1.4;
`;

const GameChoiceButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
`;

const GameChoiceButton = styled.button`
  padding: 0.8rem 1rem;
  background: linear-gradient(90deg, #1DB954 0%, #19a64c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  &:nth-child(2) {
   background: linear-gradient(90deg, #1DB954 0%, #19a64c 100%);
    
    &:hover {
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }
  }
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  background: none;
  color: #bbb;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.8;
  margin-top: 0.5rem;
  
  &:hover {
    opacity: 1;
  }
`;

// FIX: React.memo is critical here. VideoGrid renders live <video> elements.
// Without memo, every keystroke in the chat text input (which updates 'message'
// state in the parent VideoChat component) caused VideoGrid to re-render,
// interrupting video stream rendering and causing visible flickers.
const VideoGrid = React.memo(function VideoGrid({
  localVideoRef,
  remoteVideoRef,
  isLocalVideoReady,
  isRemoteVideoReady,
  watchAlongComponent,
  showGame,
  pendingGameType,
  gamePartnerId,
  firstPlayerId,
  socket,
  partnerId,
  showGameChoiceModal,
  onChooseGameType,
  onCancelGameChoice,
  onGameExit
}) {
  return (
    <VideoGridContainer>
      <VideoContainer>
        <Video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          style={{ transform: 'scaleX(-1)' }} // Mirror local video
        />
        {!isLocalVideoReady && <Status>Loading local video...</Status>}
      </VideoContainer>
      
      <CenterContainer>
        <AdBanner>
          <AdLabel>Ad</AdLabel>
          <AdContent>
            <span>Your ad here</span>
            <span>👋</span>
          </AdContent>
        </AdBanner>
        <WatchAlongWrapper>
          {watchAlongComponent}
          {showGame && pendingGameType && (
            <GameContainer>
              {pendingGameType === 'tictactoe' ? (
                <GameTicTacToe
                  isFirstPlayer={socket?.id === firstPlayerId}
                  socket={socket}
                  partnerId={gamePartnerId || partnerId}
                  onGameEnd={onGameExit}
                />
              ) : pendingGameType === 'rps' ? (
                <GameRPS
                  isFirstPlayer={socket?.id === firstPlayerId}
                  socket={socket}
                  partnerId={gamePartnerId || partnerId}
                  onGameEnd={onGameExit}
                />
              ) : (
                <GameChess
                  isFirstPlayer={socket?.id === firstPlayerId}
                  socket={socket}
                  partnerId={gamePartnerId || partnerId}
                  onGameEnd={onGameExit}
                />
              )}
            </GameContainer>
          )}
          {showGameChoiceModal && (
            <GameChoiceModal>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
              <GameChoiceTitle>Choose a Game</GameChoiceTitle>
              <GameChoiceDescription>
                What would you like to play with your partner?
              </GameChoiceDescription>
              <GameChoiceButtons>
                <GameChoiceButton onClick={() => onChooseGameType('tictactoe')}>
                  <span style={{ fontSize: '1.3rem' }}>❌⭕</span>
                  Tic Tac Toe
                </GameChoiceButton>
                <GameChoiceButton onClick={() => onChooseGameType('rps')}>
                  <span style={{ fontSize: '1.3rem' }}>✊✋✌️</span>
                  Rock Paper Scissors
                </GameChoiceButton>
                <GameChoiceButton onClick={() => onChooseGameType('chess')}>
                  <span style={{ fontSize: '1.3rem' }}>♟️</span>
                  Chess
                </GameChoiceButton>
              </GameChoiceButtons>
              <CancelButton onClick={onCancelGameChoice}>
                Cancel
              </CancelButton>
            </GameChoiceModal>
          )}
        </WatchAlongWrapper>
      </CenterContainer>
      
      <VideoContainer>
        <Video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
        />
        {!isRemoteVideoReady && <Status>Loading remote video...</Status>}
      </VideoContainer>
    </VideoGridContainer>
  );
});

export default VideoGrid;