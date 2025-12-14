// src/models/UsageProfile.js (FIXED - No Duplicate Declaration)

const mongoose = require('mongoose');

const usageProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
    },
    
    // Device Information
    deviceInfo: {
      model: {
        type: String,
        trim: true,
      },
      brand: {
        type: String,
        trim: true,
      },
      os: {
        type: String,
        trim: true,
      },
      osVersion: {
        type: String,
        trim: true,
      },
      purchaseDate: Date,
    },
    
    // Usage Statistics (untuk ML features)
    stats: {
      // Data usage
      avgDataUsage: {
        daily: { type: Number, default: 0 },    // in MB
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
      },
      
      // Call duration
      avgCallDuration: {
        daily: { type: Number, default: 0 },    // in minutes
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
      },
      
      // SMS count
      avgSms: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
      },
      
      // Peak usage patterns
      peakUsageTime: {
        hours: [{ type: Number, min: 0, max: 23 }],  // [19, 20, 21]
        days: [{ type: String }],                     // ["Saturday", "Sunday"]
      },
      
      // Spending
      avgMonthlySpending: {
        type: Number,
        default: 0,
      },
      
      // Video usage percentage (for ML)
      pctVideoUsage: {
        type: Number,
        default: 0.3,
        min: 0,
        max: 1
      },
      
      // Top-up frequency (for ML)
      topupFreq: {
        type: Number,
        default: 1  // monthly = 1, weekly = 4, etc
      },
      
      // Complaint count (for ML)
      complaintCount: {
        type: Number,
        default: 0
      }
    },
    
    // Behavioral Patterns (derived features untuk ML)
    patterns: {
      isHeavyDataUser: {
        type: Boolean,
        default: false,
      },
      preferredContentType: {
        type: String,
        enum: ['video', 'gaming', 'browsing', 'social', 'mixed'],
        default: 'mixed',
      },
      roamingFrequency: {
        type: String,
        enum: ['never', 'occasional', 'frequent'],
        default: 'never',
      },
      hasFamilyPlan: {
        type: Boolean,
        default: false,
      },
      rechargePattern: {
        type: String,
        enum: ['irregular', 'weekly', 'monthly', 'quarterly'],
        default: 'monthly',
      },
      travelScore: {
        type: Number,
        default: 0.1,
        min: 0,
        max: 1
      }
    },
    
    // Usage History (time series data)
    history: [{
      date: {
        type: Date,
        required: true,
      },
      dataUsed: {
        type: Number,
        default: 0,
      },
      callDuration: {
        type: Number,
        default: 0,
      },
      smsCount: {
        type: Number,
        default: 0,
      },
      spending: {
        type: Number,
        default: 0,
      },
      topApps: [{
        type: String,
      }],
      location: {
        type: String,
        trim: true,
      },
    }],
    
    // ML Metadata
    mlMetadata: {
      lastProcessed: {
        type: Date,
        default: Date.now,
      },
      featureVersion: {
        type: String,
        default: 'v1.0',
      },
      // Cluster dari ML model (e.g., K-means clustering)
      clusterLabel: {
        type: String,
        trim: true,
      },
      // User segment dari ML
      userSegment: {
        type: String,
        enum: [
          'heavy_data_user',
          'heavy_voice_user',
          'balanced_user',
          'light_user',
          'inactive_user',
        ],
      },
      // Churn prediction
      churnRisk: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      // Lifetime value prediction
      predictedLTV: {
        type: Number,
        default: 0,
      },
      // Current plan type (for ML)
      planType: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'Prepaid', 'Postpaid'],
        default: 'standard'
      }
    },
    
    // Data quality & freshness
    dataQuality: {
      completeness: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      dataPoints: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
// Note: userId already has unique index from schema definition
usageProfileSchema.index({ 'mlMetadata.userSegment': 1 });
usageProfileSchema.index({ 'mlMetadata.lastProcessed': 1 });
usageProfileSchema.index({ 'dataQuality.lastUpdated': 1 }); // For sorting by freshness

// Virtual for getting related user
usageProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Method: Calculate averages from history
usageProfileSchema.methods.calculateAverages = function() {
  if (this.history.length === 0) return;
  
  const recentHistory = this.history.slice(-30); // Last 30 records
  
  const totalData = recentHistory.reduce((sum, h) => sum + h.dataUsed, 0);
  const totalCalls = recentHistory.reduce((sum, h) => sum + h.callDuration, 0);
  const totalSms = recentHistory.reduce((sum, h) => sum + h.smsCount, 0);
  
  this.stats.avgDataUsage.daily = totalData / recentHistory.length;
  this.stats.avgCallDuration.daily = totalCalls / recentHistory.length;
  this.stats.avgSms.daily = totalSms / recentHistory.length;
  
  // Calculate monthly (approximate)
  this.stats.avgDataUsage.monthly = this.stats.avgDataUsage.daily * 30;
  this.stats.avgCallDuration.monthly = this.stats.avgCallDuration.daily * 30;
  this.stats.avgSms.monthly = this.stats.avgSms.daily * 30;
};

// Method: Add usage record
usageProfileSchema.methods.addUsageRecord = function(usageData) {
  this.history.push(usageData);
  
  // Keep only last 90 days
  if (this.history.length > 90) {
    this.history = this.history.slice(-90);
  }
  
  this.calculateAverages();
  this.dataQuality.lastUpdated = new Date();
  this.dataQuality.dataPoints = this.history.length;
};

// Method: Get ML features for recommendation
usageProfileSchema.methods.getMLFeatures = function() {
  return {
    // Usage patterns
    avgDataUsage: this.stats.avgDataUsage.monthly,
    avgCallDuration: this.stats.avgCallDuration.monthly,
    avgSmsCount: this.stats.avgSms.monthly,
    avgSpending: this.stats.avgMonthlySpending,
    pctVideoUsage: this.stats.pctVideoUsage,
    topupFreq: this.stats.topupFreq,
    complaintCount: this.stats.complaintCount,
    
    // Behavioral
    isHeavyDataUser: this.patterns.isHeavyDataUser,
    contentType: this.patterns.preferredContentType,
    roamingFrequency: this.patterns.roamingFrequency,
    hasFamilyPlan: this.patterns.hasFamilyPlan,
    travelScore: this.patterns.travelScore,
    
    // Device
    deviceBrand: this.deviceInfo.brand,
    deviceOS: this.deviceInfo.os,
    
    // ML metadata
    userSegment: this.mlMetadata.userSegment,
    clusterLabel: this.mlMetadata.clusterLabel,
    planType: this.mlMetadata.planType,
    
    // Data quality
    dataPoints: this.dataQuality.dataPoints,
    completeness: this.dataQuality.completeness,
  };
};

module.exports = mongoose.model('UsageProfile', usageProfileSchema);