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
    
    // PIN for authentication (6 digits)
    pin: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{6}$/.test(v);
        },
        message: 'PIN must be 6 digits'
      }
    },
    
    // Role for authorization
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
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

// Index for faster queries
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });

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

module.exports = mongoose.model('User', userSchema);