const mongoose = require('mongoose');

/**
 * Product Model - Aligned with ML Dataset
 * Simplified based on actual ML features needed
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    category: {
      type: String,
      required: true,
      enum: ['data', 'voice', 'sms', 'combo', 'roaming', 'streaming', 'device', 'retention'],
    },
    
    description: {
      type: String,
      required: true,
    },
    
    price: {
      type: Number,
      required: true,
    },
    
    // Specifications - simplified
    specifications: {
      // Data packages
      dataQuota: Number, // in MB
      videoDataQuota: Number, // in MB - for streaming packages
      
      // Voice packages
      voiceMinutes: Number,
      
      // SMS packages
      smsCount: Number,
      
      // Validity period
      validity: Number, // in days
      
      // Roaming packages
      roaming: {
        isAvailable: {
          type: Boolean,
          default: false,
        },
        countries: [String], // ['Singapore', 'Malaysia', 'Thailand']
        dataQuota: Number, // roaming data in MB
        voiceMinutes: Number, // roaming voice minutes
      },
    },
    
    // Target mapping - untuk mapping dengan ML recommendations
    targetOffer: {
      type: String,
      enum: [
        'Data Booster',
        'Device Upgrade Offer',
        'Family Plan Offer',
        'Voice Bundle',
        'Roaming Pass',
        'Streaming Partner Pack',
        'General Offer',
        'Retention Offer',
        'Top-up Promo',
      ],
    },
    
    // Image & metadata
    imageUrl: String,
    
    // Admin control
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Purchase tracking (for analytics only)
    purchaseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ targetOffer: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text' }); // For search

// Method: Get products by target offer
productSchema.statics.findByTargetOffer = function(targetOffer) {
  return this.find({ targetOffer, isActive: true });
};

// Virtual - clean response
productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove internal fields
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);