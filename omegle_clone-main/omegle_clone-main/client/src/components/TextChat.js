import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import io from 'socket.io-client';
import useRandomOnlineCount from '../hooks/useRandomOnlineCount';
import MessageList from './TextChatParts/MessageList';
import MessageInput from './TextChatParts/MessageInput';
// import StatusArea from './TextChatParts/StatusArea';
// import CallControls from './TextChatParts/CallControls';
import ConnectionButton from './TextChatParts/ConnectionButton';
import SidebarControls from './TextChatParts/SidebarControls';
import NameHeader from './common-components/NameHeader';
import ChatHeader from './common-components/ChatHeader';
import Notification from './common-components/Notification';
// import Footer from './common-components/Footer';
import {
  PageWrapper,
  ChatContainer,
  MessagesContainer,
  PanelCard,
  VideoPanelCard,
  MainColumn,
  ChatAndWatchContainer,
  ChatSection,
  WatchAlongSection
} from './TextChatParts/StyledComponents';
import GameTicTacToe from './common-components/GameTicTacToe';
import GameRPS from './common-components/GameRPS';
// import { useAdSense } from '../hooks/useAdSense';
// import ThirdPartyAd from './ThirdPartyAd'; // Temporarily disabled for testing
import StickmanScene from './common-components/StickmanScene';
import SearchOverlay from './common-components/SearchOverlay';

// New styled components for connection page
const ConnectionPage = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  padding: 90 0 140px; /* push footer out of first view like voice/video */
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.appBg};
  z-index: 1;
  margin: 100px auto auto auto;

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

const ConnectionCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 18px;
  padding: 2.25rem;
  text-align: center;
  max-width: 500px; /* match voice/video */
  width: 90%;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 40px rgba(29,185,84,0.15);

  @media (max-width: 768px) {
    padding: 1.75rem;
    margin: 0 1rem;
  }
`;



// Homepage-like hero elements for connection screen
const Kicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #8ef1b8;
  font-weight: 800;
  letter-spacing: .4px;
  text-transform: uppercase;
  font-size: .9rem;
  background: rgba(29,185,84,.12);
  border: 1px solid rgba(29,185,84,.35);
  padding: 6px 10px;
  border-radius: 999px;
`;

const Headline = styled.h2`
  font-size: clamp(1.9rem, 3.6vw, 2.4rem);
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.5px;
  margin: 0 0 10px;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 60%, #8ef1b8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
`;

const Highlight = styled.span`
  display: inline-block;
  transform: rotate(-2deg);
  padding: 2px 10px;
  background: rgba(29,185,84,.12);
  border: 1px solid rgba(29,185,84,.35);
  border-radius: 10px;
  color: #1DB954;
  -webkit-text-fill-color: #1DB954;
  font-weight: 900;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0 0 18px;
`;





// Desktop side ad slots (hidden on mobile)
const SideAdSlot = styled.div`
  position: fixed;
  top: 90px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 220px;
  z-index: 900;
  @media (max-width: 1280px) {
    display: none;
  }
`;

const AdClamp = styled.div`
  width: 200px;
  height: 1000px;
  max-height: calc(100vh - 220px);
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 10px 24px rgba(0,0,0,0.3);
`;

// const AD_SCRIPT_SRC = "//pl27412824.profitableratecpm.com/6c9599f0cdd3c07e95cc091274943889/invoke.js";
// const AD_CONTAINER_ID = "container-6c9599f0cdd3c07e95cc091274943889";

function clearAllLocalStorage() {
  // Clear all localStorage items
  localStorage.clear();
}

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const socketOptions = {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
};

