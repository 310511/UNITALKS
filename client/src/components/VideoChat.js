import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import ConnectionButton from './VideoChatParts/ConnectionButton';
import VideoControls from './VideoChatParts/VideoControls';
import MusicTogether from './common-components/MusicTogether';
import NameHeader from './common-components/NameHeader';
import SidebarControls from './VideoChatParts/SidebarControls';
import Notification from './common-components/Notification';
import { PageWrapper, VideoCard } from './VideoChatParts/StyledComponents';
import styled from 'styled-components';
import GameTicTacToe from './common-components/GameTicTacToe';
import GameRPS from './common-components/GameRPS';
import GameTruthOrDare from './common-components/GameTruthOrDare';
import GameChess from './common-components/GameChess';
import useRandomOnlineCount from '../hooks/useRandomOnlineCount';
import getRtcConfig from '../webrtcConfig';
import StickmanScene from './common-components/StickmanScene';
import SearchOverlay from './common-components/SearchOverlay';
import ConnectingPreview from './common-components/ConnectingPreview';
import Scoreboard from './common-components/Scoreboard';

// Additional styled components for the new UI
const DockContainer = styled.div`
  position: sticky;
  bottom: 16px;
  display: inline-flex;
  justify-content: flex-start;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0.6rem;
  background: linear-gradient(135deg, rgba(2,6,23,0.7) 0%, rgba(17,24,39,0.85) 100%);
  border-radius: 14px;
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 10px 24px rgba(29,185,84,0.18);
  z-index: 20;
  
  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
    padding: 10px 12px;
    gap: 12px;
    justify-content: space-around;
  }
`;

// Homepage-like hero copy for connection state
const Kicker = styled.div`
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;
  color: #8ef1b8; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; font-size: .9rem;
  background: rgba(29,185,84,.12); border: 1px solid rgba(29,185,84,.35); padding: 6px 10px; border-radius: 999px;
`;

const Headline = styled.h2`
  font-size: clamp(1.9rem, 3.6vw, 2.4rem);
  line-height: 1.05; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 10px;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 60%, #8ef1b8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
`;

const Highlight = styled.span`
  display: inline-block; transform: rotate(-2deg); padding: 2px 10px;
  background: rgba(29,185,84,.12); border: 1px solid rgba(29,185,84,.35); border-radius: 10px; color: #1DB954; -webkit-text-fill-color: #1DB954; font-weight: 900;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary}; font-size: 1.05rem; line-height: 1.7; margin: 0 0 18px;
`;



// Bottom row layout for Watch Along: [Local Mini Video] [Controls] [Remote Mini Video]
const BottomRow = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 140px 1fr 140px;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
  
  @media (max-width: 1280px) {
    grid-template-columns: 120px 1fr 120px;
  }
`;

const MiniVideo = styled.div`
  width: 100%;
  height: 96px;
  background: ${({ theme }) => theme.colors.black};
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  
  @media (max-width: 1280px) {
    height: 82px;
  }
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StatusChip = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(17,24,39,0.9);
  border: 1px solid rgba(29,185,84,0.3);
  border-radius: 20px;
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 15;
  backdrop-filter: blur(8px);
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: clamp(960px, 92vw, 1280px);
  aspect-ratio: 16/9;
  /* Keep the video visible with controls + ad without scrolling */
  height: calc(100vh - 260px);
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.appBg};
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  
  &:hover {
   box-shadow: 0 10px 40px rgba(29,185,84,0.12);
  }
`;

// Reserve ad space under desktop video to prevent layout jumps


// Container to show Watch Along and Games on desktop


// Full-bleed overlay grid for game mode inside VideoContainer
const GameSplitGrid = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
`;

const LeftStackGrid = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
`;

const GameTile = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.black};
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
`;

const LocalVideoPiP = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 22%;
  min-width: 160px;
  max-width: 240px;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  cursor: move;
  z-index: 10;
  
  @media (max-width: 768px) {
    width: 30%;
    min-width: 120px;
    bottom: 80px;
    right: 12px;
  }
`;

// Removed RemoteVideoPiP overlay (no hovering videos over player)
// Small spinner to show lightweight loading inside video only
const SmallSpinner = styled.div`
  width: 36px;
  height: 36px;
  border: 4px solid rgba(255,255,255,0.2);
  border-top-color: #1DB954;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ControlButton = styled.button`
  width: ${props => props.$primary ? '52px' : '44px'};
  height: ${props => props.$primary ? '52px' : '44px'};
  border-radius: 50%;
  border: 1px solid ${props => props.$danger ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'};
  background: ${props => {
    if (props.$danger) return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    if (props.$accent) return 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)';
    return 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(18,18,18,0.85) 100%)';
  }};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    border-color: ${props => props.$danger ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)'};
  }
  
  &:active {
    transform: translateY(0px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: ${props => props.$primary ? '58px' : '52px'};
    height: ${props => props.$primary ? '58px' : '52px'};
  }
`;



// Icon base for professional look (Feather-style)
const Icon = styled.svg`
  width: 22px;
  height: 22px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const ControlItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
`;

const ControlLabel = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  letter-spacing: 0.2px;
`;

// Professional inline icons (stroke-only, currentColor)
const MicIcon = (props) => (
  <Icon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="9" y="3" width="6" height="10" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Icon>
);

const MicOffIcon = (props) => (
  <Icon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="9" y="3" width="6" height="10" rx="3" />
    <path d="M5 11a7 7 0 0 0 9 6" />
    <path d="M12 18v3" />
    <path d="M4 4l16 16" />
  </Icon>
);



const SkipIcon = (props) => (
  <Icon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <polygon points="5,8 13,12 5,16" />
    <polygon points="11,8 19,12 11,16" />
  </Icon>
);

const StopIcon = (props) => (
  <Icon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="8" y="8" width="8" height="8" rx="2" />
  </Icon>
);



// Simple gamepad icon
const GameIcon = (props) => (
  <Icon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="4" y="9" width="16" height="8" rx="4" />
    <path d="M8 13h2" />
    <path d="M9 12v2" />
    <circle cx="15.5" cy="12.5" r="1" />
    <circle cx="17.5" cy="14.5" r="1" />
  </Icon>
);

// Music note icon
const MusicIcon = (props) => (
  <Icon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M9 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
    <path d="M12 3v12" />
    <path d="M12 3l8 2v8" />
    <path d="M20 13a3 3 0 1 1-2-2.83" />
  </Icon>
);

const Shimmer = styled.div`
  position: absolute; 
  inset: 0; 
  border-radius: 12px; 
  overflow: hidden;
  background: linear-gradient(90deg, rgba(30,41,59,0.4) 0%, rgba(59,130,246,0.15) 50%, rgba(30,41,59,0.4) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  @keyframes shimmer { 
    from { background-position: 200% 0; } 
    to { background-position: -200% 0; } 
  }
`;



// Desktop layout: side ads + centered video
const VideoRow = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 60px auto;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 12px;
  align-items: start;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const SideAdSlot = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 600px;
  position: relative;
  @media (max-width: 1280px) {
    display: none;
  }
`;

// Chessboard-style ad grid for development/local preview
// Clamp ad height so it never goes below control buttons visually
const AdClamp = styled.div`
  width: 200px;
  height: 1000px;
  max-height: calc(100vh - 220px);
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 10px 24px rgba(0,0,0,0.3);
`;

const AdFrame = styled.iframe.attrs({ scrolling: 'no' })`
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: transparent;
  overflow: hidden;
`;

const AD_SCRIPT_SRC = "//pl27412824.profitableratecpm.com/6c9599f0cdd3c07e95cc091274943889/invoke.js";
const AD_CONTAINER_ID = "container-6c9599f0cdd3c07e95cc091274943889";

// Desktop game mode layout: videos stacked on left, game on right


// Add styled components for connection page (copied and adapted from TextChat.js)
const ConnectionPage = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 90px 0 140px; /* uniform visual gap under header */
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.appBg};
  z-index: 1;
  margin: 0 auto;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 80% at 50% 20%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%),
      radial-gradient(600px 300px at 50% 10%, rgba(29,185,84,0.15), rgba(0,0,0,0) 60%);
  }

  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.2; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  }
`;

const ConnectionCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(29, 185, 84, 0.35);
  border-radius: 18px;
  padding: 2.25rem;
  text-align: center;
  max-width: 500px;
  width: 90%;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 40px rgba(29, 185, 84, 0.12);

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 0 1rem;
  }
`;

const ConnectionIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.2rem;
  display: block;
`;

const ConnectionTitle = styled.h2`
  font-size: 1.9rem;
  font-weight: 900;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const ConnectionDescription = styled.p`
  font-size: 1.05rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1.75rem;
  line-height: 1.7;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

// Mobile-specific styled components for VideoChat
const DesktopLayout = styled.div`
  display: block;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileLayout = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobilePageWrapper = styled.div`
  @media (max-width: 768px) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
    padding-top: 80px;
    padding-bottom: 80px;
    background: ${({ theme }) => theme.colors.surface};
    overflow-y: hidden; /* prevent page scroll */
    position: relative;
  }
