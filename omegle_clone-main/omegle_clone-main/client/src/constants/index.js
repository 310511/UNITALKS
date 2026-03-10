// Chat modes
export const CHAT_MODES = {
  TEXT: 'text',
  VOICE: 'voice',
  VIDEO: 'video'
};

// Socket events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USER_COUNT: 'userCount',
  
  // Queue management
  JOIN_QUEUE: 'joinQueue',
  LEAVE_CHAT: 'leaveChat',
  MATCH: 'match',
  PARTNER_DISCONNECTED: 'partnerDisconnected',
  PARTNER_SKIPPED: 'partnerSkipped',
  
  // WebRTC
  SIGNAL: 'signal',
  WEBRTC_RESTART: 'webrtc-restart',
  
  // Chat
  MESSAGE: 'message',
  
  // Voice/Video calls
  VOICE_CALL_REQUEST: 'voiceCallRequest',
  VOICE_CALL_REQUEST_RECEIVED: 'voiceCallRequestReceived',
  VOICE_CALL_ACCEPTED: 'voiceCallAccepted',
  VOICE_CALL_DECLINED: 'voiceCallDeclined',
  
  VIDEO_CALL_REQUEST: 'videoCallRequest',
  VIDEO_CALL_REQUEST_RECEIVED: 'videoCallRequestReceived',
  VIDEO_CALL_ACCEPTED: 'videoCallAccepted',
  VIDEO_CALL_DECLINED: 'videoCallDeclined',
  
  TEXT_CHAT_REQUEST: 'textChatRequest',
  TEXT_CHAT_REQUEST_RECEIVED: 'textChatRequestReceived',
  TEXT_CHAT_ACCEPTED: 'textChatAccepted',
  TEXT_CHAT_DECLINED: 'textChatDeclined',
  
  // Features
  WATCH_ALONG_EVENT: 'watchAlongEvent',
  WATCH_ALONG_INVITATION: 'watchAlongInvitation',
  WATCH_ALONG_ACCEPTED: 'watchAlongAccepted',
  WATCH_ALONG_DECLINED: 'watchAlongDeclined',
  WATCH_ALONG_CLOSED: 'watchAlongClosed',
  FEATURE_SWITCH: 'feature-switch',
  WATCH_ALONG_RESPONSE: 'watchAlongResponse',
  
  MUSIC_EVENT: 'musicEvent',
  
  // Games
  GAME_INVITATION: 'gameInvitation',
  GAME_ACCEPTED: 'gameAccepted',
  GAME_DECLINED: 'gameDeclined',
  GAME_EXIT: 'game-exit',
  
  // Tic Tac Toe
  TICTACTOE_MOVE: 'tictactoe-move',
  TICTACTOE_REMATCH: 'tictactoe-rematch',
  
  // Chess
  CHESS_MOVE: 'chess-move',
  CHESS_REMATCH: 'chess-rematch',
  CHESS_UNDO_REQUEST: 'chess-undo-request',
  CHESS_UNDO_APPLY: 'chess-undo-apply',
  CHESS_UNDO_DECLINE: 'chess-undo-decline',
  CHESS_UNDO_CANCEL: 'chess-undo-cancel',
  CHESS_RESIGN: 'chess-resign',
  CHESS_REACT: 'chess-react',
  
  // Truth or Dare
  TOD_TARGET: 'tod-target',
  TOD_CHOICE: 'tod-choice',
  TOD_RESULT: 'tod-result',
  TOD_VERIFY: 'tod-verify',
  TOD_RESET: 'tod-reset',
  
  // Rock Paper Scissors
  RPS_MOVE: 'rps-move',
  RPS_MOVE_CONFIRMED: 'rps-move-confirmed',
  RPS_REMATCH: 'rps-rematch'
};

// Game types
export const GAME_TYPES = {
  TICTACTOE: 'tictactoe',
  CHESS: 'chess',
  RPS: 'rps',
  TRUTH_OR_DARE: 'truth-or-dare'
};

// Media constraints
export const MEDIA_CONSTRAINTS = {
  VIDEO: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  },
  AUDIO: {
    video: false,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
};

// UI constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_INDICATOR_TIMEOUT: 3000,
  RECONNECT_DELAY: 5000,
  PEER_CONNECTION_TIMEOUT: 15000
};
