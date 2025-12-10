const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Primary identifier: Phone number
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Indonesian phone number format: 08xxx or +628xxx
          return /^(\+62|62|0)[0-9]{9,12}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    
    // Optional: Name (bisa diisi saat onboarding atau nanti)
    name: {
      type: String,
      trim: true,
      default: '',
    },
    
    // OTP fields untuk authentication
    otp: {
      code: {
        type: String,
        select: false, // Don't include in query results by default
      },
      expiresAt: {
        type: Date,
        select: false,
      },
      attempts: {
        type: Number,
        default: 0,
        select: false,
      },
      lastSentAt: {
        type: Date,
        select: false,
      },
    },
    
    // Role for authorization
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    
    // User preferences untuk profiling rekomendasi
    preferences: {
      usageType: {
        type: String,
        enum: ['data', 'voice', 'sms', 'mixed'],
        default: 'mixed',
      },
      budget: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      interests: [{
        type: String,
        enum: ['streaming', 'gaming', 'social-media', 'work', 'browsing'],
      }],
    },
    
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // Optional: Profile picture URL
    profilePicture: {
      type: String,
      default: '',
    },
    
    // Metadata
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to format phone number for display
userSchema.virtual('formattedPhone').get(function() {
  // Format: 0812-3456-7890
  const phone = this.phoneNumber.replace(/^(\+62|62)/, '0');
  return phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
});

// Method to check if user is new (no name set)
userSchema.methods.isNewUser = function() {
  return !this.name || this.name === '';
};

// Method to check if OTP is valid
userSchema.methods.isOTPValid = function(code) {
  if (!this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  // Check if OTP expired
  if (new Date() > this.otp.expiresAt) {
    return false;
  }
  
  // Check if code matches
  return this.otp.code === code;
};

// Method to increment OTP attempts
userSchema.methods.incrementOTPAttempts = function() {
  this.otp.attempts = (this.otp.attempts || 0) + 1;
};

// Method to reset OTP attempts
userSchema.methods.resetOTPAttempts = function() {
  this.otp.attempts = 0;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp.code = undefined;
  this.otp.expiresAt = undefined;
  this.otp.attempts = 0;
};

module.exports = mongoose.model('User', userSchema);