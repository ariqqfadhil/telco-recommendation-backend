// src\models\User.js

const mongoose = require('mongoose');

/**
 * User Model - Simple Authentication + Customer Data
 * Updated to include frontend required fields
 */
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
    
    // Name
    name: {
      type: String,
      trim: true,
      default: '',
    },
    
    // Role for authorization
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    
    // ========== FRONTEND REQUIRED FIELDS ==========
    
    // Device information
    deviceBrand: {
      type: String,
      enum: ['Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'Unknown'],
      default: 'Unknown',
    },
    
    // Plan type
    planType: {
      type: String,
      enum: ['Prepaid', 'Postpaid'],
      default: 'Prepaid',
    },
    
    // Validity/Duration (in days)
    validity: {
      type: Number,
      default: 30, // 30 days default
    },
    
    // ========== USER QUOTAS & BALANCE ==========
    
    // Pulsa/Balance
    balance: {
      type: Number,
      default: 0, // in Rupiah
    },
    
    // Data internet quota (in MB)
    dataQuota: {
      type: Number,
      default: 0,
    },
    
    // Video streaming quota (in MB)
    videoQuota: {
      type: Number,
      default: 0,
    },
    
    // SMS quota
    smsQuota: {
      type: Number,
      default: 0,
    },
    
    // Voice call quota (in minutes)
    voiceQuota: {
      type: Number,
      default: 0,
    },
    
    // ========== ORIGINAL FIELDS ==========
    
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
      default: true, // Auto-verified for simple login
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

// Index for performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ planType: 1 });
userSchema.index({ deviceBrand: 1 });

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

// Method to format data for frontend display
userSchema.methods.getFrontendData = function() {
  return {
    id: this._id,
    phoneNumber: this.phoneNumber,
    name: this.name,
    // Frontend required fields
    deviceBrand: this.deviceBrand,
    planType: this.planType,
    validity: this.validity,
    // Quotas
    balance: this.balance,
    dataQuota: this.dataQuota,
    videoQuota: this.videoQuota,
    smsQuota: this.smsQuota,
    voiceQuota: this.voiceQuota,
    // Other
    preferences: this.preferences,
    lastLogin: this.lastLogin,
  };
};

// Set toJSON to remove sensitive fields and clean up response
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret._id; // Remove _id, keep only 'id' virtual field
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);