const jwt = require('@hapi/jwt');
const config = require('../config/env');

/**
 * Generate JWT Token
 */
const generateToken = (payload) => {
  const token = jwt.token.generate(
    payload,
    {
      key: config.jwt.secret,
      algorithm: 'HS256',
    },
    {
      ttlSec: convertToSeconds(config.jwt.expiresIn),
    }
  );

  return token;
};

/**
 * Verify JWT Token
 */
const verifyToken = (token) => {
  try {
    const artifacts = jwt.token.decode(token);
    jwt.token.verify(artifacts, config.jwt.secret);
    return { isValid: true, decoded: artifacts.decoded.payload };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

/**
 * Convert time string to seconds (e.g., '7d' -> 604800)
 */
const convertToSeconds = (timeString) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const match = timeString.match(/^(\d+)([smhdw])$/);
  if (!match) return 86400; // default 1 day

  const value = parseInt(match[1]);
  const unit = match[2];

  return value * units[unit];
};

module.exports = {
  generateToken,
  verifyToken,
};