const crypto = require('crypto');

/**
 * OTP Service
 * Handles OTP generation, sending, and verification
 */
class OTPService {
  constructor() {
    // OTP Configuration
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY_MINUTES = 5;
    this.MAX_OTP_ATTEMPTS = 3;
    this.RESEND_COOLDOWN_SECONDS = 60; // 1 minute
  }

  /**
   * Generate random OTP code
   */
  generateOTP() {
    // Generate random 6-digit number
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * Calculate OTP expiry time
   */
  getExpiryTime() {
    const now = new Date();
    return new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
  }

  /**
   * Check if can resend OTP (cooldown period)
   */
  canResendOTP(lastSentAt) {
    if (!lastSentAt) return true;
    
    const now = new Date();
    const timeSinceLastSent = (now - lastSentAt) / 1000; // in seconds
    
    return timeSinceLastSent >= this.RESEND_COOLDOWN_SECONDS;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(lastSentAt) {
    if (!lastSentAt) return 0;
    
    const now = new Date();
    const timeSinceLastSent = (now - lastSentAt) / 1000;
    const remaining = this.RESEND_COOLDOWN_SECONDS - timeSinceLastSent;
    
    return Math.max(0, Math.ceil(remaining));
  }

  /**
   * Send OTP via SMS (Mock implementation)
   * TODO: Integrate dengan SMS gateway (Twilio, Vonage, dll)
   */
  async sendOTP(phoneNumber, otp) {
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      console.log('🔢 OTP Code:', otp);
      
      // TODO: Implement actual SMS sending
      // Example with Twilio:
      // await twilioClient.messages.create({
      //   body: `Your verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber
      // });
      
      // Mock implementation - just log for now
      console.log(`
╔════════════════════════════════════╗
║     OTP VERIFICATION CODE          ║
║                                    ║
║     Phone: ${phoneNumber.padEnd(20)}║
║     Code:  ${otp}                  ║
║     Valid: ${this.OTP_EXPIRY_MINUTES} minutes             ║
║                                    ║
║  (This is a mock - integrate SMS)  ║
╚════════════════════════════════════╝
      `);
      
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
        error: error.message,
      };
    }
  }

  /**
   * Validate OTP format
   */
  isValidOTPFormat(otp) {
    // Must be 6 digits
    return /^[0-9]{6}$/.test(otp);
  }

  /**
   * Format phone number for SMS
   */
  formatPhoneNumber(phoneNumber) {
    // Convert to E.164 format (+628xxx)
    let formatted = phoneNumber.replace(/[\s-]/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '+62' + formatted.substring(1);
    } else if (formatted.startsWith('62')) {
      formatted = '+' + formatted;
    } else if (!formatted.startsWith('+')) {
      formatted = '+62' + formatted;
    }
    
    return formatted;
  }

  /**
   * Get OTP configuration info (for client)
   */
  getConfig() {
    return {
      otpLength: this.OTP_LENGTH,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
      maxAttempts: this.MAX_OTP_ATTEMPTS,
      resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
    };
  }
}

module.exports = new OTPService();