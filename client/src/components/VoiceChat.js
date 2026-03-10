import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import getRtcConfig from '../webrtcConfig';
import StatusArea from './VoiceChatParts/StatusArea';
import useRandomOnlineCount from '../hooks/useRandomOnlineCount';
import ConnectionButton from './VoiceChatParts/ConnectionButton';
import AudioControls from './VoiceChatParts/AudioControls';
import NameHeader from './common-components/NameHeader';
import VoiceHeader from './common-components/VoiceHeader';
import Notification from './common-components/Notification';
// import ThirdPartyAd from './ThirdPartyAd'; // Temporarily disabled for testing
import {
  PageWrapper,
  AudioVisualizer,
  VisualizerBar
} from './VoiceChatParts/StyledComponents';
import SidebarControls from './VoiceChatParts/SidebarControls';
import GameTicTacToe from './common-components/GameTicTacToe';
import GameRPS from './common-components/GameRPS';
import StickmanScene from './common-components/StickmanScene';
import SearchOverlay from './common-components/SearchOverlay';

// Mobile-specific styled components for VoiceChat
const MobilePageWrapper = styled.div`
  @media (max-width: 768px) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
    padding-top: 0px;
    padding-bottom: 80px;
    background: ${({ theme }) => theme.colors.appBg};
    overflow-y: auto;
    position: relative;
  }
`;



const MobileVoiceChatLayout = styled.div`
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1.5rem;
    width: 100%;
    max-width: 100vw;
    padding: 0 1rem;
    padding-bottom: 80px;
    margin: 0 auto;
    min-height: calc(100vh - 160px);
    overflow-y: auto;
    margin-top: 0.5rem;
  }
`;











const MobileSidebarContainer = styled.div`
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
    padding: 0.5rem 1rem !important;
    justify-content: space-around !important;
    height: 60px !important;
    overflow-y: visible !important;
    align-items: center !important;
    z-index: 9999 !important;
    border-left: none !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
`;

const MobileHeaderWrapper = styled.div`
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

// Add styled components for connection page (copied and adapted from TextChat.js)
const ConnectionPage = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  padding: 188px 0 140px; /* uniform visual gap under header */
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.appBg};
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
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 18px;
  padding: 2.25rem;
  text-align: center;
  max-width: 500px;
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







const Kicker = styled.div`
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;
  color: #8ef1b8; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; font-size: .9rem;
  background: rgba(29,185,84,.12); border: 1px solid rgba(29,185,84,.35); padding: 6px 10px; border-radius: 999px;
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
  display: inline-block; transform: rotate(-2deg); padding: 2px 10px;
  background: rgba(29,185,84,.12); border: 1px solid rgba(29,185,84,.35); border-radius: 10px; color: #1DB954;
  -webkit-text-fill-color: #1DB954; font-weight: 900;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary}; font-size: 1.05rem; line-height: 1.7; margin: 0 0 18px;
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

