// Centralized WebRTC configuration (STUN/TURN)
// Enhanced with dynamic credential fetching and fallback mechanisms

function parseJsonEnv(name, fallback) {
  try {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

/**
 * Fetch dynamic ICE configuration from server
 * @returns {Promise<Object>} - ICE configuration with time-limited credentials
 */
export async function fetchIceConfig() {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    const response = await fetch(`${apiUrl}/ice-config`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch ICE configuration');
    }
    
    return data.configuration;
  } catch (error) {
    console.error('Error fetching ICE configuration:', error);
    // Fallback to static configuration
    return getStaticRtcConfig();
  }
}

/**
 * Refresh TURN credentials before expiration
 * @param {string} currentUsername - Current TURN username
 * @returns {Promise<Object>} - New credentials or null if not needed
 */
export async function refreshTurnCredentials(currentUsername) {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    const response = await fetch(`${apiUrl}/refresh-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentUsername })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to refresh credentials');
    }
    
    return data;
  } catch (error) {
    console.error('Error refreshing credentials:', error);
    return null;
  }
}

/**
 * Static fallback configuration
 * @returns {Object} - Basic WebRTC configuration
 */
function getStaticRtcConfig() {
  const defaultStun = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  // Environment-based TURN configuration (legacy support)
  const turnUrl = process.env.REACT_APP_TURN_URL;
  const turnUsername = process.env.REACT_APP_TURN_USERNAME;
  const turnCredential = process.env.REACT_APP_TURN_CREDENTIAL;

  const iceServers = [...defaultStun];
  
  if (turnUrl && turnUsername && turnCredential) {
    // Add TURN server with multiple transport options
    iceServers.push({ 
      urls: turnUrl, 
      username: turnUsername, 
      credential: turnCredential,
      credentialType: 'password'
    });
    
    // Add TCP fallback
    if (turnUrl.startsWith('turn:') && !/transport=/.test(turnUrl)) {
      iceServers.push({ 
        urls: `${turnUrl}?transport=tcp`, 
        username: turnUsername, 
        credential: turnCredential,
        credentialType: 'password'
      });
    }
    
    // Add TLS fallback
    iceServers.push({ 
      urls: turnUrl.replace('turn:', 'turns:') || `turns:${turnUrl.split(':')[1]}:5349`, 
      username: turnUsername, 
      credential: turnCredential,
      credentialType: 'password'
    });
  }

  return {
    iceServers,
    iceCandidatePoolSize: 8,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };
}

/**
 * Enhanced WebRTC configuration with dynamic credentials
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Complete WebRTC configuration
 */
export async function getRtcConfig(options = {}) {
  const {
    useDynamicCredentials = true,
    iceTransportPolicy = 'all', // 'all', 'relay'
    bundlePolicy = 'max-bundle',
    rtcpMuxPolicy = 'require',
    iceCandidatePoolSize = 4
  } = options;

  // Check for full ICE servers in environment (legacy support)
  const fullIce = parseJsonEnv('REACT_APP_ICE_SERVERS', null);
  if (fullIce && !useDynamicCredentials) {
    return {
      iceServers: fullIce,
      iceTransportPolicy,
      bundlePolicy,
      rtcpMuxPolicy,
      iceCandidatePoolSize
    };
  }

  // Try to fetch dynamic configuration
  if (useDynamicCredentials) {
    try {
      const dynamicConfig = await fetchIceConfig();
      return {
        ...dynamicConfig,
        iceTransportPolicy,
        bundlePolicy,
        rtcpMuxPolicy,
        iceCandidatePoolSize
      };
    } catch (error) {
      console.warn('Failed to fetch dynamic ICE config, using fallback:', error);
    }
  }

  // Fallback to static configuration
  const staticConfig = getStaticRtcConfig();
  return {
    ...staticConfig,
    iceTransportPolicy,
    bundlePolicy,
    rtcpMuxPolicy,
    iceCandidatePoolSize
  };
}

/**
 * Monitor connection quality and suggest fallback strategies
 * @param {RTCPeerConnection} peerConnection - The peer connection to monitor
 * @returns {Object} - Connection monitoring utilities
 */
export function createConnectionMonitor(peerConnection) {
  if (!peerConnection) {
    console.warn('Cannot create connection monitor: peerConnection is null');
    return {
      getStats: () => ({ connectionState: 'new', iceConnectionState: 'new', iceGatheringState: 'new', signalingState: 'new' }),
      isConnected: () => false,
      needsFallback: () => false,
      getConnectionType: async () => null
    };
  }

  const stats = {
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'new',
    signalingState: 'new',
    candidates: [],
    selectedCandidatePair: null,
    startTime: Date.now()
  };

  const updateStats = () => {
    if (!peerConnection) return;
    try {
      stats.connectionState = peerConnection.connectionState;
      stats.iceConnectionState = peerConnection.iceConnectionState;
      stats.iceGatheringState = peerConnection.iceGatheringState;
      stats.signalingState = peerConnection.signalingState;
    } catch (error) {
      console.warn('Error updating connection stats:', error);
    }
  };

  const monitor = {
    getStats: () => ({ ...stats }),
    
    isConnected: () => {
      updateStats();
      return stats.iceConnectionState === 'connected' || stats.iceConnectionState === 'completed';
    },
    
    needsFallback: () => {
      updateStats();
      return stats.iceConnectionState === 'failed' || stats.iceConnectionState === 'disconnected';
    },
    
    getConnectionType: async () => {
      try {
        const rtcStats = await peerConnection.getStats();
        rtcStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            stats.selectedCandidatePair = {
              localCandidateId: report.localCandidateId,
              remoteCandidateId: report.remoteCandidateId,
              nominated: report.nominated,
              writable: report.writable
            };
          }
        });
        return stats.selectedCandidatePair;
      } catch (error) {
        console.error('Error getting connection stats:', error);
        return null;
      }
    }
  };

  // Set up event listeners
  if (peerConnection) {
    try {
      peerConnection.addEventListener('connectionstatechange', updateStats);
      peerConnection.addEventListener('iceconnectionstatechange', updateStats);
      peerConnection.addEventListener('icegatheringstatechange', updateStats);
      peerConnection.addEventListener('signalingstatechange', updateStats);
    } catch (error) {
      console.warn('Error setting up connection monitor event listeners:', error);
    }
  }

  return monitor;
}

export default getRtcConfig;


