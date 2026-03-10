import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { getRtcConfig, createConnectionMonitor, refreshTurnCredentials } from '../webrtcConfig';

export const useWebRTC = (socketUrl, mode = 'video', options = {}) => {
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [isUsingTurn, setIsUsingTurn] = useState(false);
  const [connectionStats, setConnectionStats] = useState(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const connectionMonitorRef = useRef(null);
  const credentialRefreshTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FIX: Keep latest peer/partnerId in refs so callbacks can access them
  // without needing to be in dependency arrays (which would cause re-creation
  // on every state change).
  const peerRef = useRef(null);
  const partnerIdRef = useRef(null);
  const socketRef = useRef(null);
  const isUsingTurnRef = useRef(false);

  // FIX: options object is unstable (recreated by caller every render).
  // Extract only the primitive we need.
  const forceRelay = options.forceRelay ?? false;

  // Sync refs with state
  useEffect(() => { peerRef.current = peer; }, [peer]);
  useEffect(() => { partnerIdRef.current = partnerId; }, [partnerId]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { isUsingTurnRef.current = isUsingTurn; }, [isUsingTurn]);

  // Initialize socket connection — only depends on the URL string (stable)
  useEffect(() => {
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.close();
    };
  }, [socketUrl]);

  // Initialize media stream
  const initializeStream = useCallback(async (constraints = {}) => {
    try {
      const defaultConstraints = {
        video: mode === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        ...constraints
      };

      const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
    // FIX: mode is a stable primitive arg — okay in deps.
    // localStreamRef.current must NOT be in deps (ref values are mutable and
    // don't trigger re-renders).
  }, [mode]);

  // Setup credential refresh timer
  // FIX: no longer depends on peer/partnerId state — uses refs instead, so
  // the callback is stable and will not cause extra re-renders.
  const setupCredentialRefresh = useCallback((credentials) => {
    if (credentialRefreshTimerRef.current) {
      clearInterval(credentialRefreshTimerRef.current);
    }

    const refreshInterval = (credentials.ttl - 300) * 1000;

    if (refreshInterval > 0) {
      credentialRefreshTimerRef.current = setInterval(async () => {
        try {
          const refreshResult = await refreshTurnCredentials(credentials.username);
          if (refreshResult?.refreshNeeded) {
            if (peerRef.current && partnerIdRef.current) {
              await recreatePeerConnectionRef.current(true);
            }
          }
        } catch (error) {
          console.error('Failed to refresh TURN credentials:', error);
        }
      }, refreshInterval);
    }
  }, []); // stable — reads peer/partnerId from refs

  // Update connection quality — uses ref for isUsingTurn to stay stable
  const updateConnectionQuality = useCallback(async () => {
    if (!connectionMonitorRef.current) return;

    try {
      const stats = connectionMonitorRef.current.getStats();
      const connectionType = await connectionMonitorRef.current.getConnectionType();
      const usingTurn = isUsingTurnRef.current;

      if (!isMountedRef.current) return;

      setConnectionStats({
        ...stats,
        connectionType,
        isUsingTurn: usingTurn || connectionType?.localCandidateId?.includes('relay')
      });

      if (stats.iceConnectionState === 'connected' || stats.iceConnectionState === 'completed') {
        if (usingTurn || connectionType?.localCandidateId?.includes('relay')) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('excellent');
        }
      } else if (stats.iceConnectionState === 'disconnected') {
        setConnectionQuality('poor');
      } else if (stats.iceConnectionState === 'failed') {
        setConnectionQuality('failed');
      } else {
        setConnectionQuality('connecting');
      }
    } catch (error) {
      console.error('Error updating connection quality:', error);
    }
  }, []); // stable — reads isUsingTurn from ref

  // Forward-declared ref so setupCredentialRefresh can call recreatePeerConnection
  // without a circular dependency
  const recreatePeerConnectionRef = useRef(null);

  // Create peer connection
  // FIX: removed localStreamRef.current and options from dep array.
  // Ref values must not be deps. options is unstable (use forceRelay primitive instead).
  const createPeer = useCallback(async (initiator = false, rtcConfig = null) => {
    try {
      const config = rtcConfig || await getRtcConfig({
        useDynamicCredentials: true,
        iceTransportPolicy: forceRelay ? 'relay' : 'all'
      });

      if (config.credentials) {
        setupCredentialRefresh(config.credentials);
      }

      const newPeer = new SimplePeer({
        initiator,
        trickle: true,
        config,
        stream: localStreamRef.current,
        channelName: `data-${mode}`,
        sdpTransform: (sdp) =>
          sdp.replace(
            /a=fmtp:\d+\s*([\w\s=]+);\s*level-asymmetry-allowed=1/,
            'a=fmtp:$1;level-asymmetry-allowed=1'
          )
      });

      connectionMonitorRef.current = createConnectionMonitor(newPeer);

      newPeer.on('signal', (data) => {
        // Use refs so this handler is never stale
        if (socketRef.current && partnerIdRef.current) {
          socketRef.current.emit('signal', { to: partnerIdRef.current, signal: data });
        }
      });

      newPeer.on('connect', () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      });

      newPeer.on('stream', (stream) => {
        remoteStreamRef.current = stream;
      });

      newPeer.on('close', () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
      });

      newPeer.on('error', (error) => {
        console.error('WebRTC connection error:', error);
        if (!isMountedRef.current) return;
        setIsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setTimeout(() => {
            recreatePeerConnectionRef.current?.(true);
          }, 1000 * reconnectAttemptsRef.current);
        }
      });

      newPeer.on('iceStateChange', () => {
        updateConnectionQuality();
      });

      newPeer.on('iceCandidate', (candidate) => {
        if (candidate?.candidate?.toLowerCase().includes('relay')) {
          if (!isMountedRef.current) return;
          setIsUsingTurn(true);
        }
      });

      if (!isMountedRef.current) {
        // Hook was unmounted while async config was resolving; ensure we don't leak.
        try { newPeer.destroy(); } catch (_) { }
        return newPeer;
      }

      setPeer(newPeer);
      peerRef.current = newPeer;
      return newPeer;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }, [forceRelay, mode, setupCredentialRefresh, updateConnectionQuality]);

  // Recreate peer connection with fallback
  const recreatePeerConnection = useCallback(async (forceRelayArg = false) => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const rtcConfig = await getRtcConfig({
      useDynamicCredentials: true,
      iceTransportPolicy: forceRelayArg ? 'relay' : 'all'
    });

    await createPeer(true, rtcConfig);
  }, [createPeer]);

  // Keep the forward ref up-to-date
  useEffect(() => {
    recreatePeerConnectionRef.current = recreatePeerConnection;
  }, [recreatePeerConnection]);

  // Handle incoming signals
  // FIX: previously did socket.off('signal') which removed ALL signal listeners.
  // Now we register a named handler and clean it up specifically.
  useEffect(() => {
    if (!socket) return;

    const handleSignal = ({ signal }) => {
      // Read current peer from ref — avoids stale closure when peer changes
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    };

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
    };
    // FIX: peer removed from deps — we read it via peerRef.current instead.
    // Adding peer here would re-register the listener every time a new peer is
    // created (causing signal duplication).
  }, [socket]);

  // Periodic connection quality updates
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(updateConnectionQuality, 5000);
    return () => clearInterval(interval);
  }, [isConnected, updateConnectionQuality]);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    if (credentialRefreshTimerRef.current) {
      clearInterval(credentialRefreshTimerRef.current);
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // FIX: properly stop all media tracks to release camera/mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Release remote stream reference (tracks will naturally end when peer closes,
    // but clearing the ref prevents components from holding onto it).
    remoteStreamRef.current = null;
    connectionMonitorRef.current = null;

    setIsConnected(false);
    setPartnerId(null);
    setIsUsingTurn(false);
    setConnectionQuality('unknown');
    setConnectionStats(null);
    reconnectAttemptsRef.current = 0;
    setPeer(null);
  }, []); // stable — operates entirely on refs

  const restartIce = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.restartIce();
    }
  }, []);

  return {
    socket,
    peer,
    isConnected,
    partnerId,
    connectionQuality,
    isUsingTurn,
    connectionStats,
    localStreamRef,
    remoteStreamRef,
    initializeStream,
    createPeer,
    setPartnerId,
    cleanup,
    restartIce,
    recreatePeerConnection,
    updateConnectionQuality
  };
};
