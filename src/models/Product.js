const mongoose = require('mongoose');

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
      enum: ['data', 'voice', 'sms', 'combo', 'vod', 'streaming'],
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    // Spesifikasi produk
    specifications: {
      dataQuota: Number, // in MB
      voiceMinutes: Number,
      smsCount: Number,
      validity: Number, // in days
      speedLimit: String, // e.g., "unlimited", "2Mbps"
    },
    // Features untuk content-based filtering
    features: {
      hasStreaming: Boolean,
      hasGaming: Boolean,
      hasSocialMedia: Boolean,
      hasRoaming: Boolean,
      hasHotspot: Boolean,
    },
    // Metadata
    provider: {
      type: String,
      default: 'Telco',
    },
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    // Untuk tracking popularitas (collaborative filtering)
    purchaseCount: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Product', productSchema);