function VoiceChat({ setOnlineUsers }) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteAudioStream, setRemoteAudioStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [textChatStatus, setTextChatStatus] = useState('idle'); // idle, requesting, received
  const [videoCallStatus, setVideoCallStatus] = useState('idle'); // idle, requesting, received
  const [modeTransition, setModeTransition] = useState(null); // null, 'text', 'video'
  const [showTextChatInvitation, setShowTextChatInvitation] = useState(false);
  const [showVideoCallInvitation, setShowVideoCallInvitation] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const randomOnlineCount = useRandomOnlineCount();
  const [showGame, setShowGame] = useState(false);
  const [showGameInviteSent, setShowGameInviteSent] = useState(false);
  const [showGameInviteReceived, setShowGameInviteReceived] = useState(false);
  const [pendingGameType, setPendingGameType] = useState(null);
  const [gamePartnerId, setGamePartnerId] = useState(null);
  const [showGameChoiceModal, setShowGameChoiceModal] = useState(false);

  const [firstPlayerId, setFirstPlayerId] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, title: '', message: '', icon: '' });
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const audioRef = useRef(null);
  const pendingSignalsRef = useRef([]);
  const initiatorRef = useRef(false);
  const partnerIdRef = useRef(null);
  const startButtonRef = useRef(null);
  const textChatTimeoutRef = useRef(null);
  const videoCallTimeoutRef = useRef(null);
  const directMatchTimeoutRef = useRef(null);

  // Keep latest values for socket event handlers (avoid stale closures)
  const streamRef = useRef(null);
  const isConnectedRef = useRef(false);
  const connectionStatusRef = useRef('idle');

  // AdSense hook
  // const adRef = useAdSense();



  useEffect(() => { streamRef.current = stream; }, [stream]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { connectionStatusRef.current = connectionStatus; }, [connectionStatus]);

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


  const cleanup = useCallback(() => {
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
    // Also ensure visualizer bars are reset
    const s = document.getElementById('stranger-visualizer');
    const y = document.getElementById('you-visualizer');
    [s, y].forEach(container => {
      if (!container) return;
      container.querySelectorAll('.viz-bar').forEach(bar => {
        bar.style.height = '10px';
        bar.style.visibility = 'visible';
        bar.style.display = 'inline-block';
      });
    });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
    // Force a visual reset and allow re-binding on next init
    const containers = ['you-visualizer', 'stranger-visualizer'];
    containers.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '';
      }
    });

    // Reset all ephemeral state
    setRemoteAudioStream(null);
    setIsMuted(false);
    setTextChatStatus('idle');
    setVideoCallStatus('idle');
    setModeTransition(null);
    setError(null);
    setIsConnected(false);
    setConnectionStatus('idle');
    setShowGame(false);
    setPendingGameType(null);
    setGamePartnerId(null);
    setFirstPlayerId(null);
    pendingSignalsRef.current = [];
    partnerIdRef.current = null;
    initiatorRef.current = false;

    // Clear any pending text chat timeout
    if (textChatTimeoutRef.current) {
      clearTimeout(textChatTimeoutRef.current);
      textChatTimeoutRef.current = null;
    }
    // Clear any pending video call timeout
    if (videoCallTimeoutRef.current) {
      clearTimeout(videoCallTimeoutRef.current);
      videoCallTimeoutRef.current = null;
    }
  }, []);

  const initializePeer = useCallback(async (initiator, partnerId) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      streamRef.current = mediaStream;

      const peer = new SimplePeer({
        initiator,
        stream: mediaStream,
        trickle: true,
        config: getRtcConfig()
      });

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!peer.connected) {
          console.error('VoiceChat: Peer connection timeout');
          setError('Connection timeout. Please try again.');
          cleanup();
        }
      }, 20000); // 20 second timeout

      peer.on('signal', data => {
        if (!socketRef.current?.connected || !partnerId) return;
        // Drop duplicate SDP of same type to avoid glare loops
        const last = initializePeer.lastSignal;
        const key = JSON.stringify(data?.type ? { t: data.type } : { c: data.candidate?.candidate, sdpMLineIndex: data.candidate?.sdpMLineIndex });
        if (last === key) return; // duplicate
        initializePeer.lastSignal = key;
        socketRef.current.emit('signal', { to: partnerId, signal: data });
      });

      peer.on('stream', remoteStream => {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = remoteStream;
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        audioElement.controls = false;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        audioElement.play?.().catch(() => {/* autoplay blocked - ignore */ });
        audioRef.current = audioElement;
        setRemoteAudioStream(remoteStream);
      });

      peer.on('connect', () => {
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setError(null);
        setConnectionStatus('connected');
        playMatchSound();
        localStorage.removeItem('isVoiceCallInitiator');

        // Process any pending signals
        while (pendingSignalsRef.current.length > 0) {
          const s = pendingSignalsRef.current.shift();
          try { peer.signal(s); } catch (_) { /* ignore invalid */ }
        }
      });

      peer.on('error', err => {
        clearTimeout(connectionTimeout);
        setError('Connection error. Try again.');
        cleanup();
      });

      peer.on('close', () => {
        clearTimeout(connectionTimeout);
        cleanup();
      });

      // Attempt recovery when ICE goes to failed/disconnected
      peer._pc && peer._pc.addEventListener && peer._pc.addEventListener('iceconnectionstatechange', () => {
        try {
          if (!peer._pc) {
            console.warn('Peer connection is null, cannot check ICE state');
            return;
          }
          const state = peer._pc.iceConnectionState;
          if ((state === 'failed' || state === 'disconnected') && socketRef.current && partnerIdRef.current) {
            socketRef.current.emit('webrtc-restart', { to: partnerIdRef.current });
          }
        } catch (_) { }
      });

      peerRef.current = peer;

    } catch (err) {
      setError('Mic access denied or unavailable.');
      setConnectionStatus('idle');
    }
  }, [cleanup]);


  useEffect(() => {
    const socket = io(SOCKET_URL, socketOptions);
    socketRef.current = socket;

    socket.on('connect', () => {
      setError(null);

      // Check for partnerId in query string for direct voice calls
      const searchParams = new URLSearchParams(window.location.search);
      const partnerId = searchParams.get('partnerId');

      if (partnerId) {
        socket.emit('joinQueue', { mode: 'voice', partnerId });

        // Add timeout for direct partner matching
        if (directMatchTimeoutRef.current) {
          clearTimeout(directMatchTimeoutRef.current);
        }
        directMatchTimeoutRef.current = setTimeout(() => {
          if (!isConnectedRef.current && connectionStatusRef.current === 'idle') {
            setError('Partner is no longer available. Please try again.');
            setConnectionStatus('idle');
          }
        }, 10000); // 10 second timeout for direct matching
      }
    });

    socket.on('connect_error', (err) => {
      console.error('VoiceChat: Connection error:', err);
      setError('Unable to connect to server. Retrying...');
      setConnectionStatus('idle');
    });

    // Ignore server-sent user counts; we simulate locally

    socket.on('match', ({ partnerId, initiator }) => {
      partnerIdRef.current = partnerId;
      initiatorRef.current = initiator;
      setConnectionStatus('establishing');

      // Initialize peer after a small microtask to allow any prior peers to cleanup
      setTimeout(() => initializePeer(initiator, partnerId), 0);
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

    // Handle remote restart request (ICE restart)
    socket.on('webrtc-restart', () => {
      try {
        const peer = peerRef.current;
        if (peer && peer._pc && typeof peer._pc.restartIce === 'function') {
          peer._pc.restartIce();
        }
      } catch (_) { }
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
        audioRef.current.remove();
        audioRef.current = null;
      }

      // Reset state
      pendingSignalsRef.current = [];
      partnerIdRef.current = null;
      initiatorRef.current = false;
      setIsMuted(false);
      setTextChatStatus('idle');
      setVideoCallStatus('idle');
      setModeTransition(null);
      setError(null); // Clear any errors

      // Clear timeouts
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
        textChatTimeoutRef.current = null;
      }
      if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current);
        videoCallTimeoutRef.current = null;
      }

      // Show notification first
      showNotification('Partner Disconnected', 'Your partner has disconnected. Starting search for a new partner...', '🔌');

      // After a short delay, transition to connection page and start searching
      setTimeout(() => {
        setIsConnected(false);
        setConnectionStatus('finding');

        // Automatically start searching for a new user
        if (socketRef.current) {
          socketRef.current.emit('joinQueue', 'voice');
        }
      }, 2000); // 2 second delay to show notification
    });

    socket.on('partnerSkipped', () => {
      // Complete cleanup when partner skips
      cleanup();

      // Reset all connection states
      setIsConnected(false);
      setConnectionStatus('idle');
      setRemoteAudioStream(null);
      pendingSignalsRef.current = [];
      partnerIdRef.current = null;
      initiatorRef.current = false;

      // Reset collaborative features
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);

      // Reset other states
      setIsMuted(false);
      setTextChatStatus('idle');
      setVideoCallStatus('idle');
      setModeTransition(null);
      setError(null);

      // Clear timeouts
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
        textChatTimeoutRef.current = null;
      }
      if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current);
        videoCallTimeoutRef.current = null;
      }

      // Show notification
      showNotificationRef.current?.('Partner Skipped', 'Your partner has skipped to another user. Starting search for a new partner...', '⏭️');

      // Rejoin queue to find new partner
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('joinQueue', 'voice');
        }
      }, 300);
    });

    // Text chat request events
    socket.on('textChatRequestReceived', ({ from }) => {
      setTextChatStatus('received');
      setShowTextChatInvitation(true);
    });

    socket.on('textChatAccepted', ({ from }) => {
      setTextChatStatus('idle');
      setModeTransition('text');
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

    // Video call request events
    socket.on('videoCallRequestReceived', ({ from }) => {
      setVideoCallStatus('received');
      setShowVideoCallInvitation(true);
    });

    socket.on('videoCallAccepted', ({ from }) => {
      setVideoCallStatus('idle');
      setModeTransition('video');
      // Clear timeout since request was accepted
      if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current);
        videoCallTimeoutRef.current = null;
      }
      window.location.href = `/video?partnerId=${from}`;
    });

    socket.on('videoCallDeclined', () => {
      setVideoCallStatus('idle');
      // Clear timeout since request was declined
      if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current);
        videoCallTimeoutRef.current = null;
      }
      showNotification('Request Declined', 'The user declined your video call request.', '📹');
    });

    socket.on('gameInvitation', ({ from, gameType, firstPlayerId }) => {
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
    });
    socket.on('gameDeclined', ({ from, gameType }) => {
      setShowGameInviteSent(false);
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
      showNotification('Request Declined', 'Your partner declined the game invitation.', '🎮');
    });
    socket.on('game-exit', () => {
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
    });

    return () => {
      if (directMatchTimeoutRef.current) {
        clearTimeout(directMatchTimeoutRef.current);
        directMatchTimeoutRef.current = null;
      }
      if (socket) {
        // Ensures no lingering listeners even if the socket stays alive briefly
        socket.removeAllListeners?.();
        socket.close();
      }
      // Clean up timeout on unmount
      if (textChatTimeoutRef.current) {
        clearTimeout(textChatTimeoutRef.current);
      }
      if (videoCallTimeoutRef.current) {
        clearTimeout(videoCallTimeoutRef.current);
      }
    };
  }, [cleanup, initializePeer, showNotification]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('partnerId') && localStorage.getItem('isVoiceCallInitiator') === 'true') {
      setTimeout(() => {
        if (startButtonRef.current) {
          startButtonRef.current.click();
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    setOnlineCount(randomOnlineCount);
  }, [randomOnlineCount]);



  // Remote ICE restart requests are handled via the main socket lifecycle effect above.

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
        } catch (_) { /* ignore if beep fails */ }
      });
    } catch (_) { /* ignore if beep fails */ }
  };

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

  const handleVideoCallAccept = () => {
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('videoCallAccepted', { to: partnerIdRef.current });
      window.location.href = `/video?partnerId=${partnerIdRef.current}`;
    }
    setShowVideoCallInvitation(false);
    setVideoCallStatus('idle');
  };

  const handleVideoCallDecline = () => {
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('videoCallDeclined', { to: partnerIdRef.current });
    }
    setShowVideoCallInvitation(false);
    setVideoCallStatus('idle');
  };

  const handleGameClick = () => {
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
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('gameInvitation', { to: partnerIdRef.current, gameType, firstPlayerId: socketRef.current.id });
      setShowGameInviteSent(true);
      setPendingGameType(gameType);
      setGamePartnerId(partnerIdRef.current);
      setFirstPlayerId(socketRef.current.id);
    }
  };
  const handleCancelGameChoice = () => {
    setShowGameChoiceModal(false);

  };
  const handleAcceptGame = () => {
    if (socketRef.current && gamePartnerId && pendingGameType) {
      socketRef.current.emit('gameAccepted', { to: gamePartnerId, gameType: pendingGameType, firstPlayerId });
      setShowGameInviteReceived(false);
      setShowGame(true);
    }
  };
  const handleDeclineGame = () => {
    if (socketRef.current && gamePartnerId && pendingGameType) {
      socketRef.current.emit('gameDeclined', { to: gamePartnerId, gameType: pendingGameType });
      setShowGameInviteReceived(false);
      setShowGame(false);
      setPendingGameType(null);
      setGamePartnerId(null);
      setFirstPlayerId(null);
    }
  };



  const handleStart = () => {
    if (socketRef.current?.connected) {
      // Clear all localStorage before starting new search
      clearAllLocalStorage();

      // Reset any existing errors
      setError(null);
      setConnectionStatus('finding');
      socketRef.current.emit('joinQueue', 'voice');
    } else {
      setError('Socket not connected. Please refresh the page.');
    }
  };

  const handleRetry = () => {
    cleanup();
    setError(null);
    setConnectionStatus('finding');
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinQueue', 'voice');
    }
  };

  const handleStop = () => {
    // Notify partner that we're ending the call
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('partnerSkipped', { to: partnerIdRef.current });
    }
    cleanup();
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

  // Dynamic mic visualizer using Web Audio API
  useEffect(() => {
    if (!stream) return;
    let animationFrameId;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    // Attempt to resume audio context (some browsers start suspended)
    const attemptResume = () => {
      if (context.state === 'suspended') {
        context.resume().catch(() => { });
      }
    };
    attemptResume();
    document.addEventListener('click', attemptResume, { once: true });
    document.addEventListener('keydown', attemptResume, { once: true });

    const strangerBars = document.getElementById('stranger-visualizer');
    const youBars = document.getElementById('you-visualizer');

    // Create bar elements once
    function ensureBars(container) {
      if (!container) return [];
      // Prefer the pre-rendered bars; fallback to JS creation if missing
      if (container.querySelectorAll('.viz-bar').length === 0) {
        for (let i = 0; i < 12; i++) {
          const bar = document.createElement('span');
          bar.className = 'viz-bar';
          bar.style.width = '4px';
          bar.style.background = 'linear-gradient(180deg, #93C5FD 0%, #3B82F6 100%)';
          bar.style.borderRadius = '3px';
          bar.style.transition = 'height 60ms linear';
          bar.style.height = '10px';
          container.appendChild(bar);
        }
      }
      const bars = Array.from(container.querySelectorAll('.viz-bar'));
      // Ensure styles are applied to pre-rendered bars too
      bars.forEach(bar => {
        bar.style.width = bar.style.width || '4px';
        bar.style.background = bar.style.background || 'linear-gradient(180deg, #93C5FD 0%, #3B82F6 100%)';
        bar.style.borderRadius = bar.style.borderRadius || '3px';
        bar.style.transition = bar.style.transition || 'height 60ms linear';
        bar.style.height = bar.style.height || '10px';
        bar.style.display = 'inline-block';
        bar.style.visibility = 'visible';
      });
      return bars;
    }

    const youBarEls = ensureBars(youBars);
    const strangerBarEls = ensureBars(strangerBars);
    // Helper to rebind bars if DOM re-rendered
    const rebindBarsIfNeeded = () => {
      if (!youBarEls.length || !youBarEls[0]?.isConnected) {
        const fresh = ensureBars(document.getElementById('you-visualizer'));
        youBarEls.splice(0, youBarEls.length, ...fresh);
      }
      if (!strangerBarEls.length || !strangerBarEls[0]?.isConnected) {
        const fresh = ensureBars(document.getElementById('stranger-visualizer'));
        strangerBarEls.splice(0, strangerBarEls.length, ...fresh);
      }
    };

    // Ensure visibility for bars (in case of CSS cascade issues)
    [...youBarEls, ...strangerBarEls].forEach(bar => {
      bar.style.display = 'inline-block';
      bar.style.visibility = 'visible';
    });

    function tick() {
      rebindBarsIfNeeded();
      analyser.getByteTimeDomainData(dataArray);
      // Compute signal power from time domain for lower overhead
      let mean = 0;
      for (let i = 0; i < dataArray.length; i++) mean += dataArray[i];
      mean /= dataArray.length;
      let power = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] - mean;
        power += v * v;
      }
      const rms = Math.sqrt(power / dataArray.length); // approx 0..~90
      // Sensitivity mapping with small noise floor and preamp
      const noiseFloor = 2.0;
      const scale = 40.0; // smaller => more sensitive
      const preamp = 1.7;
      const norm = Math.max(0, (rms - noiseFloor) / scale) * preamp; // 0..~>1
      const targetHeight = 10 + Math.min(1, norm) * 46;
      // Smooth to avoid jitter
      const lastHeightLocal = (tick.lastHeightLocal ?? 10);
      const height = lastHeightLocal + 0.35 * (targetHeight - lastHeightLocal);
      tick.lastHeightLocal = height;
      youBarEls.forEach((bar, idx) => {
        const variance = ((idx % 4) + 1) * 3;
        bar.style.height = `${Math.max(6, height - variance)}px`;
      });
      // If we have remote stream analyser, use that for stranger; otherwise mirror local
      if (window.__remoteLevel != null) {
        const remoteHeight = Math.max(6, Math.min(56, window.__remoteLevel));
        strangerBarEls.forEach((bar, idx) => {
          const variance = ((2 - (idx % 4)) + 1) * 3;
          bar.style.height = `${Math.max(6, remoteHeight - variance)}px`;
        });
      } else {
        strangerBarEls.forEach((bar, idx) => {
          const variance = ((2 - (idx % 4)) + 1) * 3;
          bar.style.height = `${Math.max(6, height - variance)}px`;
        });
      }
      animationFrameId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      try { context.close(); } catch (_) { }
      document.removeEventListener('click', attemptResume, { once: true });
      document.removeEventListener('keydown', attemptResume, { once: true });
    };
  }, [stream]);

  // Remote analyser for stranger intensity (minimal dependency; no extra libs)
  useEffect(() => {
    if (!remoteAudioStream) return;
    let raf;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(remoteAudioStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.65;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const attemptResume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { });
      }
    };
    attemptResume();
    document.addEventListener('click', attemptResume, { once: true });
    document.addEventListener('keydown', attemptResume, { once: true });

    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let mean = 0; for (let i = 0; i < data.length; i++) mean += data[i];
      mean /= data.length;
      let power = 0; for (let i = 0; i < data.length; i++) { const v = data[i] - mean; power += v * v; }
      const rms = Math.sqrt(power / data.length); // ~0..90
      const noiseFloor = 2.0;
      const scale = 40.0;
      const preamp = 1.7;
      const norm = Math.max(0, (rms - noiseFloor) / scale) * preamp;
      const target = 10 + Math.min(1, norm) * 46;
      // Smooth remote level
      const last = loop.lastRemote ?? 10;
      const smoothed = last + 0.35 * (target - last);
      loop.lastRemote = smoothed;
      window.__remoteLevel = smoothed;
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.__remoteLevel = null;
      try { ctx.close(); } catch (_) { }
      document.removeEventListener('click', attemptResume, { once: true });
      document.removeEventListener('keydown', attemptResume, { once: true });
    };
  }, [remoteAudioStream]);

  const handleSkip = () => {
    // Directly confirm skip without showing a confirmation prompt
    confirmSkip();
  };

  const confirmSkip = () => {
    setShowSkipConfirmation(false);

    // Notify partner that we're skipping
    if (socketRef.current && partnerIdRef.current) {
      socketRef.current.emit('partnerSkipped', { to: partnerIdRef.current });
    }

    // Clean up current session
    cleanup();
    // Wait a short moment to ensure cleanup, then rejoin queue
    setTimeout(() => {
      setConnectionStatus('finding');
      if (socketRef.current) {
        socketRef.current.emit('joinQueue', 'voice');
      }
    }, 300);
  };

  const cancelSkip = () => {
    setShowSkipConfirmation(false);
  };

  return (
    <MobilePageWrapper>
      <PageWrapper>
        <NameHeader
          logo="Unitalks"
          hasSidebar={false}
          onlineCount={onlineCount}
        />
        {!isConnected ? (
          <ConnectionPage>
            <ConnectionCard>
              <Kicker>Hands‑free • Natural • Chill</Kicker>
              <Headline>
                Talk it out. <Highlight>Voice chat</Highlight> with vibes
              </Headline>
              <Sub>Low‑latency audio chat. You'll feel the vibe — no awkward cams, just energy.</Sub>
              <ConnectionButton
                connectionStatus={connectionStatus}
                onStart={error ? handleRetry : handleStart}
                buttonRef={startButtonRef}
                isSocketConnected={socketRef.current?.connected}
                hasError={!!error}
              />
              <SearchOverlay visible={connectionStatus === 'finding' || connectionStatus === 'establishing'} mode="voice" status={connectionStatus} />
              <StickmanScene />
            </ConnectionCard>
          </ConnectionPage>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <MobileHeaderWrapper>
                <VoiceHeader
                  voiceType="Voice Chat"
                  voiceIcon="🎤"
                  onlineCount={onlineCount}
                />
              </MobileHeaderWrapper>

              {/* Top Layout - Users on sides, center elements in middle */}
              <MobileVoiceChatLayout>
                {/* Third and Fourth: Both users in same row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '420px',
                  margin: '0 auto 1rem auto',
                  gap: '2rem'
                }}>
                  {/* Stranger */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      border: '2px solid #1DB954',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'radial-gradient(65% 65% at 50% 35%, rgba(29,185,84,0.18), rgba(2,6,23,0.35))',
                      boxShadow: 'inset 0 0 24px rgba(29,185,84,0.18)',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <AudioVisualizer id="stranger-visualizer">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <VisualizerBar key={i} className="viz-bar" />
                        ))}
                      </AudioVisualizer>
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: '600' }}>
                      Stranger
                    </div>
                  </div>

                  {/* You */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      border: '2px solid #1DB954',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'radial-gradient(65% 65% at 50% 35%, rgba(29,185,84,0.18), rgba(2,6,23,0.35))',
                      boxShadow: 'inset 0 0 24px rgba(29,185,84,0.18)',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <AudioVisualizer id="you-visualizer">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <VisualizerBar key={i} className="viz-bar" />
                        ))}
                      </AudioVisualizer>
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: '600' }}>
                      You
                    </div>
                  </div>
                </div>

                {/* Fifth: Voice Control */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: '1rem'
                }}>
                  <AudioControls
                    isMuted={isMuted}
                    toggleMute={toggleMute}
                  />
                </div>

                {/* Game/PlayAlong Container - Hidden in mobile but kept for functionality */}
                <div style={{
                  width: '100%',
                  maxWidth: '420px',
                  margin: '0 auto',
                  display: 'flex',
                  justifyContent: 'center',
                  '@media (max-width: 768px)': {
                    display: 'none'
                  }
                }}>
                  {showGame && pendingGameType && (
                    <div style={{
                      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
                      borderRadius: 12,
                      padding: '0.8rem',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: '100%',
                      maxWidth: '300px',
                      maxHeight: '400px'
                    }}>
                      {pendingGameType === 'tictactoe' ? (
                        <GameTicTacToe
                          isFirstPlayer={socketRef.current.id === firstPlayerId}
                          socket={socketRef.current}
                          partnerId={gamePartnerId || partnerIdRef.current}
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
                        <GameRPS
                          isFirstPlayer={socketRef.current.id === firstPlayerId}
                          socket={socketRef.current}
                          partnerId={gamePartnerId || partnerIdRef.current}
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
                    </div>
                  )}
                </div>
              </MobileVoiceChatLayout>

              {/* Status Area - Centered at bottom */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                marginTop: '0.5rem'
              }}>
                <StatusArea
                  error={error}
                  modeTransition={modeTransition}
                  isConnected={isConnected}
                  connectionStatus={connectionStatus}
                  textChatStatus={textChatStatus}
                  videoCallStatus={videoCallStatus}
                />
              </div>
            </div>

            {/* Sidebar */}
            <MobileSidebarContainer>
              <SidebarControls
                isConnected={isConnected}
                onVideoCall={() => {
                  if (socketRef.current && partnerIdRef.current) {
                    localStorage.setItem('isVideoCallInitiator', 'true');
                    setVideoCallStatus('requesting');
                    socketRef.current.emit('videoCallRequest', { to: partnerIdRef.current });

                    videoCallTimeoutRef.current = setTimeout(() => {
                      setVideoCallStatus('idle');
                    }, 30000);
                  }
                }}
                onStop={handleStop}
                onSkip={handleSkip}
                videoCallStatus={videoCallStatus}
                connectionStatus={connectionStatus}
                onGameClick={handleGameClick}
                gameActive={showGame}
              />
            </MobileSidebarContainer>

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
                  maxWidth: '420px',
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
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
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
          </>
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
              background: '#1e293b',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid #444'
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
                    background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
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
              background: '#1e293b',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid #444'
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
                    background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
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
                  <span style={{ fontSize: '1.5rem' }}>✊✋✌️</span> Stone Paper Scissors
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
              background: '#1e293b',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid #444'
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
              background: '#1e293b',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid #444'
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
            {/* Right side ad */}
            <SideAdSlot style={{ right: 10 }}>
              <AdClamp>
                {/* <ThirdPartyAd containerId={AD_CONTAINER_ID} scriptSrc={AD_SCRIPT_SRC} width={'100%'} height={1000} /> */}
              </AdClamp>
            </SideAdSlot>
          </>
        )}
        {/* Footer intentionally removed for voice chat internal UI */}
      </PageWrapper>
    </MobilePageWrapper>
  );
}

export default VoiceChat;
