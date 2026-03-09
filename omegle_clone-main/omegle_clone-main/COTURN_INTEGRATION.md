# Coturn STUN/TURN Server Integration Guide

## Overview

This integration adds Coturn STUN/TURN server support to your WebSocket/Socket.io real-time communication application, enabling reliable peer-to-peer connections across different network configurations including NAT traversal and firewall restrictions.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   TURN Server   │    │   Client B      │
│                 │◄──►│   (Coturn)      │◄──►│                 │
│ WebRTC Peer     │    │                 │    │ WebRTC Peer     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Socket.io     │
                    │   Signaling     │
                    │   Server        │
                    └─────────────────┘
```

## Features

- **Dynamic Credential Generation**: Time-limited TURN credentials for security
- **Automatic Fallback**: Direct → STUN → TURN connection strategy
- **Connection Monitoring**: Real-time connection quality assessment
- **Credential Refresh**: Automatic credential renewal before expiration
- **Multi-Transport Support**: UDP, TCP, and TLS protocols
- **Health Monitoring**: Server health checks and metrics
- **Docker Support**: Containerized deployment ready

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f coturn
```

### 3. Manual Setup

#### Coturn Server

```bash
# Install Coturn
sudo apt-get update
sudo apt-get install coturn

# Copy configuration
sudo cp turnserver.conf /etc/coturn/

# Update configuration with your settings
sudo nano /etc/coturn/turnserver.conf

# Start service
sudo systemctl restart coturn
sudo systemctl enable coturn
```

#### Application Server

```bash
# Install dependencies
npm install

# Start server
npm start
```

## Configuration

### Coturn Server Configuration

Key settings in `turnserver.conf`:

```ini
# Network
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=YOUR_PUBLIC_IP

# Authentication
use-auth-secret
static-auth-secret=YOUR_SUPER_SECRET_KEY_HERE
realm=unitalks

# Transport
udp-enabled=true
tcp-enabled=true
tls-enabled=true
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TURN_SERVER_URL` | TURN server URL | `turn:localhost:3478` |
| `TURN_SECRET_KEY` | Shared secret for auth | Required |
| `TURN_REALM` | Authentication realm | `unitalks` |
| `TURN_CREDENTIAL_TTL` | Credential lifetime (seconds) | `3600` |
| `STUN_SERVER_URL` | Fallback STUN server | Google STUN |
| `TURN_PUBLIC_IP` | Server public IP | Required |

## API Endpoints

### GET `/api/ice-config`

Returns WebRTC ICE configuration with time-limited TURN credentials.

**Response:**
```json
{
  "success": true,
  "configuration": {
    "iceServers": [
      {
        "urls": "stun:stun.l.google.com:19302",
        "credentialType": "password"
      },
      {
        "urls": "turn:your-server.com:3478",
        "username": "1640995200",
        "credential": "base64-encoded-hmac",
        "credentialType": "password"
      }
    ],
    "credentials": {
      "username": "1640995200",
      "expiresAt": "2022-01-01T00:00:00.000Z",
      "ttl": 3600
    }
  }
}
```

### GET `/api/turn-health`

Health check for TURN server availability.

### POST `/api/refresh-credentials`

Refresh TURN credentials before expiration.

## Client Integration

### Enhanced WebRTC Hook

```javascript
import { useWebRTC } from './hooks/useWebRTC';

function VideoChat() {
  const {
    peer,
    isConnected,
    connectionQuality,
    isUsingTurn,
    connectionStats,
    initializeStream,
    createPeer,
    cleanup
  } = useWebRTC('http://localhost:5002', 'video');

  // Use the enhanced hook with automatic fallback
  useEffect(() => {
    const setupConnection = async () => {
      try {
        await initializeStream();
        await createPeer(true); // Will auto-fetch ICE config
      } catch (error) {
        console.error('Connection setup failed:', error);
      }
    };

    setupConnection();
    return cleanup;
  }, []);
}
```

### Connection Quality Monitoring

```javascript
// Monitor connection quality
useEffect(() => {
  if (connectionQuality === 'failed') {
    // Implement fallback strategy
    console.log('Connection failed, attempting TURN relay');
  }
}, [connectionQuality]);

// Check if using TURN relay
if (isUsingTurn) {
  console.log('Using TURN relay for connection');
}
```

## Security Best Practices

### 1. Credential Management

- Use strong, random secret keys
- Implement credential rotation (handled automatically)
- Limit credential TTL to appropriate duration
- Monitor for credential abuse

### 2. Network Security

```bash
# Firewall rules for Coturn
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp
```

### 3. SSL/TLS Configuration

```ini
# Enable TLS for TURN
tls-enabled=true
cert=/path/to/cert.pem
pkey=/path/to/private.key
```

## Monitoring and Debugging

### Connection States

- **excellent**: Direct peer connection
- **good**: TURN relay connection
- **poor**: Connection issues
- **failed**: Connection failed

### Debug Logging

```javascript
// Enable debug logging
localStorage.setItem('debug', 'webrtc:*');

// Monitor connection stats
console.log('Connection stats:', connectionStats);
```

### Server Logs

```bash
# View Coturn logs
sudo tail -f /var/log/turnserver.log

# View application logs
docker-compose logs -f app
```

## Performance Optimization

### 1. ICE Candidate Pooling

```javascript
const config = await getRtcConfig({
  iceCandidatePoolSize: 4,
  bundlePolicy: 'max-bundle'
});
```

### 2. Connection Quality

```javascript
// Monitor and adapt based on quality
if (connectionQuality === 'poor') {
  // Reduce video quality
  // Switch to audio-only
  // Force TURN relay
}
```

### 3. Load Balancing

For high-traffic deployments:

- Use multiple TURN servers
- Implement DNS round-robin
- Monitor server load
- Auto-scale based on demand

## Troubleshooting

### Common Issues

1. **TURN Connection Failed**
   - Check server IP configuration
   - Verify firewall rules
   - Test credential generation

2. **Audio/Video Not Working**
   - Check browser permissions
   - Verify ICE candidates
   - Test with different networks

3. **Performance Issues**
   - Monitor server resources
   - Check network latency
   - Optimize codec settings

### Debug Commands

```bash
# Test TURN server
turnutils_uclient -T -u test -w test your-turn-server.com

# Check network connectivity
telnet your-turn-server.com 3478

# Monitor active connections
sudo netstat -anp | grep turnserver
```

## Production Deployment

### 1. Infrastructure

- Use dedicated TURN servers
- Implement load balancing
- Set up monitoring and alerting
- Configure SSL certificates

### 2. Scaling

- Horizontal scaling with Redis adapter
- Geographic distribution
- Auto-scaling based on load
- Backup TURN servers

### 3. Monitoring

- Connection success rates
- Server resource usage
- Network latency metrics
- Error rate tracking

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review server and client logs
3. Test with the provided debug tools
4. Monitor server health endpoints

## License

This integration follows the same license as the main project. Coturn is licensed under BSD 3-Clause.