`;

// MobileVideoHeader removed



const MobileVideoContainer = styled.div`
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100vw;
    padding: 0 1rem;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const MobileStrangerVideo = styled.div`
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16/9;
    background: ${({ theme }) => theme.colors.black};
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
`;

const MobileUserVideo = styled.div`
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16/9;
    background: ${({ theme }) => theme.colors.black};
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
`;

const MobileVideoControls = styled.div`
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 1.5rem;
  }
`;

const MobilePlayAlongContainer = styled.div`
  @media (max-width: 768px) {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
  }
`;



function clearAllLocalStorage() {
  // Clear all localStorage items
  localStorage.clear();
}

// Wrapper for game overlays (e.g. chess) inside VideoContainer
const VideoWatchAlongWrapper = styled.div`
  width: 100%;
  height: 100%;
  margin: 0;
  & > div {
    top: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const socketOptions = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
};

function VideoChat({ setOnlineUsers }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState(null);
  const [textChatStatus, setTextChatStatus] = useState('idle'); // idle, requesting, received
  const [voiceCallStatus, setVoiceCallStatus] = useState('idle'); // idle, requesting, received
  const [showTextChatInvitation, setShowTextChatInvitation] = useState(false);
  const [showVoiceCallInvitation, setShowVoiceCallInvitation] = useState(false);
  // Songs invitations reuse the existing game invite flow with a new type 'music'
  const [onlineCount, setOnlineCount] = useState(0);
  const randomOnlineCount = useRandomOnlineCount();
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [pendingGameType, setPendingGameType] = useState(null);
  const [gamePartnerId, setGamePartnerId] = useState(null);
  const [firstPlayerId, setFirstPlayerId] = useState(null);
  const [scores, setScores] = useState({ you: 0, partner: 0, lastGame: '', lastWinnerLabel: '' });
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showGameChoiceModal, setShowGameChoiceModal] = useState(false);
  const [showWatchAlongMessage, setShowWatchAlongMessage] = useState(false);
  const [showGameInviteReceived, setShowGameInviteReceived] = useState(false);
  const [showGameInviteSent, setShowGameInviteSent] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, title: '', message: '', icon: '' });
  const [prewarmedStream, setPrewarmedStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [isLocalVideoReady, setIsLocalVideoReady] = useState(false);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);
  const [isVideoElementsMounted, setIsVideoElementsMounted] = useState(false);
  const [modeTransition, setModeTransition] = useState(null);
  const [error, setError] = useState(null);
  // Invite/feature coordination guards
  const gameInviteActiveRef = useRef(null); // { type: 'chess' | 'rps' | 'tictactoe' | 'tod' | 'music' }
  const [showConnectingPreview, setShowConnectingPreview] = useState(false);
  const previewStreamRef = useRef(null);
  const [allowConnect, setAllowConnect] = useState(false);
  const peerConnectedRef = useRef(false);
  const [expandedView, setExpandedView] = useState('none'); // 'none', 'local', 'remote'
  const lastScoreTime = useRef(0);

  const toggleExpand = (type) => {
    setExpandedView(prev => prev === type ? 'none' : type);
  };

  const updateScore = useCallback((winner, gameName) => {
    const now = Date.now();
    if (now - lastScoreTime.current < 1000) {
      return;
    }
    lastScoreTime.current = now;
    setScores(prev => ({
      you: winner === 'you' ? prev.you + 1 : prev.you,
      partner: winner === 'partner' ? prev.partner + 1 : prev.partner,
      lastGame: gameName,
      lastWinnerLabel: winner === 'you' ? 'You won' : 'Partner won'
    }));
    setShowScoreboard(true);
  }, []);

  const showNotification = useCallback((title, message, icon = "ℹ️") => {
    setNotification({ isVisible: true, title, message, icon });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification({ isVisible: false, title: '', message: '', icon: '' });
  }, []);

  const showNotificationRef = useRef(showNotification);
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRefDesktop = useRef(null);
  const remoteVideoRefDesktop = useRef(null);
  const localVideoRefMobile = useRef(null);
  const remoteVideoRefMobile = useRef(null);
  const partnerIdRef = useRef(null);
  const initiatorRef = useRef(false);

  // Keep latest stream/state values for socket event handlers (avoid stale closures)
  const streamRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  useEffect(() => { streamRef.current = stream; }, [stream]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { remoteStreamRef.current = remoteStream; }, [remoteStream]);
  const pendingSignalsRef = useRef([]);
  const startButtonRef = useRef(null);
  const textChatTimeoutRef = useRef(null);
  const voiceCallTimeoutRef = useRef(null);
  const prewarmedStreamRef = useRef(null);


  // Core control functions - defined early to avoid initialization errors

  // Helper to reset all feature states
  const resetAllFeatures = () => {
    setShowGame(false);
    setShowGameInviteReceived(false);
    setShowGameInviteSent(false);
    setPendingGameType(null);
    setGamePartnerId(null);
    setFirstPlayerId(null);
    setShowGameChoiceModal(false);
    gameInviteActiveRef.current = null;
    setTextChatStatus('idle');
    setVoiceCallStatus('idle');
    if (textChatTimeoutRef.current) {
      clearTimeout(textChatTimeoutRef.current);
      textChatTimeoutRef.current = null;
    }
    if (voiceCallTimeoutRef.current) {
      clearTimeout(voiceCallTimeoutRef.current);
      voiceCallTimeoutRef.current = null;
    }
  };

  const toggleMute = () => {
    if (stream) {
      const newState = !isMuted;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !newState;
      });
      setIsMuted(newState);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const newState = !isVideoOff;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !newState;
      });
      setIsVideoOff(newState);
    }
  };

  const handleWatchAlongClick = () => {
    // Only show if connected
    if (!isConnected || connectionStatus !== 'connected') return;
    setShowWatchAlongMessage(true);
  };

  const handleSkip = () => {
    // Directly confirm skip without showing a confirmation prompt
    confirmSkip();
  };

  const handleStop = () => {
    // Notify partner that we're ending the call
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('partnerSkipped', { to: partnerIdRef.current });
    }

    // Basic cleanup without calling the full cleanup function
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    pendingSignalsRef.current = [];
    partnerIdRef.current = null;
    initiatorRef.current = false;
    setIsConnected(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setConnectionStatus('idle');
    setIsLocalVideoReady(false);
    setIsRemoteVideoReady(false);
    setTextChatStatus('idle');
    setVoiceCallStatus('idle');
    setModeTransition(null);
    // Clear any pending timeouts
    if (textChatTimeoutRef.current) {
      clearTimeout(textChatTimeoutRef.current);
      textChatTimeoutRef.current = null;
    }
    if (voiceCallTimeoutRef.current) {
      clearTimeout(voiceCallTimeoutRef.current);
      voiceCallTimeoutRef.current = null;
    }
  };

  const [pipPos, setPipPos] = useState({ x: null, y: null });
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Helper function to assign stream to video elements - defined early to avoid initialization errors
  const assignStreamToVideoElements = (stream, isLocal = true) => {
    const videoElements = [];

    // Add desktop video elements
    if (isLocal) {
      if (localVideoRefDesktop.current) videoElements.push(localVideoRefDesktop.current);
      if (localVideoRefMobile.current) videoElements.push(localVideoRefMobile.current);
    } else {
      if (remoteVideoRefDesktop.current) videoElements.push(remoteVideoRefDesktop.current);
      if (remoteVideoRefMobile.current) videoElements.push(remoteVideoRefMobile.current);
    }

    // In game mode, the same refs are used but DOM structure changes; retry if needed

    videoElements.forEach((videoElement, index) => {
      try {
        videoElement.srcObject = stream;

        const playVideo = async () => {
          try {
            await videoElement.play();
            if (isLocal) {
              setIsLocalVideoReady(true);
            } else {
              setIsRemoteVideoReady(true);
            }
          } catch (err) {
            // Error playing video
          }
        };

        if (videoElement.readyState >= 2) {
          playVideo();
        } else {
          videoElement.onloadedmetadata = playVideo;
        }
      } catch (err) {
        // Error setting video stream
      }
    });

    // Second pass after a short delay in case layout just changed
    setTimeout(() => {
      videoElements.forEach((videoElement) => {
        if (!videoElement) return;
        try {
          if (videoElement.srcObject !== stream) {
            videoElement.srcObject = stream;
          }
          videoElement.play().catch(() => { });
        } catch (_) { }
      });
    }, 150);
  };

  // PiP drag functionality
  const handlePiPMouseDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePiPMouseMove = (e) => {
    if (!draggingRef.current) return;

    const container = e.currentTarget.closest('.video-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const pipWidth = 160; // min-width of PiP
    const pipHeight = 90; // aspect ratio 16:9

    let newX = e.clientX - containerRect.left - dragOffsetRef.current.x;
    let newY = e.clientY - containerRect.top - dragOffsetRef.current.y;

    // Constrain to container bounds
    newX = Math.max(0, Math.min(newX, containerRect.width - pipWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - pipHeight));

    setPipPos({ x: newX, y: newY });
  };

  const handlePiPMouseUp = () => {
    draggingRef.current = false;
  };

  // Keyboard shortcuts removed per requirement

  // Check if video elements are mounted
  useEffect(() => {
    const checkVideoElements = () => {
      const localDesktopMounted = !!localVideoRefDesktop.current;
      const remoteDesktopMounted = !!remoteVideoRefDesktop.current;
      const localMobileMounted = !!localVideoRefMobile.current;
      const remoteMobileMounted = !!remoteVideoRefMobile.current;

      const anyLocalMounted = localDesktopMounted || localMobileMounted;
      const anyRemoteMounted = remoteDesktopMounted || remoteMobileMounted;
      setIsVideoElementsMounted(anyLocalMounted && anyRemoteMounted);

      // Add event listeners to track stream assignment for all video elements
      const videoElements = [
        { ref: localVideoRefDesktop, name: 'localDesktop' },
        { ref: remoteVideoRefDesktop, name: 'remoteDesktop' },
        { ref: localVideoRefMobile, name: 'localMobile' },
        { ref: remoteVideoRefMobile, name: 'remoteMobile' }
      ];

      videoElements.forEach(({ ref, name }) => {
        if (ref.current) {
          ref.current.addEventListener('loadedmetadata', () => {
            // Video loaded metadata
          });
          ref.current.addEventListener('canplay', () => {
            // Video can play
          });
        }
      });

      // If streams are available but video elements are not ready, retry after a delay
      if ((localStream || remoteStream) && (!anyLocalMounted || !anyRemoteMounted)) {
        setTimeout(() => {
          if (localStream) {
            assignStreamToVideoElements(localStream, true);
          }
          if (remoteStream) {
            assignStreamToVideoElements(remoteStream, false);
          }
        }, 500);
      }
    };

    // Check immediately
    checkVideoElements();

    // Set up a mutation observer to watch for video elements
    const observer = new MutationObserver(checkVideoElements);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [localStream, remoteStream]);

  // Force re-check when connection status changes
  useEffect(() => {
    if (isConnected) {
      // Try multiple times to catch elements entering DOM
      [100, 500, 1000, 2000].forEach(delay => {
        setTimeout(() => {
          const localDesktopMounted = !!localVideoRefDesktop.current;
          const remoteDesktopMounted = !!remoteVideoRefDesktop.current;
          const localMobileMounted = !!localVideoRefMobile.current;
          const remoteMobileMounted = !!remoteVideoRefMobile.current;
  
          const anyLocalMounted = localDesktopMounted || localMobileMounted;
          const anyRemoteMounted = remoteDesktopMounted || remoteMobileMounted;
          setIsVideoElementsMounted(anyLocalMounted && anyRemoteMounted);
  
          // Ensure video elements are properly connected to streams
          if (localStreamRef.current) {
            assignStreamToVideoElements(localStreamRef.current, true);
          }
  
          if (remoteStreamRef.current) {
            assignStreamToVideoElements(remoteStreamRef.current, false);
          }
        }, delay);
      });
    } else {
      // Reset video ready states when disconnected
      setIsLocalVideoReady(false);
      setIsRemoteVideoReady(false);
    }
  }, [isConnected, expandedView]);

  // Ensure video elements are properly initialized when streams are available
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      const videoElement = localVideoRef.current;
      videoElement.srcObject = localStream;

      // Ensure the video plays
      const playVideo = async () => {
        try {
          await videoElement.play();
          setIsLocalVideoReady(true);
        } catch (err) {
        }
      };

      if (videoElement.readyState >= 2) {
        playVideo();
      } else {
        videoElement.onloadedmetadata = playVideo;
      }
    }
  }, [localStream, localVideoRef.current]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      const videoElement = remoteVideoRef.current;
      videoElement.srcObject = remoteStream;

      // Ensure the video plays
      const playVideo = async () => {
        try {
          await videoElement.play();
          setIsRemoteVideoReady(true);
        } catch (err) {
          // Error playing remote video
        }
      };

      if (videoElement.readyState >= 2) {
        playVideo();
      } else {
        videoElement.onloadedmetadata = playVideo;
      }
    }
  }, [remoteStream, remoteVideoRef.current]);



  // Handle local video stream
  useEffect(() => {
    if (localStream) {
      assignStreamToVideoElements(localStream, true);
    }
  }, [localStream]);

  // Debug video ready states
  useEffect(() => {
    // Video ready states changed
  }, [isLocalVideoReady, isRemoteVideoReady, localStream, remoteStream, isConnected]);

  // Additional fallback for local video initialization
  useEffect(() => {
    if (localStream && isConnected) {
      const checkAndConnectLocalVideo = () => {
        assignStreamToVideoElements(localStream, true);
      };

      // Check immediately and after a delay
      checkAndConnectLocalVideo();
      setTimeout(checkAndConnectLocalVideo, 2000);
    }
  }, [localStream, isConnected]);

  // Handle remote video stream
  useEffect(() => {
    if (remoteStream) {
      assignStreamToVideoElements(remoteStream, false);
    }
  }, [remoteStream]);

  // Additional fallback for remote video initialization
  useEffect(() => {
    if (remoteStream && isConnected) {
      const checkAndConnectRemoteVideo = () => {
        assignStreamToVideoElements(remoteStream, false);
      };

      // Check immediately and after a delay
      checkAndConnectRemoteVideo();
      setTimeout(checkAndConnectRemoteVideo, 2000);
    }
  }, [remoteStream, isConnected]);

  // Re-attach streams when toggling game layout to avoid black video due to new DOM nodes
  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => {
      if (localStream) {
        assignStreamToVideoElements(localStream, true);
      }
      if (remoteStream) {
        assignStreamToVideoElements(remoteStream, false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [showGame, isConnected, localStream, remoteStream]);

  // Socket lifecycle
  useEffect(() => {
    const socket = io(SOCKET_URL, socketOptions);
    socketRef.current = socket;

    socket.on('connect', () => {
      setError(null);

      // Check for partnerId in query string for direct video calls
      const searchParams = new URLSearchParams(window.location.search);
      const partnerId = searchParams.get('partnerId');

      if (partnerId) {
        socket.emit('joinQueue', { mode: 'video', partnerId });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('VideoChat: Connection error:', err);
      setError('Unable to connect to server. Retrying...');
      setConnectionStatus('idle');
    });

    // Ignore server-sent user counts; we simulate locally

    socket.on('match', ({ partnerId, initiator }) => {
      partnerIdRef.current = partnerId;
      initiatorRef.current = initiator;
      setConnectionStatus('establishing');
      // Show preview and wait for user (or timer) to accept
      setShowConnectingPreview(true);
      setAllowConnect(false);
      initializePeer(initiator, partnerId);
    });

    socket.on('signal', ({ from, signal }) => {
      if (!peerRef.current) {
        pendingSignalsRef.current.push(signal);
        return;
      }

      try {
        // Accept both SDP (offer/answer) and ICE candidates
        peerRef.current.signal(signal);
      } catch (err) {
        setError('Signal error. Restarting...');
        cleanup();
      }
    });

    socket.on('partnerDisconnected', () => {
      // Clean up current connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      const currentStream = streamRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.stop();
        });
        setStream(null);
        streamRef.current = null;
      }
      const currentLocalStream = localStreamRef.current;
      if (currentLocalStream) {
        currentLocalStream.getTracks().forEach(track => {
          track.stop();
        });
        setLocalStream(null);
        localStreamRef.current = null;
      }
      const currentRemoteStream = remoteStreamRef.current;
      if (currentRemoteStream) {
        currentRemoteStream.getTracks().forEach(track => {
          track.stop();
        });
        setRemoteStream(null);
        remoteStreamRef.current = null;
      }

      // Reset state
      pendingSignalsRef.current = [];
      partnerIdRef.current = null;
      initiatorRef.current = false;
      setIsConnected(false);
      setIsMuted(false);
      setIsVideoOff(false);
      setConnectionStatus('finding'); // Set to finding instead of idle
      setTextChatStatus('idle');
      setVoiceCallStatus('idle');
      setModeTransition(null);
      // Close any active features / invites
      setShowGame(false);
      setShowGameInviteReceived(false);
      setShowGameInviteSent(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
      setScores({ you: 0, partner: 0, lastGame: '', lastWinnerLabel: '' });
      setShowScoreboard(false);
      gameInviteActiveRef.current = null;

      // Clear timeouts
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
        textChatTimeoutRef.current = null;
      }
      if (voiceCallTimeoutRef.current) {
        clearTimeout(voiceCallTimeoutRef.current);
        voiceCallTimeoutRef.current = null;
      }

      // Show notification first
      showNotificationRef.current?.('Partner Disconnected', 'Your partner has disconnected. Starting search for a new partner...', '🔌');

      // After a short delay, transition to connection page and start searching
      setTimeout(() => {
        setIsConnected(false);
        setConnectionStatus('finding');

        // Automatically start searching for a new user
        if (socketRef.current) {
          socketRef.current.emit('joinQueue', 'video');
        }
      }, 2000); // 2 second delay to show notification
    });

    socket.on('partnerSkipped', () => {
      // Complete cleanup when partner skips
      cleanup(true).then(() => {
        // Reset all connection states
        setIsConnected(false);
        setConnectionStatus('idle');
        setRemoteStream(null);
        setIsRemoteVideoReady(false);
        pendingSignalsRef.current = [];
        partnerIdRef.current = null;
        initiatorRef.current = false;

        // Reset collaborative features
        setShowGame(false);
        setPendingGameType(null);
        setGamePartnerId(null);
        setFirstPlayerId(null);

        // Reset UI states
        setShowConnectingPreview(false);
        setAllowConnect(false);
        peerConnectedRef.current = false;

        // Reset other states
        setIsMuted(false);
        setIsVideoOff(false);
        setTextChatStatus('idle');
        setVoiceCallStatus('idle');
        setModeTransition(null);

        // Clear timeouts
        if (textChatTimeoutRef.current) {
          clearTimeout(textChatTimeoutRef.current);
          textChatTimeoutRef.current = null;
        }
        if (voiceCallTimeoutRef.current) {
          clearTimeout(voiceCallTimeoutRef.current);
          voiceCallTimeoutRef.current = null;
        }

        // Show notification
        showNotificationRef.current?.('Partner Skipped', 'Your partner has skipped to another user. Starting search for a new partner...', '⏭️');

        // Rejoin queue to find new partner
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.emit('joinQueue', 'video');
          }
        }, 300);
      });
    });

    // Text chat request events
    socket.on('textChatRequestReceived', ({ from }) => {
      // Reset any active features first
      resetAllFeatures();
      setTextChatStatus('received');
      setShowTextChatInvitation(true);
    });

    socket.on('textChatAccepted', ({ from }) => {
      setTextChatStatus('idle');
      setModeTransition('text'); // Set mode transition state
      // Clear timeout since request was accepted
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
        textChatTimeoutRef.current = null;
      }
      window.location.href = `/text?partnerId=${from}`;
    });

    socket.on('textChatDeclined', () => {
      setTextChatStatus('idle');
      // Clear timeout since request was declined
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
        textChatTimeoutRef.current = null;
      }
      showNotification('Request Declined', 'The user declined your text chat request.', '💬');
    });

    // Voice call request events
    socket.on('voiceCallRequestReceived', ({ from }) => {
      // Reset any active features first
      resetAllFeatures();
      setVoiceCallStatus('received');
      setShowVoiceCallInvitation(true);
    });

    socket.on('voiceCallAccepted', ({ from }) => {
      setVoiceCallStatus('idle');
      setModeTransition('voice'); // Set mode transition state
      // Clear timeout since request was accepted
      if (voiceCallTimeoutRef.current) {
        clearTimeout(voiceCallTimeoutRef.current);
        voiceCallTimeoutRef.current = null;
      }
      window.location.href = `/voice?partnerId=${from}`;

    });

    socket.on('voiceCallDeclined', () => {
      setVoiceCallStatus('idle');
      // Clear timeout since request was declined
      if (voiceCallTimeoutRef.current) {
        clearTimeout(voiceCallTimeoutRef.current);
        voiceCallTimeoutRef.current = null;
      }
      showNotification('Request Declined', 'The user declined your voice call request.', '📞');
    });

    // Partner requests switching feature: close the other one locally
    socket.on('feature-switch', ({ feature }) => {
      if (feature === 'game') {
        // No-op, watch removed
      } else if (feature === 'music') {
        // Fallback handling: partner wants to open music together
        setShowGame(true);
        setPendingGameType('music');
      }
    });

    socket.on('gameInvitation', ({ from, gameType, firstPlayerId }) => {
      // Reset any active features first
      resetAllFeatures();
      if (showGame) return;
      gameInviteActiveRef.current = { type: gameType };
      setShowGameInviteReceived(true);
      setPendingGameType(gameType);
      setGamePartnerId(from);
      setFirstPlayerId(firstPlayerId);
    });
    socket.on('gameAccepted', ({ from, gameType, firstPlayerId }) => {
      setShowGameInviteSent(false);
      setShowGame(true);
      setPendingGameType(gameType);
      setGamePartnerId(from);
      setFirstPlayerId(firstPlayerId);
      gameInviteActiveRef.current = null;
    });
    socket.on('gameDeclined', ({ from, gameType }) => {
      setShowGameInviteSent(false);
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
      gameInviteActiveRef.current = null;
      showNotificationRef.current?.('Request Declined', 'Your partner declined the game invitation.', '🎮');
    });
    socket.on('game-exit', () => {
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
      gameInviteActiveRef.current = null;
    });
    const handleGameScore = ({ from, winner, game }) => {
      if (from !== (gamePartnerId || partnerIdRef.current)) return;
      const gameNames = { tictactoe: 'Tic Tac Toe', rps: 'Rock Paper Scissors', chess: 'Chess', truthordare: 'Truth or Dare' };
      const gameName = gameNames[game] || game;
      const mirroredWinner = winner === 'partner' ? 'you' : 'partner';
      updateScore(mirroredWinner, gameName);
    };
    socket.on('gameScore', handleGameScore);

    return () => {
      if (socket) {
        socket.off('gameScore', handleGameScore);
        socket.removeAllListeners?.();
        socket.close();
      }
      // Clean up timeout on unmount
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
      }
      if (voiceCallTimeoutRef.current) {
        clearTimeout(voiceCallTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChatAccept = () => {
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('textChatAccepted', { to: partnerIdRef.current });
      window.location.href = `/text?partnerId=${partnerIdRef.current}`;
    }
    setShowTextChatInvitation(false);
    setTextChatStatus('idle');
  };

  const handleTextChatDecline = () => {
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('textChatDeclined', { to: partnerIdRef.current });
    }
    setShowTextChatInvitation(false);
    setTextChatStatus('idle');
  };

  const handleVoiceCallAccept = () => {
    if (socketRef.current && partnerIdRef.current) {
      localStorage.setItem('isVoiceCallInitiator', 'true');
      socketRef.current.emit('voiceCallAccepted', { to: partnerIdRef.current });
      window.location.href = `/voice?partnerId=${partnerIdRef.current}`;
    }
    setShowVoiceCallInvitation(false);
    setVoiceCallStatus('idle');
  };

  const handleVoiceCallDecline = () => {
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('voiceCallDeclined', { to: partnerIdRef.current });
    }
    setShowVoiceCallInvitation(false);
    setVoiceCallStatus('idle');
  };

  const handleSongs = () => {
    // Reuse the game invitation modal flow, but with gameType 'rps' UI containing music player.
    // So we simply open the game chooser equivalent by directly sending a 'music' invitation.
    if (socketRef.current && partnerIdRef.current) {
      // Block if another invite is active
      if (showGameInviteReceived || showGameInviteSent) return;
      // Send a custom invitation using the existing gameInvitation channel
      setPendingGameType('music');
      setShowGameInviteSent(true);
      socketRef.current.emit('gameInvitation', { to: partnerIdRef.current, gameType: 'music', firstPlayerId: socketRef.current.id });
      gameInviteActiveRef.current = { type: 'music' };
    }
  };

  const handleGameClick = () => {
    // Reset other features first
    if (textChatStatus !== 'idle' || voiceCallStatus !== 'idle') {
      resetAllFeatures();
    }

    // Block if any invite modal is active to avoid race conditions
    if (showGameInviteReceived || showGameInviteSent) return;

    if (!showGame && socketRef.current && partnerIdRef.current) {
      setShowGameChoiceModal(true);
    } else {
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
    }
  };

  const handleChooseGameType = (gameType) => {

    setShowGameChoiceModal(false);
    setShowGameInviteSent(true);
    // Send game invitation
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('gameInvitation', {
        to: partnerIdRef.current,
        gameType,
        firstPlayerId: socketRef.current.id
      });
    }
  };

  const handleCancelGameChoice = () => {
    setShowGameChoiceModal(false);
  };



  const handleAcceptGame = () => {

    setShowGameInviteReceived(false);
    setShowGame(true);
    socketRef.current.emit('gameAccepted', {
      to: gamePartnerId,
      gameType: pendingGameType,
      firstPlayerId: firstPlayerId
    });
  };

  const handleDeclineGame = () => {
    setShowGameInviteReceived(false);
    setShowGame(false);
    setPendingGameType(null);
    setGamePartnerId(null);
    setFirstPlayerId(null);
    socketRef.current.emit('gameDeclined', {
      to: gamePartnerId,
      gameType: pendingGameType
    });
  };

  // Auto-click logic for video call initiators
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('partnerId') && localStorage.getItem('isVideoCallInitiator') === 'true') {
      setTimeout(() => {
        if (startButtonRef.current) {
          startButtonRef.current.click();
          localStorage.removeItem('isVideoCallInitiator');
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    setOnlineCount(randomOnlineCount);
  }, [randomOnlineCount]);

  const cleanup = (skipMode = false) => {
    return new Promise((resolve) => {
      const cleanupTasks = [];
      if (peerRef.current) {
        cleanupTasks.push(new Promise((resolvePeer) => {
          try {
            peerRef.current.destroy();
            peerRef.current = null;
            resolvePeer();
          } catch (_) {
            peerRef.current = null;
            resolvePeer();
          }
        }));
      }

      const currentStream = streamRef.current;
      if (currentStream) {
        cleanupTasks.push(new Promise((resolveStream) => {
          try {
            // Keep local stream active during skip
            if (!skipMode) {
              currentStream.getTracks().forEach(track => track.stop());
              setStream(null);
              streamRef.current = null;
            }
          } catch (_) { }
          resolveStream();
        }));
      }

      const currentLocalStream = localStreamRef.current;
      if (currentLocalStream) {
        cleanupTasks.push(new Promise((resolveLocal) => {
          try {
            // Keep local stream active during skip
            if (!skipMode) {
              currentLocalStream.getTracks().forEach(track => track.stop());
              setLocalStream(null);
              localStreamRef.current = null;
            }
          } catch (_) { }
          resolveLocal();
        }));
      }

      const currentRemoteStream = remoteStreamRef.current;
      if (currentRemoteStream) {
        cleanupTasks.push(new Promise((resolveRemote) => {
          try {
            currentRemoteStream.getTracks().forEach(track => {
              track.stop();
            });
            setRemoteStream(null);
            remoteStreamRef.current = null;
          } catch (_) { }
          resolveRemote();
        }));
      }

      Promise.all(cleanupTasks).then(() => {
        pendingSignalsRef.current = [];
        partnerIdRef.current = null;
        initiatorRef.current = false;

        setShowGame(false);
        setPendingGameType(null);
        setGamePartnerId(null);
        setFirstPlayerId(null);

        if (!skipMode) {
          setConnectionStatus('idle');
          setIsConnected(false);
        }

        setIsMuted(false);
        setIsVideoOff(false);
        setIsLocalVideoReady(false);
        setIsRemoteVideoReady(false);
        setTextChatStatus('idle');
        setVoiceCallStatus('idle');

        if (textChatTimeoutRef.current) {
          clearTimeout(textChatTimeoutRef.current);
          textChatTimeoutRef.current = null;
        }
        if (voiceCallTimeoutRef.current) {
          clearTimeout(voiceCallTimeoutRef.current);
          voiceCallTimeoutRef.current = null;
        }

        resolve();
      });
    });
  };

  const playMatchSound = () => {
    const src = (process.env.PUBLIC_URL || '') + '/ting.mp3';
    try {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.muted = false;
      audio.play().catch(async () => {
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          audio.src = url;
          await audio.play();
          URL.revokeObjectURL(url);
        } catch (_) { }
      });
    } catch (_) { }
  };

  const initializePeer = async (initiator, partnerId) => {
    try {
      // Use pre-warmed stream if available; otherwise request media at target resolution
      let mediaStream = prewarmedStreamRef.current;
      
      // Check if the existing stream is still alive (all tracks not ended)
      const isStreamAlive = mediaStream && mediaStream.getTracks().every(t => t.readyState === 'live');
      
      if (!isStreamAlive) {
        console.log('[VideoChat] Local stream not alive or missing, re-acquiring...');
        // Clear if not alive to force re-acquisition
        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        prewarmedStreamRef.current = mediaStream;
        setPrewarmedStream(mediaStream);
      } else {
        console.log('[VideoChat] Using existing live local stream.');
      }

      // Get stream tracks for reference
      // Keep references to tracks if needed in future adjustments
      const videoTrack = mediaStream.getVideoTracks()[0]; // eslint-disable-line no-unused-vars
      const audioTrack = mediaStream.getAudioTracks()[0]; // eslint-disable-line no-unused-vars

      setStream(mediaStream);
      setLocalStream(mediaStream);

      // Ensure local video element is properly connected
      setTimeout(() => {
        assignStreamToVideoElements(mediaStream, true);
      }, 100);

      console.log('[VideoChat] Initializing new peer connection, initiator:', initiator);
      const peer = new SimplePeer({
        initiator,
        stream: mediaStream,
        trickle: true,
        config: getRtcConfig()
      });

      peer.on('signal', data => {
        if (socketRef.current?.connected && partnerId) {
          socketRef.current.emit('signal', { to: partnerId, signal: data });
        } else {
          console.warn('Cannot send signal - socket not connected or no partner ID');
        }
      });

      peer.on('stream', stream => {
        console.log('[VideoChat] Remote stream received.');
        setRemoteStream(stream);
        // route the preview stream too
        previewStreamRef.current = stream;

        // Force re-check video elements after stream is set
        setTimeout(() => {
          const localMounted = !!localVideoRef.current;
          const remoteMounted = !!remoteVideoRef.current;
          setIsVideoElementsMounted(localMounted && remoteMounted);

          // Ensure remote video element is properly connected
          assignStreamToVideoElements(stream, false);
        }, 500);
      });

      peer.on('connect', () => {
        setError(null);
        peerConnectedRef.current = true;
        if (allowConnect) {
          setIsConnected(true);
          setConnectionStatus('connected');
        } else {
          // remain in establishing until preview timer finishes
          setConnectionStatus('establishing');
        }
        playMatchSound();
        localStorage.removeItem('isVideoCallInitiator');
        while (pendingSignalsRef.current.length > 0) {
          const s = pendingSignalsRef.current.shift();
          if ((initiator && s.type === 'answer') || (!initiator && s.type === 'offer')) {
            peer.signal(s);
          }
        }
      });

      // Enhanced ICE state monitoring for recovery
      let iceRetryCount = 0;
      const MAX_ICE_RETRIES = 3;
      const ICE_RETRY_DELAY = 2000; // 2 seconds between retries

      const handleIceStateChange = () => {
        try {
          if (!peer._pc) {
            console.warn('Peer connection is null, cannot check ICE state');
            return;
          }
          const state = peer._pc.iceConnectionState;
          // (removed) noisy logging in production

          if ((state === 'failed' || state === 'disconnected') && socketRef.current && partnerIdRef.current) {
            if (iceRetryCount < MAX_ICE_RETRIES) {
              // (removed) noisy logging in production

              // Delay retry to allow for network recovery
              setTimeout(() => {
                if (peer._pc && typeof peer._pc.restartIce === 'function') {
                  peer._pc.restartIce();
                  socketRef.current.emit('webrtc-restart', { to: partnerIdRef.current });
                  iceRetryCount++;
                }
              }, ICE_RETRY_DELAY);
            } else {
              // (removed) noisy logging in production
              cleanup(true).then(() => {
                // After cleanup, attempt to rejoin queue
                if (socketRef.current) {
                  socketRef.current.emit('joinQueue', 'video');
                }
              });
            }
          } else if (state === 'connected') {
            // Reset retry count on successful connection
            iceRetryCount = 0;
          }
        } catch (err) {
          console.error('ICE state change error:', err);
        }
      };

      if (peer._pc && peer._pc.addEventListener) {
        peer._pc.addEventListener('iceconnectionstatechange', handleIceStateChange);

        // Also monitor connection state for additional reliability
        peer._pc.addEventListener('connectionstatechange', () => {
          try {
            if (!peer._pc) {
              console.warn('Peer connection is null, cannot check connection state');
              return;
            }
            const state = peer._pc.connectionState;
            // (removed) noisy logging in production

            if (state === 'failed') {
              handleIceStateChange(); // Trigger same recovery process
            }
          } catch (error) {
            console.error('Error in connection state change handler:', error);
          }
        });
      }

      // Handle remote ICE restart request
      const socket = socketRef.current;
      const restartHandler = () => {
        try {
          if (peer && peer._pc && typeof peer._pc.restartIce === 'function') {
            peer._pc.restartIce();
          }
        } catch (_) { }
      };
      socket && socket.on && socket.on('webrtc-restart', restartHandler);

      // Ensure we remove the listener when this peer instance is torn down
      const cleanupRestart = () => {
        socket && socket.off && socket.off('webrtc-restart', restartHandler);
      };
      peer.on('close', cleanupRestart);
      peer.on('error', cleanupRestart);

      peer.on('error', err => {
        console.error('Peer error:', err);
        setError('Connection error. Try again.');
        cleanup();
      });

      peer.on('close', () => {
        cleanup();
      });

      peerRef.current = peer;

      // Process any pending signals that arrived before the peer was created
      while (pendingSignalsRef.current.length > 0) {
        const s = pendingSignalsRef.current.shift();
        if ((initiator && s.type === 'answer') || (!initiator && s.type === 'offer')) {
          try {
            peer.signal(s);
          } catch (e) {
            // Ignore signaling errors; will retry on reconnection
          }
        }
      }
    } catch (err) {
      console.error('Media access error:', err);
      setError('Camera/mic access denied or unavailable: ' + err.message);
      setConnectionStatus('idle');
    }
  };

  const handleStart = () => {
    // Clear all localStorage before starting new search
    clearAllLocalStorage();

    // Pre-warm media immediately to avoid prompt delays later
    if (!prewarmedStreamRef.current) {
      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      }).then((s) => {
        prewarmedStreamRef.current = s;
        setPrewarmedStream(s);
        setLocalStream(s);
        assignStreamToVideoElements(s, true);
      }).catch(() => { });
    }

    setConnectionStatus('finding');
    if (socketRef.current) {
      socketRef.current.emit('leaveChat');
      setTimeout(() => {
        socketRef.current.emit('joinQueue', 'video');
      }, 50);
    }
  };



  const confirmSkip = () => {
    // Prevent multiple skips while processing
    if (connectionStatus === 'skipping') return;
    setConnectionStatus('skipping');
    setShowSkipConfirmation(false);

    // Notify partner that we're skipping
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('partnerSkipped', { to: partnerIdRef.current });
    }

    // Complete cleanup and return to video page
    cleanup(true).then(() => {
      // Reset all connection states
      setIsConnected(false);
      setConnectionStatus('idle');
      setRemoteStream(null);
      setIsRemoteVideoReady(false);
      pendingSignalsRef.current = [];
      partnerIdRef.current = null;
      initiatorRef.current = false;

      // Reset collaborative features
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
      setScores({ you: 0, partner: 0, lastGame: '', lastWinnerLabel: '' });
      setShowScoreboard(false);

      // Reset UI states
      setShowConnectingPreview(false);
      setAllowConnect(false);
      peerConnectedRef.current = false;

      // Small delay before rejoining queue to ensure complete cleanup
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('joinQueue', 'video');
        }
      }, 300);
    });
  };

  const cancelSkip = () => {
    setShowSkipConfirmation(false);
  };

  // When preview timer finishes (or user accepted implicitly), allow UI to connect
  useEffect(() => {
    if (allowConnect && peerConnectedRef.current && !isConnected) {
      setIsConnected(true);
      setConnectionStatus('connected');
    }
  }, [allowConnect, isConnected]);

  const handlePreviewTimeout = () => {
    setAllowConnect(true);
    setShowConnectingPreview(false);
  };

  return (
    <PageWrapper>
      <NameHeader
        logo="Unitalks"
        hasSidebar={false}
        onlineCount={onlineCount}
      />

      <>
        {/* Desktop Layout */}
        <DesktopLayout>
          {!isConnected ? (
            <ConnectionPage>
              <ConnectionCard>
                <Kicker>Face‑to‑face • Fast • Clean</Kicker>
                <Headline>
                  Lights on. <Highlight>Video chat</Highlight> reimagined
                </Headline>
                <Sub>Minimal UI, maximal energy. Meet new minds instantly — in a slick green world.</Sub>
                <ConnectionButton
                  connectionStatus={connectionStatus}
                  onStart={handleStart}
                  onStop={handleStop}
                  buttonRef={startButtonRef}
                  isConnected={isConnected}
                />
                {/* Show radar while searching */}
                <SearchOverlay visible={connectionStatus === 'finding' && !isConnected} mode="video" status={connectionStatus} />
                {/* Show preview when matched (establishing) */}
                <ConnectingPreview
                  visible={connectionStatus === 'establishing' && showConnectingPreview && !isConnected}
                  stream={previewStreamRef.current}
                  onSkip={handleSkip}
                  onTimeout={handlePreviewTimeout}
                  durationMs={4000}
                />
                <StickmanScene />
              </ConnectionCard>
            </ConnectionPage>
          ) : (
            <>
              {/* header removed */}
              {/* Desktop row with side ads and centered video */}
              <VideoRow>
                <SideAdSlot>
                  <AdClamp>
                    <AdFrame
                      title={`ad-left`}
                      srcDoc={`<!DOCTYPE html><html><head><base target='_top'></head><body style='margin:0'><div id='${AD_CONTAINER_ID}'></div><script async src='${AD_SCRIPT_SRC}'></script></body></html>`}
                    />
                  </AdClamp>
                </SideAdSlot>
                <CenterColumn>
                  {showGame && pendingGameType && pendingGameType !== 'chess' ? (
                    <VideoContainer className="video-container">
                      <GameSplitGrid>
                        <LeftStackGrid>
                          <GameTile>
                            {!isRemoteVideoReady && (
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontSize: '1rem', textAlign: 'center', zIndex: 1 }}>
                                Loading remote video...
                              </div>
                            )}
                            <video
                              ref={remoteVideoRefDesktop}
                              autoPlay
                              playsInline
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isRemoteVideoReady ? 1 : 0.3, transition: 'opacity 0.3s ease' }}
                            />
                          </GameTile>
                          <GameTile>
                            {!isLocalVideoReady && (
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontSize: '1rem', textAlign: 'center', zIndex: 1 }}>
                                Loading local video...
                              </div>
                            )}
                            <video
                              ref={localVideoRefDesktop}
                              autoPlay
                              playsInline
                              muted
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />
                          </GameTile>
                        </LeftStackGrid>
                        <GameTile>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0.5rem' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                            {pendingGameType === 'tictactoe' ? (
                              <GameTicTacToe
                                isFirstPlayer={socketRef.current?.id === firstPlayerId}
                                socket={socketRef.current}
                                partnerId={gamePartnerId || partnerIdRef.current}
                                updateScore={updateScore}
                                gameName="Tic Tac Toe"
                                scores={scores}
                                onGameEnd={() => {
                                  if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                    socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                                  }
                                  setShowGame(false);
                                  setPendingGameType(null);
                                  setGamePartnerId(null);
                                  setFirstPlayerId(null);
                                }}
                              />
                            ) : pendingGameType === 'rps' ? (
                              <GameRPS
                                isFirstPlayer={socketRef.current?.id === firstPlayerId}
                                socket={socketRef.current}
                                partnerId={gamePartnerId || partnerIdRef.current}
                                updateScore={updateScore}
                                gameName="Rock Paper Scissors"
                                scores={scores}
                                onGameEnd={() => {
                                  if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                    socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                                  }
                                  setShowGame(false);
                                  setPendingGameType(null);
                                  setGamePartnerId(null);
                                  setFirstPlayerId(null);
                                }}
                              />
                            ) : pendingGameType === 'tod' ? (
                              <GameTruthOrDare
                                isFirstPlayer={socketRef.current?.id === firstPlayerId}
                                socket={socketRef.current}
                                partnerId={gamePartnerId || partnerIdRef.current}
                                updateScore={updateScore}
                                gameName="Truth or Dare"
                                scores={scores}
                                onGameEnd={() => {
                                  if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                    socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                                  }
                                  setShowGame(false);
                                  setPendingGameType(null);
                                  setGamePartnerId(null);
                                  setFirstPlayerId(null);
                                }}
                              />
                            ) : pendingGameType === 'chess' ? (
                              <GameChess
                                isFirstPlayer={socketRef.current?.id === firstPlayerId}
                                socket={socketRef.current}
                                partnerId={gamePartnerId || partnerIdRef.current}
                                updateScore={updateScore}
                                gameName="Chess"
                                scores={scores}
                                onGameEnd={() => {
                                  if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                    socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                                  }
                                  setShowGame(false);
                                  setPendingGameType(null);
                                  setGamePartnerId(null);
                                  setFirstPlayerId(null);
                                }}
                              />
                            ) : (
                              <MusicTogether
                                socket={socketRef.current}
                                partnerId={gamePartnerId || partnerIdRef.current}
                                onExit={() => {
                                  if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                    socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                                  }
                                  setShowGame(false);
                                  setPendingGameType(null);
                                  setGamePartnerId(null);
                                  setFirstPlayerId(null);
                                }}
                              />
                            )}
                            </div>
                            {showScoreboard && (
                              <Scoreboard scores={scores} onClose={() => setShowScoreboard(false)} />
                            )}
                          </div>
                        </GameTile>
                      </GameSplitGrid>
                    </VideoContainer>
                  ) : (
                    <VideoContainer className="video-container">
                      {/* Status Chip */}
                      {connectionStatus === 'establishing' && (
                        <StatusChip>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1DB954', animation: 'pulse 1.5s infinite' }}></div>
                          Establishing connection...
                        </StatusChip>
                      )}
                      {(connectionStatus === 'finding') && <Shimmer />}
                      {(showGame && pendingGameType === 'chess') ? (
                        <VideoWatchAlongWrapper style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ flex: 1, overflow: 'auto' }}>
                          <GameChess
                            isFirstPlayer={socketRef.current?.id === firstPlayerId}
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            updateScore={updateScore}
                            gameName="Chess"
                            scores={scores}
                            onGameEnd={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                          </div>
                          {showScoreboard && (
                            <Scoreboard scores={scores} onClose={() => setShowScoreboard(false)} />
                          )}
                        </VideoWatchAlongWrapper>
                      ) : (
                        <>
                          <video
                            ref={expandedView === 'local' ? localVideoRefDesktop : remoteVideoRefDesktop}
                            autoPlay
                            playsInline
                            muted={expandedView === 'local'}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: (expandedView === 'local' ? isLocalVideoReady : isRemoteVideoReady) ? 1 : 0.3,
                              transition: 'opacity 0.3s ease',
                              transform: expandedView === 'local' ? 'scaleX(-1)' : 'none'
                            }}
                          />
                          <button 
                            onClick={() => toggleExpand(expandedView === 'local' ? 'local' : 'remote')}
                            style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              background: 'rgba(0,0,0,0.6)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: '8px',
                              padding: '8px',
                              cursor: 'pointer',
                              zIndex: 30,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Restore Layout"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                            </svg>
                          </button>
                        </>
                      )}
                      {localStream && !(showGame && pendingGameType === 'chess') && (
                        <LocalVideoPiP
                          style={{
                            left: pipPos.x !== null ? pipPos.x : 'auto',
                            top: pipPos.y !== null ? pipPos.y : 'auto'
                          }}
                          onMouseDown={handlePiPMouseDown}
                          onMouseMove={handlePiPMouseMove}
                          onMouseUp={handlePiPMouseUp}
                          onMouseLeave={handlePiPMouseUp}
                        >
                          <video
                            ref={expandedView === 'local' ? remoteVideoRefDesktop : localVideoRefDesktop}
                            autoPlay
                            playsInline
                            muted={expandedView !== 'local'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              transform: expandedView === 'local' ? 'none' : 'scaleX(-1)'
                            }}
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(expandedView === 'local' ? 'none' : 'local');
                            }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(0,0,0,0.6)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: '4px',
                              padding: '4px',
                              cursor: 'pointer',
                              zIndex: 30,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Maximize"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                          </button>
                        </LocalVideoPiP>
                      )}
                      {/* No hovering videos over player during Watch Along */}
                    </VideoContainer>
                  )}

                  {/* Control Dock and Mini Videos: special layout during chess game */}
                  {(showGame && pendingGameType === 'chess') ? (
                    <BottomRow>
                      <MiniVideo>
                        {localStream && (
                          <video
                            ref={localVideoRefDesktop}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                          />
                        )}
                      </MiniVideo>
                      <DockContainer>
                        {/* Mute */}
                        <ControlItem>
                          <ControlButton
                            onClick={toggleMute}
                            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                            title={`${isMuted ? 'Unmute' : 'Mute'}`}
                          >
                            {isMuted ? <MicOffIcon /> : <MicIcon />}
                          </ControlButton>
                          <ControlLabel>{isMuted ? 'Unmute' : 'Mute'}</ControlLabel>
                        </ControlItem>
                        {/* Songs */}
                        <ControlItem>
                          <ControlButton onClick={handleSongs} aria-label="Songs" title="Songs">
                            <MusicIcon />
                          </ControlButton>
                          <ControlLabel>Songs</ControlLabel>
                        </ControlItem>
                        {/* Skip */}
                        <ControlItem>
                          <ControlButton $primary $accent onClick={handleSkip} aria-label="Skip user" title="Skip user">
                            <SkipIcon />
                          </ControlButton>
                          <ControlLabel>Skip</ControlLabel>
                        </ControlItem>
                        {/* End */}
                        <ControlItem>
                          <ControlButton $primary $danger onClick={handleStop} aria-label="End chat" title="Stop chat">
                            <StopIcon />
                          </ControlButton>
                          <ControlLabel>End</ControlLabel>
                        </ControlItem>
                        {/* Games */}
                        <ControlItem>
                          <ControlButton onClick={handleGameClick} aria-label="Games" title="Games">
                            <GameIcon />
                          </ControlButton>
                          <ControlLabel>Games</ControlLabel>
                        </ControlItem>
                      </DockContainer>
                      <MiniVideo>
                        {remoteStream && (
                          <video
                            ref={remoteVideoRefDesktop}
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </MiniVideo>
                    </BottomRow>
                  ) : (
                    <DockContainer>
                      {/* Mute */}
                      <ControlItem>
                        <ControlButton
                          onClick={toggleMute}
                          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                          title={`${isMuted ? 'Unmute' : 'Mute'} (M)`}
                        >
                          {isMuted ? <MicOffIcon /> : <MicIcon />}
                        </ControlButton>
                        <ControlLabel>{isMuted ? 'Unmute' : 'Mute'}</ControlLabel>
                      </ControlItem>

                      {/* Songs */}
                      <ControlItem>
                        <ControlButton
                          onClick={handleSongs}
                          aria-label="Songs"
                          title="Songs"
                        >
                          <MusicIcon />
                        </ControlButton>
                        <ControlLabel>Songs</ControlLabel>
                      </ControlItem>

                      {/* Skip */}
                      <ControlItem>
                        <ControlButton
                          $primary
                          $accent
                          onClick={handleSkip}
                          aria-label="Skip user"
                          title="Skip user (S)"
                        >
                          <SkipIcon />
                        </ControlButton>
                        <ControlLabel>Skip</ControlLabel>
                      </ControlItem>

                      {/* End */}
                      <ControlItem>
                        <ControlButton
                          $primary
                          $danger
                          onClick={handleStop}
                          aria-label="End chat"
                          title="Stop chat (X)"
                        >
                          <StopIcon />
                        </ControlButton>
                        <ControlLabel>End</ControlLabel>
                      </ControlItem>

                      {/* Games */}
                      <ControlItem>
                        <ControlButton
                          onClick={handleGameClick}
                          aria-label="Games"
                          title="Games"
                        >
                          <GameIcon />
                        </ControlButton>
                        <ControlLabel>Games</ControlLabel>
                      </ControlItem>
                    </DockContainer>
                  )}

                  {/* Watch Along is now embedded inside the VideoContainer as an overlay when active */}

                  {/* Game Choice Modal for Desktop (Sender Only) */}
                  {showGameChoiceModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10000
                    }}>
                      <div style={{
                        background: 'rgba(17,24,39,0.9)',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(29,185,84,0.35)'
                      }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                          Choose a Game
                        </h3>
                        <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                          What would you like to play with your partner?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                          <button
                            onClick={() => handleChooseGameType('tictactoe')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>❌⭕</span>
                            Tic Tac Toe
                          </button>
                          <button
                            onClick={() => handleChooseGameType('rps')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>✊✋✌️</span>
                            Rock Paper Scissors
                          </button>
                          <button
                            onClick={() => handleChooseGameType('tod')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>🎡</span>
                            Truth or Dare
                          </button>
                          <button
                            onClick={() => handleChooseGameType('chess')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>♟️</span>
                            Chess
                          </button>
                        </div>
                        <button
                          onClick={handleCancelGameChoice}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#666',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </CenterColumn>
                <SideAdSlot>
                  <AdClamp>
                    <AdFrame
                      title={`ad-right`}
                      srcDoc={`<!DOCTYPE html><html><head><base target='_top'></head><body style='margin:0'><div id='${AD_CONTAINER_ID}'></div><script async src='${AD_SCRIPT_SRC}'></script></body></html>`}
                    />
                  </AdClamp>
                </SideAdSlot>
              </VideoRow>
            </>
          )}
        </DesktopLayout>

      </>
      {/* Mobile Layout */}
      <MobileLayout>
        <MobilePageWrapper>
          {!isConnected ? (
            <ConnectionPage>
              <ConnectionCard>
                <ConnectionIcon>📹</ConnectionIcon>
                <ConnectionTitle>Ready to Start Video Chat?</ConnectionTitle>
                <ConnectionDescription>
                  Connect with peers from top engineering colleges across India. <br />
                  Start chatting and make new connections instantly with video!
                </ConnectionDescription>
                <ConnectionButton
                  connectionStatus={connectionStatus}
                  onStart={handleStart}
                  buttonRef={startButtonRef}
                  isSocketConnected={socketRef.current?.connected}
                />
              </ConnectionCard>
            </ConnectionPage>
          ) : (
            <>
              {/* header removed on mobile */}

              {/* Ad banner moved below stranger video for mobile (see below) */}

                  <VideoCard>
                    <MobileVideoContainer style={{ position: 'relative' }}>
                      <MobileStrangerVideo style={{ 
                        height: expandedView !== 'none' ? 'calc(100vh - 240px)' : 'auto',
                        aspectRatio: expandedView !== 'none' ? 'auto' : '16/9'
                      }}>
                        {(connectionStatus === 'finding') && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontSize: '1rem',
                            textAlign: 'center',
                            zIndex: 1
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <SmallSpinner />
                              Finding a new partner...
                            </div>
                          </div>
                        )}
                        <video
                          ref={expandedView === 'local' ? localVideoRefMobile : remoteVideoRefMobile}
                          autoPlay
                          playsInline
                          muted={expandedView === 'local'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            opacity: (expandedView === 'local' ? isLocalVideoReady : isRemoteVideoReady) ? 1 : 0.3,
                            transition: 'opacity 0.3s ease',
                            transform: expandedView === 'local' ? 'scaleX(-1)' : 'none'
                          }}
                        />
                        <button 
                          onClick={() => toggleExpand(expandedView === 'local' ? 'local' : 'remote')}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            zIndex: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={expandedView !== 'none' ? 'Restore Layout' : 'Maximize'}
                        >
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {expandedView !== 'none' ? (
                              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                            ) : (
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            )}
                          </svg>
                        </button>
                      </MobileStrangerVideo>

                      {/* Floating PiP on Mobile when maximized */}
                      {expandedView !== 'none' ? (
                        <div style={{
                          position: 'absolute',
                          bottom: '20px',
                          right: '25px',
                          width: '110px',
                          aspectRatio: '16/9',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid rgba(29, 185, 84, 0.5)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                          zIndex: 40,
                          backgroundColor: '#000'
                        }}>
                          <video
                            ref={expandedView === 'local' ? remoteVideoRefMobile : localVideoRefMobile}
                            autoPlay
                            playsInline
                            muted={expandedView !== 'local'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transform: expandedView === 'local' ? 'none' : 'scaleX(-1)'
                            }}
                          />
                          <button 
                            onClick={() => toggleExpand(expandedView === 'local' ? 'none' : 'local')}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.6)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: '4px',
                              padding: '2px',
                              cursor: 'pointer',
                              zIndex: 50
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        /* Standard Stacked Layout */
                        <MobileUserVideo>
                          {!isLocalVideoReady && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#fff',
                              fontSize: '1rem',
                              textAlign: 'center',
                              zIndex: 1
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <SmallSpinner />
                                Preparing your camera...
                              </div>
                            </div>
                          )}
                          <video
                            ref={localVideoRefMobile}
                            autoPlay
                            playsInline
                            muted
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              opacity: isLocalVideoReady ? 1 : 0.3,
                              transition: 'opacity 0.3s ease',
                              transform: 'scaleX(-1)' // Mirror local video
                            }}
                          />
                          <button 
                            onClick={() => toggleExpand('local')}
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: 'rgba(0,0,0,0.6)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              zIndex: 30,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Maximize"
                          >
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                          </button>
                        </MobileUserVideo>
                      )}
                    </MobileVideoContainer>

                  {/* Fifth: Voice and Video Controls */}
                  <MobileVideoControls>
                    <VideoControls
                      isMuted={isMuted}
                      toggleMute={toggleMute}
                      isVideoOff={isVideoOff}
                      toggleVideo={toggleVideo}
                    />
                  </MobileVideoControls>

                  {/* Sixth: Play Along Container (covers both player and games) */}
                  <MobilePlayAlongContainer>
                    {(showGame && (pendingGameType === 'chess' || pendingGameType === 'music')) && (
                      <VideoWatchAlongWrapper style={{ display: 'flex', flexDirection: 'column' }}>
                        {pendingGameType === 'chess' ? (
                          <>
                          <div style={{ flex: 1, overflow: 'auto' }}>
                          <GameChess
                            isFirstPlayer={socketRef.current?.id === firstPlayerId}
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            updateScore={updateScore}
                            gameName="Chess"
                            scores={scores}
                            onGameEnd={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                          </div>
                          {showScoreboard && (
                            <Scoreboard scores={scores} onClose={() => setShowScoreboard(false)} />
                          )}
                          </>
                        ) : (
                          <MusicTogether
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            onExit={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                        )}
                      </VideoWatchAlongWrapper>
                    )}
                    {showGame && pendingGameType && !['chess', 'music'].includes(pendingGameType) && (
                      <div style={{
                        borderRadius: 12,
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '100%',
                        flex: 1,
                        minHeight: 0
                      }}>
                        {pendingGameType === 'tictactoe' ? (
                          <GameTicTacToe
                            isFirstPlayer={socketRef.current.id === firstPlayerId}
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            updateScore={updateScore}
                            gameName="Tic Tac Toe"
                            scores={scores}
                            onGameEnd={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                        ) : pendingGameType === 'rps' ? (
                          <GameRPS
                            isFirstPlayer={socketRef.current.id === firstPlayerId}
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            updateScore={updateScore}
                            gameName="Rock Paper Scissors"
                            scores={scores}
                            onGameEnd={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                        ) : pendingGameType === 'tod' ? (
                          <GameTruthOrDare
                            isFirstPlayer={socketRef.current.id === firstPlayerId}
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            updateScore={updateScore}
                            gameName="Truth or Dare"
                            scores={scores}
                            onGameEnd={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                        ) : (
                          <GameChess
                            isFirstPlayer={socketRef.current.id === firstPlayerId}
                            socket={socketRef.current}
                            partnerId={gamePartnerId || partnerIdRef.current}
                            updateScore={updateScore}
                            gameName="Chess"
                            scores={scores}
                            onGameEnd={() => {
                              if (socketRef.current && (gamePartnerId || partnerIdRef.current)) {
                                socketRef.current.emit('game-exit', { to: gamePartnerId || partnerIdRef.current });
                              }
                              setShowGame(false);
                              setPendingGameType(null);
                              setGamePartnerId(null);
                              setFirstPlayerId(null);
                            }}
                          />
                        )}
                        {showScoreboard && (
                          <Scoreboard scores={scores} onClose={() => setShowScoreboard(false)} />
                        )}
                      </div>
                    )}
                  </MobilePlayAlongContainer>

                  {/* Game Choice Modal for Mobile (Sender Only) */}
                  {showGameChoiceModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10000
                    }}>
                      <div style={{
                        background: 'rgba(17,24,39,0.9)',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(29,185,84,0.35)'
                      }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                          Choose a Game
                        </h3>
                        <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                          What would you like to play with your partner?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                          <button
                            onClick={() => handleChooseGameType('tictactoe')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>❌⭕</span>
                            Tic Tac Toe
                          </button>
                          <button
                            onClick={() => handleChooseGameType('rps')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>✊✋✌️</span>
                            Rock Paper Scissors
                          </button>
                          <button
                            onClick={() => handleChooseGameType('tod')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>🎡</span>
                            Truth or Dare
                          </button>
                          <button
                            onClick={() => handleChooseGameType('chess')}
                            style={{
                              padding: '1rem',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>♟️</span>
                            Chess
                          </button>
                        </div>
                        <button
                          onClick={handleCancelGameChoice}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#666',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                </VideoCard>
            </>
          )}
        </MobilePageWrapper>

        {/* Watch Along "COMING SOON" Overlay */}
        {showWatchAlongMessage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '350px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(29, 185, 84, 0.2)'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                animation: 'pulse 2s infinite'
              }}>📺</div>
              <h3 style={{
                color: '#1DB954',
                fontSize: '1.5rem',
                fontWeight: '700',
                letterSpacing: '3px',
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>COMING SOON</h3>
              <p style={{
                color: '#aaa',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                marginBottom: '1.5rem'
              }}>
                The Watch Along feature is not yet available. Stay tuned for future updates!
              </p>
              <button
                onClick={() => setShowWatchAlongMessage(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backdropFilter: 'blur(4px)',
                  width: '100%'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Controls */}
        <SidebarControls
          isConnected={isConnected}
          onStop={handleStop}
          onSkip={handleSkip}
          onSongs={handleSongs}
          onWatchAlongClick={handleWatchAlongClick}
          voiceCallStatus={voiceCallStatus}
          connectionStatus={connectionStatus}
          onGameClick={handleGameClick}
          gameActive={showGame}
        />
      </MobileLayout>

      {/* Skip Confirmation Modal */}
      {showSkipConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(17,24,39,0.9)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(29,185,84,0.35)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏭️</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Skip Current User?
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to skip this user and search for a new partner?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelSkip}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSkip}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Chat Invitation Modal */}
      {showTextChatInvitation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(17,24,39,0.9)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(29,185,84,0.35)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Text Chat Request
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              Your partner is requesting to switch to text chat mode.
              Would you like to accept and switch to text chat?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleTextChatDecline}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Decline
              </button>
              <button
                onClick={handleTextChatAccept}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Invitation Modal */}
      {showVoiceCallInvitation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(17,24,39,0.9)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(29,185,84,0.35)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Voice Call Request
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              Your partner is requesting to switch to voice chat mode.
              Would you like to accept and switch to voice chat?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleVoiceCallDecline}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Decline
              </button>
              <button
                onClick={handleVoiceCallAccept}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(90deg, #ff6600 0%, #ff4400 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Invitation Modals */}
      {showGameInviteSent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(17,24,39,0.9)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(29,185,84,0.35)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{pendingGameType === 'music' ? '🎵' : '🎮'}</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              {pendingGameType === 'music' ? 'Song Invitation Sent' : 'Game Invitation Sent'}
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              {pendingGameType === 'music'
                ? 'Waiting for your partner to accept the song invitation...'
                : 'Waiting for your partner to accept the game invitation...'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowGameInviteSent(false);
                  setPendingGameType(null);
                  setGamePartnerId(null);
                  setFirstPlayerId(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showGameInviteReceived && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid #444'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{pendingGameType === 'music' ? '🎵' : '🎮'}</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              {pendingGameType === 'music' ? 'Song Invitation' : 'Game Invitation'}
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              {pendingGameType === 'music'
                ? 'Your partner wants to listen to songs together. Would you like to accept?'
                : `Your partner wants to play ${pendingGameType === 'tictactoe' ? 'Tic Tac Toe' : pendingGameType === 'rps' ? 'Rock Paper Scissors' : 'Chess'} with you. Would you like to accept?`}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleDeclineGame}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Decline
              </button>
              <button
                onClick={handleAcceptGame}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(90deg, #ff6600 0%, #ff4400 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Component */}
      <Notification
        isVisible={notification.isVisible}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        icon={notification.icon}
        autoClose={true}
        autoCloseDelay={4000}
      />
      {/* Footer intentionally removed for video chat internal UI */}
    </PageWrapper>
  );
}

export default VideoChat; 