function TextChat({ setOnlineUsers }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, finding, establishing, connected
  const [voiceCallStatus, setVoiceCallStatus] = useState('idle'); // idle, requesting, received
  const [videoCallStatus, setVideoCallStatus] = useState('idle'); // idle, requesting, received
  const [modeTransition, setModeTransition] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const randomOnlineCount = useRandomOnlineCount();
  const [showVoiceCallInvitation, setShowVoiceCallInvitation] = useState(false);
  const [showVideoCallInvitation, setShowVideoCallInvitation] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const callerSocketIdRef = useRef(null); // store caller's socket ID for voice call
  const messagesEndRef = useRef(null);
  const voiceCallTimeoutRef = useRef(null); // Add ref for timeout cleanup
  const videoCallTimeoutRef = useRef(null); // Add ref for video call timeout cleanup
  const startButtonRef = useRef(null); // Add ref for start button
  const [showGame, setShowGame] = useState(false);
  const [showGameInviteSent, setShowGameInviteSent] = useState(false);
  const [showGameInviteReceived, setShowGameInviteReceived] = useState(false);
  const [pendingGameType, setPendingGameType] = useState(null);
  const [gamePartnerId, setGamePartnerId] = useState(null);
  const [showGameChoiceModal, setShowGameChoiceModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [firstPlayerId, setFirstPlayerId] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, title: '', message: '', icon: '' });

  // AdSense hook
  // const adRef = useAdSense();

  // FIX: Wrapped in useCallback so these are stable references. Previously,
  // they were recreated on every render, causing children to re-render and
  // socket event handlers that captured them to become stale.
  const showNotification = useCallback((title, message, icon = "ℹ️") => {
    setNotification({ isVisible: true, title, message, icon });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification({ isVisible: false, title: '', message: '', icon: '' });
  }, []);

  // FIX: Keep showNotification in a ref so socket event handlers always call
  // the latest version even though they're registered once in the effect.
  const showNotificationRef = useRef(showNotification);
  useEffect(() => { showNotificationRef.current = showNotification; }, [showNotification]);

  const socketRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, socketOptions);
    setSocket(newSocket);
    socketRef.current = newSocket;

    // FIX: Define all handlers as named functions so we can clean each one up
    // individually with socket.off(event, handler). Previously the cleanup only
    // called newSocket.close() which is correct, but the pattern is now explicit
    // and each handler reads showNotification via a ref to avoid stale closures.

    const handleConnect = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const pid = searchParams.get('partnerId');
      if (pid) newSocket.emit('joinQueue', { mode: 'text', partnerId: pid });
    };

    const handleConnectError = (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('idle');
    };

    const handleMatch = ({ partnerId: pid }) => {
      setPartnerId(pid);
      setConnectionStatus('establishing');
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        playMatchSound();
      }, 1000);
    };

    const handleMessage = ({ message: msg }) => {
      setMessages(prev => [...prev, { text: msg, isMine: false }]);
    };

    const handlePartnerDisconnected = () => {
      setIsConnected(false);
      setPartnerId(null);
      setMessages([]);
      setConnectionStatus('finding');
      setVoiceCallStatus('idle');
      setVideoCallStatus('idle');
      if (voiceCallTimeoutRef.current) { clearTimeout(voiceCallTimeoutRef.current); voiceCallTimeoutRef.current = null; }
      if (videoCallTimeoutRef.current) { clearTimeout(videoCallTimeoutRef.current); videoCallTimeoutRef.current = null; }
      showNotificationRef.current('Partner Disconnected', 'Your partner has disconnected. Starting search for a new partner...', '🔌');
      newSocket.emit('joinQueue', 'text');
    };

    const handleVoiceCallRequestReceived = ({ from }) => {
      callerSocketIdRef.current = from;
      setVoiceCallStatus('received');
      setShowVoiceCallInvitation(true);
    };

    const handleVoiceCallAccepted = ({ from }) => {
      setVoiceCallStatus('idle');
      setModeTransition('voice');
      if (voiceCallTimeoutRef.current) { clearTimeout(voiceCallTimeoutRef.current); voiceCallTimeoutRef.current = null; }
      window.location.href = `/voice?partnerId=${from}`;
    };

    const handleVoiceCallDeclined = () => {
      setVoiceCallStatus('idle');
      if (voiceCallTimeoutRef.current) { clearTimeout(voiceCallTimeoutRef.current); voiceCallTimeoutRef.current = null; }
      showNotificationRef.current('Call Declined', 'The user declined your voice call request.', '📞');
    };

    const handleVideoCallRequestReceived = ({ from }) => {
      callerSocketIdRef.current = from;
      setVideoCallStatus('received');
      setShowVideoCallInvitation(true);
    };

    const handleVideoCallAccepted = ({ from }) => {
      setVideoCallStatus('idle');
      setModeTransition('video');
      if (videoCallTimeoutRef.current) { clearTimeout(videoCallTimeoutRef.current); videoCallTimeoutRef.current = null; }
      window.location.href = `/video?partnerId=${from}`;
    };

    const handleVideoCallDeclined = () => {
      setVideoCallStatus('idle');
      if (videoCallTimeoutRef.current) { clearTimeout(videoCallTimeoutRef.current); videoCallTimeoutRef.current = null; }
      showNotificationRef.current('Call Declined', 'The user declined your video call request.', '📹');
    };

    const handlePartnerSkipped = () => {
      setIsConnected(false);
      setPartnerId(null);
      setMessages([]);
      setConnectionStatus('finding');
      setVoiceCallStatus('idle');
      setVideoCallStatus('idle');
      if (voiceCallTimeoutRef.current) { clearTimeout(voiceCallTimeoutRef.current); voiceCallTimeoutRef.current = null; }
      if (videoCallTimeoutRef.current) { clearTimeout(videoCallTimeoutRef.current); videoCallTimeoutRef.current = null; }
      showNotificationRef.current('Partner Skipped', 'Your partner has skipped to another user. Starting search for a new partner...', '⏭️');
      newSocket.emit('joinQueue', 'text');
    };

    const handleGameInvitation = ({ from, gameType, firstPlayerId: fpid }) => {
      setShowGameInviteReceived(true);
      setPendingGameType(gameType);
      setGamePartnerId(from);
      setFirstPlayerId(fpid);
    };

    const handleGameAccepted = ({ from, gameType, firstPlayerId: fpid }) => {
      setShowGameInviteSent(false);
      setShowGame(true);
      setPendingGameType(gameType);
      setGamePartnerId(from);
      setFirstPlayerId(fpid);
    };

    const handleGameDeclined = () => {
      setShowGameInviteSent(false);
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
      showNotificationRef.current('Declined', 'Your partner declined the game invitation.', '🎮');
    };

    const handleGameExit = () => {
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('match', handleMatch);
    newSocket.on('message', handleMessage);
    newSocket.on('partnerDisconnected', handlePartnerDisconnected);
    newSocket.on('voiceCallRequestReceived', handleVoiceCallRequestReceived);
    newSocket.on('voiceCallAccepted', handleVoiceCallAccepted);
    newSocket.on('voiceCallDeclined', handleVoiceCallDeclined);
    newSocket.on('videoCallRequestReceived', handleVideoCallRequestReceived);
    newSocket.on('videoCallAccepted', handleVideoCallAccepted);
    newSocket.on('videoCallDeclined', handleVideoCallDeclined);
    newSocket.on('partnerSkipped', handlePartnerSkipped);
    newSocket.on('gameInvitation', handleGameInvitation);
    newSocket.on('gameAccepted', handleGameAccepted);
    newSocket.on('gameDeclined', handleGameDeclined);
    newSocket.on('game-exit', handleGameExit);

    return () => {
      // FIX: clean up each listener by its specific handler reference
      newSocket.off('connect', handleConnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.off('match', handleMatch);
      newSocket.off('message', handleMessage);
      newSocket.off('partnerDisconnected', handlePartnerDisconnected);
      newSocket.off('voiceCallRequestReceived', handleVoiceCallRequestReceived);
      newSocket.off('voiceCallAccepted', handleVoiceCallAccepted);
      newSocket.off('voiceCallDeclined', handleVoiceCallDeclined);
      newSocket.off('videoCallRequestReceived', handleVideoCallRequestReceived);
      newSocket.off('videoCallAccepted', handleVideoCallAccepted);
      newSocket.off('videoCallDeclined', handleVideoCallDeclined);
      newSocket.off('partnerSkipped', handlePartnerSkipped);
      newSocket.off('gameInvitation', handleGameInvitation);
      newSocket.off('gameAccepted', handleGameAccepted);
      newSocket.off('gameDeclined', handleGameDeclined);
      newSocket.off('game-exit', handleGameExit);
      newSocket.close();
      socketRef.current = null;
      if (voiceCallTimeoutRef.current) clearTimeout(voiceCallTimeoutRef.current);
      if (videoCallTimeoutRef.current) clearTimeout(videoCallTimeoutRef.current);
    };
    // FIX: empty dep array — socket is created once per mount. showNotification
    // is accessed via showNotificationRef so it is never stale.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: Sync randomOnlineCount directly — no intermediate state needed.
  // Using setOnlineCount directly in the render avoids an extra render cycle.
  useEffect(() => {
    setOnlineCount(randomOnlineCount);
  }, [randomOnlineCount]);

  // Reconnect / rejoin queue when returning to the tab on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      const s = socketRef.current;
      if (!s) return;
      if (document.visibilityState === 'visible' && !s.connected) {
        s.connect();
        if (!isConnected && connectionStatus !== 'connected') {
          setConnectionStatus('finding');
          s.emit('joinQueue', 'text');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connectionStatus]);

  // Auto-click logic for text chat initiators
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('partnerId') && localStorage.getItem('isTextChatInitiator') === 'true') {
      setTimeout(() => {
        if (startButtonRef.current) {
          startButtonRef.current.click();
          localStorage.removeItem('isTextChatInitiator');
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    // Keep message list pinned without scrolling the whole page
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
      } catch (_) {
        messagesEndRef.current.scrollIntoView();
      }
    }
  }, [messages]);

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

  const handleStart = useCallback(() => {
    clearAllLocalStorage();
    setConnectionStatus('finding');
    socket.emit('joinQueue', 'text');
  }, [socket]);

  const handleStop = useCallback(() => {
    if (socket) socket.emit('leaveChat');
    setIsConnected(false);
    setPartnerId(null);
    setMessages([]);
    setConnectionStatus('idle');
    setVoiceCallStatus('idle');
    setVideoCallStatus('idle');
    setModeTransition(null);
    if (voiceCallTimeoutRef.current) { clearTimeout(voiceCallTimeoutRef.current); voiceCallTimeoutRef.current = null; }
    if (videoCallTimeoutRef.current) { clearTimeout(videoCallTimeoutRef.current); videoCallTimeoutRef.current = null; }
  }, [socket]);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || !partnerId) return;
    socket.emit('message', { to: partnerId, message });
    setMessages(prev => [...prev, { text: message, isMine: true }]);
    setMessage('');
  }, [socket, partnerId, message]);

  const handleVoiceCall = useCallback(() => {
    if (socket && partnerId) {
      localStorage.setItem('isVoiceCallInitiator', 'true');
      setVoiceCallStatus('requesting');
      callerSocketIdRef.current = socket.id;
      socket.emit('voiceCallRequest', { to: partnerId });
      voiceCallTimeoutRef.current = setTimeout(() => setVoiceCallStatus('idle'), 30000);
    } else {
      showNotification('Error', 'Cannot send voice call request. Please try again.', '❌');
    }
  }, [socket, partnerId, showNotification]);

  const handleVideoCall = useCallback(() => {
    if (socket && partnerId) {
      localStorage.setItem('isVideoCallInitiator', 'true');
      setVideoCallStatus('requesting');
      socket.emit('videoCallRequest', { to: partnerId });
      videoCallTimeoutRef.current = setTimeout(() => setVideoCallStatus('idle'), 30000);
    } else {
      showNotification('Error', 'Cannot send video call request. Please try again.', '❌');
    }
  }, [socket, partnerId, showNotification]);

  const handleLogoClick = () => { // eslint-disable-line no-unused-vars
    // Handle logo click - could navigate to home page
  };

  const handleNavItemClick = (item) => { // eslint-disable-line no-unused-vars
    // Handle navigation item click
  };

  const handleVoiceCallAccept = useCallback(() => {
    if (socket && callerSocketIdRef.current) {
      socket.emit('voiceCallAccepted', { to: callerSocketIdRef.current });
      window.location.href = `/voice?partnerId=${callerSocketIdRef.current}`;
    }
    setShowVoiceCallInvitation(false);
    setVoiceCallStatus('idle');
  }, [socket]);

  const handleVoiceCallDecline = useCallback(() => {
    if (socket && callerSocketIdRef.current) {
      socket.emit('voiceCallDeclined', { to: callerSocketIdRef.current });
    }
    setShowVoiceCallInvitation(false);
    setVoiceCallStatus('idle');
  }, [socket]);

  const handleVideoCallAccept = useCallback(() => {
    if (socket && callerSocketIdRef.current) {
      socket.emit('videoCallAccepted', { to: callerSocketIdRef.current });
      window.location.href = `/video?partnerId=${callerSocketIdRef.current}`;
    }
    setShowVideoCallInvitation(false);
    setVideoCallStatus('idle');
  }, [socket]);

  const handleVideoCallDecline = useCallback(() => {
    if (socket && callerSocketIdRef.current) {
      socket.emit('videoCallDeclined', { to: callerSocketIdRef.current });
    }
    setShowVideoCallInvitation(false);
    setVideoCallStatus('idle');
  }, [socket]);

  const handleConfirmSkip = useCallback(() => {
    setShowSkipConfirmation(false);
    localStorage.clear();
    if (socket && partnerId) {
      socket.emit('partnerSkipped', { to: partnerId });
      socket.emit('leaveChat');
    }
    setIsConnected(false);
    setPartnerId(null);
    setMessages([]);
    setConnectionStatus('finding');
    setVoiceCallStatus('idle');
    setVideoCallStatus('idle');
    setModeTransition(null);
    if (voiceCallTimeoutRef.current) { clearTimeout(voiceCallTimeoutRef.current); voiceCallTimeoutRef.current = null; }
    if (videoCallTimeoutRef.current) { clearTimeout(videoCallTimeoutRef.current); videoCallTimeoutRef.current = null; }
    if (socket) socket.emit('joinQueue', 'text');
  }, [socket, partnerId]);

  const handleSkip = useCallback(() => {
    handleConfirmSkip();
  }, [handleConfirmSkip]);

  const handleCancelSkip = useCallback(() => setShowSkipConfirmation(false), []);

  const handleGameClick = useCallback(() => {
    if (!showGame && socket && partnerId) {
      setShowGameChoiceModal(true);
    } else {
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
    }
  }, [showGame, socket, partnerId]);

  const handleChooseGameType = useCallback((gameType) => {
    setSelectedGameType(gameType);
    setShowGameChoiceModal(false);
    if (socket && partnerId) {
      socket.emit('gameInvitation', { to: partnerId, gameType, firstPlayerId: socket.id });
      setShowGameInviteSent(true);
      setPendingGameType(gameType);
      setGamePartnerId(partnerId);
      setFirstPlayerId(socket.id);
    }
  }, [socket, partnerId]);

  const handleCancelGameChoice = useCallback(() => {
    setShowGameChoiceModal(false);
    setSelectedGameType(null);
  }, []);

  const handleAcceptGame = useCallback(() => {
    if (socket && gamePartnerId && pendingGameType) {
      socket.emit('gameAccepted', { to: gamePartnerId, gameType: pendingGameType, firstPlayerId });
      setShowGameInviteReceived(false);
      setShowGame(true);
    }
  }, [socket, gamePartnerId, pendingGameType, firstPlayerId]);

  const handleDeclineGame = useCallback(() => {
    if (socket && gamePartnerId && pendingGameType) {
      socket.emit('gameDeclined', { to: gamePartnerId, gameType: pendingGameType });
      setShowGameInviteReceived(false);
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
    }
  }, [socket, gamePartnerId, pendingGameType]);

  return (
    <PageWrapper>
      <NameHeader
        logo="Unitalks"
        hasSidebar={isConnected}
        onlineCount={onlineCount}
      />
      <MainColumn>
        {!isConnected ? (
          <ConnectionPage>
            <ConnectionCard>
              <Kicker>Anonymous • Instant • Zero sign‑up</Kicker>
              <Headline>
                Say it fast. Keep it fun. <Highlight>Text chat</Highlight>
              </Headline>
              <Sub>
                Meet someone new without your introduction — fast bubbles, no clutter. Say more with less.
              </Sub>
              <ConnectionButton
                connectionStatus={connectionStatus}
                onStart={handleStart}
                onStop={handleStop}
                buttonRef={startButtonRef}
                isConnected={isConnected}
              />
              <SearchOverlay visible={connectionStatus === 'finding' || connectionStatus === 'establishing'} mode="text" status={connectionStatus} />
              <StickmanScene />
              {/* Secondary CTAs removed as requested */}
            </ConnectionCard>
          </ConnectionPage>
        ) : (
          <PanelCard>
            <ChatHeader
              onlineCount={onlineCount}
              images={[
                'img_1.png',
                'img_2.png',
                'img_3.png',
                'img_4.png'
              ]}
            />
            {showGame && pendingGameType ? (
              <ChatAndWatchContainer>
                <ChatSection>
                  <ChatContainer>
                    <MessagesContainer>
                      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
                    </MessagesContainer>
                    <MessageInput
                      message={message}
                      setMessage={setMessage}
                      handleSend={handleSend}
                    />
                  </ChatContainer>
                </ChatSection>
                <WatchAlongSection>
                  {pendingGameType === 'tictactoe' ? (
                    <GameTicTacToe
                      isFirstPlayer={socket?.id === firstPlayerId}
                      socket={socket}
                      partnerId={gamePartnerId || partnerId}
                      onGameEnd={() => {
                        if (socket && (gamePartnerId || partnerId)) {
                          socket.emit('game-exit', { to: gamePartnerId || partnerId });
                        }
                        setShowGame(false);
                        setPendingGameType(null);
                        setGamePartnerId(null);
                        setFirstPlayerId(null);
                      }}
                    />
                  ) : (
                    <GameRPS
                      isFirstPlayer={socket?.id === firstPlayerId}
                      socket={socket}
                      partnerId={gamePartnerId || partnerId}
                      onGameEnd={() => {
                        if (socket && (gamePartnerId || partnerId)) {
                          socket.emit('game-exit', { to: gamePartnerId || partnerId });
                        }
                        setShowGame(false);
                        setPendingGameType(null);
                        setGamePartnerId(null);
                        setFirstPlayerId(null);
                      }}
                    />
                  )}
                </WatchAlongSection>
              </ChatAndWatchContainer>
            ) : (
              <ChatContainer>
                <MessagesContainer>
                  <MessageList messages={messages} messagesEndRef={messagesEndRef} />
                </MessagesContainer>
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  handleSend={handleSend}
                />
              </ChatContainer>
            )}
          </PanelCard>
        )}
      </MainColumn>
      {isConnected && (
        <VideoPanelCard>
          <SidebarControls
            isConnected={isConnected}
            onVoiceCall={handleVoiceCall}
            onVideoCall={handleVideoCall}
            onStop={handleStop}
            onSkip={handleSkip}
            onGameClick={handleGameClick}
            voiceCallStatus={voiceCallStatus}
            videoCallStatus={videoCallStatus}
            connectionStatus={connectionStatus}
            gameActive={showGame}
          />
        </VideoPanelCard>
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎤</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Voice Call Request
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              Your partner is requesting a voice call with you.
              Would you like to accept and switch to voice chat mode?
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
                  background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)',
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

      {/* Video Call Invitation Modal */}
      {showVideoCallInvitation && (
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Video Call Request
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              Your partner is requesting a video call with you.
              Would you like to accept and switch to video chat mode?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleVideoCallDecline}
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
                onClick={handleVideoCallAccept}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)',
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏭️</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Skip Current User
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to skip to the next user?
              This will end your current conversation and start searching for a new partner.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleCancelSkip}
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
                onClick={handleConfirmSkip}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Skip User
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{pendingGameType === 'music' ? '🎵' : '🎮'}</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              {pendingGameType === 'music' ? 'Song Invitation Sent' : 'Game Invitation Sent'}
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              {pendingGameType === 'music' ? 'Waiting for your partner to accept the song invitation...' : 'Waiting for your partner to accept the game invitation...'}
            </p>
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
            background: 'rgba(17,24,39,0.9)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(29,185,84,0.35)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{pendingGameType === 'music' ? '🎵' : '🎮'}</div>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>
              {pendingGameType === 'music' ? 'Song Invitation' : 'Game Invitation'}
            </h3>
            <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
              {pendingGameType === 'music' ? 'Your partner wants to listen to songs together. Would you like to accept?' : 'Your partner is inviting you to play a game. Would you like to join?'}
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
                  background: 'linear-gradient(90deg, #ffb300 0%, #ff9800 100%)',
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
            background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
            borderRadius: '18px',
            padding: '2.5rem 2rem 2rem 2rem',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            border: '2px solid #ffb300',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.2rem', filter: 'drop-shadow(0 2px 8px #ffb30088)' }}>🎮</div>
            <h3 style={{ marginBottom: '1.2rem', fontSize: '1.7rem', fontWeight: 700, letterSpacing: '0.5px', background: 'linear-gradient(90deg, #ffb300 0%, #ff9800 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Choose a Game
            </h3>
            <p style={{ color: '#eee', marginBottom: '2.2rem', fontSize: '1.08rem', lineHeight: '1.6' }}>
              What would you like to play with your partner?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => handleChooseGameType('tictactoe')}
                style={{
                  padding: '1rem 0',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #667eea33',
                  transition: 'transform 0.1s',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.7rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>❌⭕</span> Tic Tac Toe
              </button>
              <button
                onClick={() => handleChooseGameType('rps')}
                style={{
                  padding: '1rem 0',
                  background: 'linear-gradient(90deg, #ff9800 0%, #ffb300 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #ffb30033',
                  transition: 'transform 0.1s',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.7rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>✊✋✌️</span> Rock Paper Scissors
              </button>
            </div>
            <button
              onClick={handleCancelGameChoice}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                color: '#bbb',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                opacity: 0.8
              }}
            >
              Cancel
            </button>
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
      {isConnected && (
        <>
          {/* Left side ad */}
          <SideAdSlot style={{ left: 10 }}>
            <AdClamp>
              {/* <ThirdPartyAd containerId={AD_CONTAINER_ID} scriptSrc={AD_SCRIPT_SRC} width={'100%'} height={1000} /> */}
            </AdClamp>
          </SideAdSlot>
          {/* Right side ad (offset to not overlap sidebar controls) */}
          <SideAdSlot style={{ right: 70 }}>
            <AdClamp>
              {/* <ThirdPartyAd containerId={AD_CONTAINER_ID} scriptSrc={AD_SCRIPT_SRC} width={'100%'} height={1000} /> */}
            </AdClamp>
          </SideAdSlot>
        </>
      )}

      {/* Advertisement Area removed; ad shown above input when connected */}

      {/* Footer intentionally removed for text chat internal UI */}
    </PageWrapper>
  );
}

export default TextChat; 