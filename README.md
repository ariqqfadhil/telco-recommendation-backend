# 📡 Telco Product Recommendation System - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Hapi.js](https://img.shields.io/badge/Hapi.js-21.x-orange.svg)](https://hapi.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

> **Intelligent telecommunication product recommendation system powered by Machine Learning**

A comprehensive backend API for personalized telco product recommendations using hybrid ML algorithms (collaborative filtering + content-based). Built for Capstone Project by Muhammad Ariq Fadhil (A25-CS024).

---

## 🌟 Key Features

### 🤖 **ML-Powered Recommendations**
- Hybrid recommendation engine (collaborative + content-based filtering)
- Integration with Hugging Face deployed ML model
- Natural score distribution preserving ML confidence
- Smart fallback mechanism when ML service unavailable
- Real-time personalization based on user behavior

### 🔐 **Secure Authentication**
- Simple phone-based authentication (no PIN/OTP)
- JWT token authentication (7-day validity)
- Role-based access control (User/Admin)
- Auto-registration for new users
- Secure password handling with bcrypt

### 📦 **Product Management**
- 9 product categories (data, voice, sms, combo, streaming, roaming, device, retention)
- Advanced filtering & search capabilities
- Price range filtering
- Category-based grouping
- Popular products tracking
- Admin CRUD operations

### 👤 **User Profile & Tracking**
- Comprehensive user profiles with quotas
- Usage pattern tracking
- Device information (brand, OS)
- Plan type management (Prepaid/Postpaid)
- Behavioral pattern analysis
- ML feature extraction for recommendations

### 📊 **Analytics & Insights**
- Recommendation history tracking
- User interaction monitoring (viewed, clicked, purchased)
- Performance metrics collection
- Feedback system (1-5 star rating)
- Admin statistics dashboard

---

## 🏗️ Architecture

```
telco-recommendation-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   └── env.js        # Environment variables
│   ├── handlers/         # Request handlers
│   │   ├── authHandler.js
│   │   ├── productHandler.js
│   │   └── recommendationHandler.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js       # JWT authentication
│   ├── models/           # MongoDB models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Recommendation.js
│   │   └── UsageProfile.js
│   ├── routes/           # API routes
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── recommendations.js
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   ├── mlService.js
│   │   └── usageProfileService.js
│   ├── utils/            # Utility functions
│   │   ├── jwt.js
│   │   └── response.js
│   └── server.js         # Main server file
├── public/
│   ├── api-docs.html     # API Documentation
│   └── styles/
│       └── api-docs.css  # Documentation styles
├── .env                  # Environment variables
├── .gitignore
├── package.json
├── railway.json          # Railway deployment config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (local or Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/telco-recommendation-backend.git
   cd telco-recommendation-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   HOST=localhost

   # Database Configuration
   DB_URI=mongodb://localhost:27017/telco_recommendation
   # or MongoDB Atlas:
   # DB_URI=mongodb+srv://username:password@cluster.mongodb.net/telco_recommendation

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d

   # ML Model Service
   ML_SERVICE_URL=https://huuddz-telco-hybrid-api.hf.space/recommend
   ML_SERVICE_TIMEOUT=30000

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Seed database with sample data**
   ```bash
   node seed-data-complete.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:5000`

---

## 📖 API Documentation

### Access Documentation
Open your browser and navigate to:
```
http://localhost:5000/docs
```

### Base URL
```
http://localhost:5000
```

### Quick API Overview

#### 🔐 Authentication
```bash
# Login / Register
POST /api/auth/login
{
  "phoneNumber": "081234567890",
  "name": "John Doe"
}

# Get Profile
GET /api/auth/profile
Authorization: Bearer {token}

# Update Profile
PUT /api/auth/profile
Authorization: Bearer {token}
{
  "name": "Updated Name",
  "preferences": {
    "usageType": "data",
    "budget": "high"
  }
}
```

#### 📦 Products
```bash
# Get All Products
GET /api/products?category=data&page=1&limit=10

# Get Product by ID
GET /api/products/{id}

# Get Categories
GET /api/products/categories/list

# Get Popular Products
GET /api/products/popular/list?limit=10
```

#### 🎯 Recommendations
```bash
# Get Personalized Recommendations
GET /api/recommendations?algorithm=hybrid&limit=5
Authorization: Bearer {token}

# Get Recommendation History
GET /api/recommendations/history?page=1&limit=10
Authorization: Bearer {token}

# Track Interaction
POST /api/recommendations/{id}/interaction
Authorization: Bearer {token}
{
  "productId": "507f1f77bcf86cd799439011",
  "action": "clicked"
}

