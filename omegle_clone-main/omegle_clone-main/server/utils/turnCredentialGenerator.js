const crypto = require('crypto');

/**
 * TURN Credential Generator for Coturn Server
 * Generates time-limited credentials using the TURN REST API
 */
class TurnCredentialGenerator {
  constructor(options = {}) {
    this.secret = options.secret || process.env.TURN_SECRET_KEY;
    this.realm = options.realm || process.env.TURN_REALM || 'unitalks';
    this.ttl = options.ttl || 86400; // 24 hours default
    this.algorithm = options.algorithm || 'sha1';
    
    if (!this.secret) {
      throw new Error('TURN secret key is required');
    }
  }

  /**
   * Generate time-limited TURN credentials
   * @param {string} username - Username for the credential
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Object} - Generated credentials
   */
  generateCredentials(username = null, ttl = null) {
    const credentialTtl = ttl || this.ttl;
    const timestamp = Math.floor(Date.now() / 1000) + credentialTtl;
    const turnUsername = username || timestamp;
    
    // Create the credential using HMAC-SHA1
    const hmac = crypto.createHmac(this.algorithm, this.secret);
    hmac.update(`${turnUsername}:${this.realm}:${timestamp}`);
    const credential = hmac.digest('base64');
    
    return {
      username: turnUsername,
      credential: credential,
      ttl: credentialTtl,
      realm: this.realm,
      algorithm: this.algorithm
    };
  }

  /**
   * Generate multiple credentials for load balancing
   * @param {number} count - Number of credentials to generate
   * @param {number} ttl - Time to live in seconds
   * @returns {Array} - Array of credentials
   */
  generateMultipleCredentials(count = 1, ttl = null) {
    const credentials = [];
    for (let i = 0; i < count; i++) {
      const username = `${Date.now()}_${i}`;
      credentials.push(this.generateCredentials(username, ttl));
    }
    return credentials;
  }

  /**
   * Validate if credentials are still valid
   * @param {string} username - Username from credential
   * @param {string} credential - Credential to validate
   * @returns {boolean} - Whether credentials are valid
   */
  validateCredentials(username, credential) {
    try {
      // Extract timestamp from username
      const parts = username.split('_');
      const timestamp = parseInt(parts[0]) || parseInt(username);
      
      if (isNaN(timestamp)) {
        return false;
      }
      
      // Check if credential has expired
      const now = Math.floor(Date.now() / 1000);
      if (timestamp < now) {
        return false;
      }
      
      // Verify credential
      const hmac = crypto.createHmac(this.algorithm, this.secret);
      hmac.update(`${username}:${this.realm}:${timestamp}`);
      const expectedCredential = hmac.digest('base64');
      
      return credential === expectedCredential;
    } catch (error) {
      console.error('Error validating TURN credentials:', error);
      return false;
    }
  }

  /**
   * Get credential expiration time
   * @param {string} username - Username from credential
   * @returns {number} - Expiration timestamp
   */
  getExpirationTime(username) {
    const parts = username.split('_');
    const timestamp = parseInt(parts[0]) || parseInt(username);
    return timestamp || 0;
  }

  /**
   * Check if credentials are about to expire (within 5 minutes)
   * @param {string} username - Username from credential
   * @returns {boolean} - Whether credentials will expire soon
   */
  isExpiringSoon(username) {
    const expirationTime = this.getExpirationTime(username);
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 300;
    
    return (expirationTime - now) <= fiveMinutes;
  }
}

module.exports = TurnCredentialGenerator;
