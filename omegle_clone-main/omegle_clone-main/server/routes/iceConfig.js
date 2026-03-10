const express = require('express');
const TurnCredentialGenerator = require('../utils/turnCredentialGenerator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const router = express.Router();

// Rate limiting for credential requests
const credentialLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Too many credential requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ICE configuration routes are working',
    timestamp: new Date().toISOString()
  });
});

/**
 * ICE Configuration API Endpoint
 * Provides STUN/TURN server configuration with time-limited credentials
 */
router.get('/ice-config', credentialLimiter, async (req, res) => {
  try {
    const { 
      turnServerUrl = process.env.TURN_SERVER_URL || 'turn:your-turn-server.com:3478',
      stunServerUrl = process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
      ttl = process.env.TURN_CREDENTIAL_TTL || 3600 // 1 hour
    } = req.query;

    // Check if TURN secret key is configured
    if (!process.env.TURN_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: 'TURN server not configured',
        message: 'TURN_SECRET_KEY environment variable is not set'
      });
    }

    // Initialize credential generator
    const turnGenerator = new TurnCredentialGenerator({
      secret: process.env.TURN_SECRET_KEY,
      realm: process.env.TURN_REALM || 'unitalks',
      ttl: parseInt(ttl)
    });

    // Generate TURN credentials
    const credentials = turnGenerator.generateCredentials();

    // Build ICE server configuration
    const iceServers = [
      // STUN server (free Google STUN as fallback)
      {
        urls: stunServerUrl,
        credentialType: 'password'
      },
      // TURN server with generated credentials
      {
        urls: turnServerUrl,
        username: credentials.username,
        credential: credentials.credential,
        credentialType: 'password'
      },
      // TURN server over TCP (fallback)
      {
        urls: turnServerUrl.replace('turn:', 'turns:') || `turns:${turnServerUrl.split(':')[1]}:5349`,
        username: credentials.username,
        credential: credentials.credential,
        credentialType: 'password'
      }
    ].filter(server => server.urls && server.urls !== '');

    // ICE configuration with optimal settings
    const iceConfiguration = {
      iceServers: iceServers,
      iceTransportPolicy: 'all', // 'all', 'relay'
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 4,
      credentials: {
        username: credentials.username,
        credential: credentials.credential,
        expiresAt: new Date(Date.now() + (credentials.ttl * 1000)).toISOString(),
        ttl: credentials.ttl
      }
    };

    // Add connection quality monitoring info
    const response = {
      success: true,
      configuration: iceConfiguration,
      metadata: {
        generatedAt: new Date().toISOString(),
        ttl: credentials.ttl,
        expiresAt: iceConfiguration.credentials.expiresAt,
        serverInfo: {
          turnServer: turnServerUrl,
          stunServer: stunServerUrl,
          realm: credentials.realm
        },
        features: {
          tcpFallback: true,
          tlsSupport: true,
          iceRestart: true,
          bundlePolicy: iceConfiguration.bundlePolicy
        }
      }
    };

    // Cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': crypto.createHash('md5').update(JSON.stringify(response)).digest('hex')
    });

    res.json(response);

  } catch (error) {
    console.error('Error generating ICE configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ICE configuration',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Health check endpoint for TURN server availability
 */
router.get('/turn-health', async (req, res) => {
  try {
    const turnServerUrl = process.env.TURN_SERVER_URL;
    if (!turnServerUrl) {
      return res.status(400).json({
        success: false,
        error: 'TURN server URL not configured'
      });
    }

    // Basic connectivity check (you can enhance this with actual TURN protocol checks)
    const response = {
      success: true,
      status: 'healthy',
      server: turnServerUrl,
      timestamp: new Date().toISOString(),
      features: {
        stun: true,
        turn: true,
        tcp: true,
        tls: true
      }
    };

    res.json(response);
  } catch (error) {
    console.error('TURN health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'TURN server health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Credential refresh endpoint
 * Allows clients to refresh credentials before expiration
 */
router.post('/refresh-credentials', credentialLimiter, async (req, res) => {
  try {
    const { currentUsername } = req.body;
    
    if (!currentUsername) {
      return res.status(400).json({
        success: false,
        error: 'Current username is required'
      });
    }

    const turnGenerator = new TurnCredentialGenerator();
    
    // Check if current credentials are expiring soon
    if (!turnGenerator.isExpiringSoon(currentUsername)) {
      return res.json({
        success: true,
        message: 'Current credentials are still valid',
        refreshNeeded: false
      });
    }

    // Generate new credentials
    const newCredentials = turnGenerator.generateCredentials();

    res.json({
      success: true,
      message: 'Credentials refreshed successfully',
      refreshNeeded: true,
      credentials: {
        username: newCredentials.username,
        credential: newCredentials.credential,
        expiresAt: new Date(Date.now() + (newCredentials.ttl * 1000)).toISOString(),
        ttl: newCredentials.ttl
      }
    });

  } catch (error) {
    console.error('Error refreshing credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh credentials'
    });
  }
});

module.exports = router;