# Submit Feedback
POST /api/recommendations/feedback
Authorization: Bearer {token}
{
  "recommendationId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "comment": "Great recommendations!"
}
```

---

## 🗄️ Database Schema

### User Model
```javascript
{
  phoneNumber: String (unique),
  name: String,
  role: "user" | "admin",
  deviceBrand: "Samsung" | "Apple" | "Xiaomi" | ...,
  planType: "Prepaid" | "Postpaid",
  validity: Number (days),
  balance: Number (Rupiah),
  dataQuota: Number (MB),
  videoQuota: Number (MB),
  smsQuota: Number,
  voiceQuota: Number (minutes),
  preferences: {
    usageType: "data" | "voice" | "sms" | "mixed",
    budget: "low" | "medium" | "high",
    interests: Array<String>
  }
}
```

### Product Model
```javascript
{
  name: String,
  category: "data" | "voice" | "sms" | "combo" | ...,
  description: String,
  price: Number,
  specifications: {
    dataQuota: Number (MB),
    videoDataQuota: Number (MB),
    voiceMinutes: Number,
    smsCount: Number,
    validity: Number (days)
  },
  targetOffer: String, // ML mapping
  purchaseCount: Number
}
```

### Recommendation Model
```javascript
{
  userId: ObjectId,
  recommendedProducts: [{
    productId: ObjectId,
    score: Number (0-1),
    reason: String
  }],
  algorithm: "collaborative" | "content-based" | "hybrid",
  interactions: [{
    productId: ObjectId,
    action: "viewed" | "clicked" | "purchased" | "ignored"
  }],
  accuracy: Number,
  responseTime: Number (ms)
}
```

---

## 🧪 Testing

### Test Accounts (from seed data)

| Phone Number    | Name              | Role  | Plan Type | Device    |
|----------------|-------------------|-------|-----------|-----------|
| 081234567890   | Admin User        | admin | Postpaid  | Apple     |
| 081234567891   | Regular User      | user  | Prepaid   | Samsung   |
| 081234567892   | Heavy Data User   | user  | Postpaid  | Xiaomi    |
| 081234567893   | Voice User        | user  | Prepaid   | Oppo      |
| 081234567894   | Budget User       | user  | Prepaid   | Vivo      |
| 081234567895   | Streaming User    | user  | Postpaid  | Realme    |

### Manual Testing with cURL

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "081234567891", "name": "Test User"}'

# 2. Get Recommendations (replace {token})
curl -X GET "http://localhost:5000/api/recommendations?limit=5" \
  -H "Authorization: Bearer {token}"

# 3. Get Products
curl -X GET "http://localhost:5000/api/products?category=data&limit=5"
```

---

## 🚢 Deployment

### Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Add environment variables**
   ```bash
   railway variables set DB_URI="your-mongodb-uri"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set ML_SERVICE_URL="your-ml-service-url"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Deploy to Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set DB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set ML_SERVICE_URL="your-ml-service-url"
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-production-secret-key
ML_SERVICE_URL=https://your-ml-service.com/recommend
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 🛠️ Tech Stack

### Core
- **Node.js** (v18+) - Runtime environment
- **Hapi.js** (v21) - Web framework
- **MongoDB** (v7) - NoSQL database
- **Mongoose** (v8) - ODM for MongoDB

### Authentication & Security
- **@hapi/jwt** - JWT authentication
- **bcrypt** - Password hashing
- **@hapi/boom** - Error handling

### ML Integration
- **Axios** - HTTP client for ML API
- **Hugging Face** - ML model deployment

### Validation
- **Joi** - Schema validation

### Development
- **dotenv** - Environment variables
- **nodemon** - Hot reload

---

## 📊 ML Model Integration

### ML Service Architecture

The system integrates with a hybrid recommendation model deployed on Hugging Face:
- **Endpoint**: `https://huuddz-telco-hybrid-api.hf.space/recommend`
- **Algorithm**: Hybrid (Collaborative Filtering + Content-Based)
- **Features**: 10+ user behavior features
- **Response Time**: ~200-500ms average

### ML Features Used

```javascript
{
  avg_data_usage_gb: Float,      // Data usage in GB
  pct_video_usage: Integer,      // Video usage percentage (0-100)
  avg_call_duration: Float,      // Average call duration in minutes
  sms_freq: Integer,             // SMS frequency
  monthly_spend: Float,          // Monthly spending
  topup_freq: Integer,           // Top-up frequency
  travel_score: Integer,         // Travel score (0-100)
  complaint_count: Integer,      // Complaint count
  plan_type: String,             // Prepaid/Postpaid
  device_brand: String           // Device brand
}
```

### Smart Fallback System

When ML service is unavailable, the system uses intelligent rule-based fallback:
- Budget-aware recommendations
- Usage pattern matching
- Popular product suggestions
- User preference-based filtering

---

## 🔧 Configuration

### MongoDB Configuration

#### Local MongoDB
```env
DB_URI=mongodb://localhost:27017/telco_recommendation
```

#### MongoDB Atlas
```env
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/telco_recommendation?retryWrites=true&w=majority
```

### JWT Configuration

```env
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d  # Token valid for 7 days
```

### CORS Configuration

```env
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
```

---

## 📝 Scripts

```json
{
  "start": "node src/server.js",        // Production start
  "dev": "nodemon src/server.js",       // Development with hot reload
  "seed": "node seed-data-complete.js"  // Seed database
}
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to MongoDB
```
✅ Solutions:
1. Check if MongoDB is running (local)
2. Verify DB_URI in .env file
3. For Atlas: Check Network Access whitelist (add 0.0.0.0/0)
4. For Atlas: Verify database user credentials
5. Check your internet connection
```

### JWT Authentication Errors

**Problem**: Token invalid or expired
```
✅ Solutions:
1. Generate new token by logging in again
2. Check JWT_SECRET matches between requests
3. Verify token is included in Authorization header
4. Format: "Authorization: Bearer {token}"
```

### ML Service Timeout

**Problem**: ML recommendations timing out
```
✅ Solutions:
1. Check ML service URL is correct
2. Increase ML_SERVICE_TIMEOUT in .env
3. System will automatically use fallback recommendations
4. Check Hugging Face service status
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Muhammad Ariq Fadhil**
- Student ID: A25-CS024
- Project: Capstone Project - Telco Recommendation System
- Institution: [Your Institution]

---

## 🙏 Acknowledgments

- **Hapi.js** team for excellent framework
- **MongoDB** for scalable database solution
- **Hugging Face** for ML model deployment platform
- **Railway** for easy deployment
- All open-source contributors

---

## 📞 Support

For issues, questions, or suggestions:
- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/telco-recommendation-backend/issues)
- 📖 Documentation: http://localhost:5000/docs

---

<div align="center">
  <p>Made with by Muhammad Ariq Fadhil</p>
  <p>Star this repo if you find it helpful!</p>
</div>