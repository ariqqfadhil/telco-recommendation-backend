// src\models\Recommendation.js

const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recommendedProducts: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      reason: {
        type: String,
        trim: true,
      },
    }],
    // Metadata untuk tracking
    modelVersion: {
      type: String,
      default: 'v1.0',
    },
    algorithm: {
      type: String,
      enum: ['collaborative', 'content-based', 'hybrid'],
      default: 'hybrid',
    },
    // User interaction tracking
    interactions: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      action: {
        type: String,
        enum: ['viewed', 'clicked', 'purchased', 'ignored'],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    // Performance metrics
    accuracy: Number,
    responseTime: Number, // in milliseconds
  },
  {
    timestamps: true,
  }
);

// Indexes
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ 'recommendedProducts.productId': 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);