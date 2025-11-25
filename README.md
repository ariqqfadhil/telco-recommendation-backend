Telco Product Recommendation System - Backend API
Backend API untuk sistem rekomendasi produk telekomunikasi berbasis perilaku pelanggan, dibangun menggunakan Hapi.js framework.

Tim Capstone Project A25-CS024
Backend Developer: Muhammad Ariq Fadhil (F284D5Y1219)

🚀 Tech Stack
Framework: Hapi.js v21
Database: MongoDB (with Mongoose ODM)
Authentication: JWT (@hapi/jwt)
Validation: Joi
Password Hashing: Bcrypt
ML Integration: Axios (untuk komunikasi dengan ML service)
📋 Prerequisites
Sebelum menjalankan project, pastikan sudah terinstall:

Node.js >= 18.x
npm >= 9.x
MongoDB (local atau MongoDB Atlas)
🛠️ Installation
1. Clone Repository
bash
git clone https://github.com/username/telco-recommendation-backend.git
cd telco-recommendation-backend
2. Install Dependencies
bash
npm install
3. Setup Environment Variables
Copy file .env.example menjadi .env:

bash
cp .env.example .env
Edit file .env sesuai konfigurasi Anda:

env
NODE_ENV=development
PORT=5000
HOST=localhost

DB_URI=mongodb://localhost:27017/telco_recommendation
# Atau gunakan MongoDB Atlas:
# DB_URI=mongodb+srv://username:password@cluster.mongodb.net/telco_recommendation

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

ML_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000
4. Run Development Server
bash
npm run dev
Server akan berjalan di http://localhost:5000

5. Run Production Server
bash
npm start
📚 API Endpoints
Health Check
GET / - Check API status
Authentication (/api/auth)
POST /api/auth/register - Register user baru
POST /api/auth/login - Login user
GET /api/auth/profile - Get user profile (requires auth)
PUT /api/auth/profile - Update user profile (requires auth)
POST /api/auth/change-password - Ubah password (requires auth)
POST /api/auth/logout - Logout user (requires auth)
Products (/api/products)
GET /api/products - Get all products (dengan pagination & filter)
GET /api/products/{id} - Get product by ID
GET /api/products/categories/list - Get semua kategori
GET /api/products/popular/list - Get produk populer
POST /api/products - Create product (admin only)
PUT /api/products/{id} - Update product (admin only)
DELETE /api/products/{id} - Delete product (admin only)
Recommendations (/api/recommendations)
GET /api/recommendations - Get personalized recommendations (requires auth)
GET /api/recommendations/history - Get recommendation history (requires auth)
POST /api/recommendations/{id}/interaction - Track user interaction (requires auth)
POST /api/recommendations/feedback - Submit feedback (requires auth)
GET /api/recommendations/stats - Get statistics (admin only)
🔐 Authentication
API menggunakan JWT (JSON Web Token) untuk autentikasi.

Cara Menggunakan:
Register atau Login untuk mendapatkan token
Sertakan token di header request:
Authorization: Bearer YOUR_JWT_TOKEN
Example Request (dengan cURL):
bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
📊 Database Schema
User Model
javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phoneNumber: String,
  role: 'user' | 'admin',
  preferences: {
    usageType: 'data' | 'voice' | 'sms' | 'mixed',
    budget: 'low' | 'medium' | 'high',
    interests: [String]
  },
  usageHistory: [...]
}
Product Model
javascript
{
  name: String,
  category: 'data' | 'voice' | 'sms' | 'combo' | 'vod' | 'streaming',
  description: String,
  price: Number,
  specifications: {...},
  features: {...},
  purchaseCount: Number,
  rating: {...}
}
Recommendation Model
javascript
{
  userId: ObjectId,
  recommendedProducts: [{
    productId: ObjectId,
    score: Number,
    reason: String
  }],
  algorithm: 'collaborative' | 'content-based' | 'hybrid',
  interactions: [...]
}
🤖 ML Service Integration
Backend API siap untuk integrasi dengan ML model. Saat ini menggunakan MOCK DATA karena model masih dalam development.

Ketika ML Model Sudah Ready:
Update ML_SERVICE_URL di .env dengan URL ML service
Uncomment kode di src/services/mlService.js
ML service harus menyediakan endpoint:
POST /predict - Generate recommendations
POST /train - Train/retrain model
GET /metrics - Get model performance
🧪 Testing
Manual Testing dengan Thunder Client / Postman:
Import collection (akan dibuat terpisah)
Set environment variable baseUrl = http://localhost:5000
Register user baru
Login dan copy token
Set token di Authorization header
Test endpoints lainnya
📁 Project Structure
telco-recommendation-backend/
├── src/
│   ├── config/           # Konfigurasi (database, env)
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── handlers/         # Request handlers
│   ├── services/         # Business logic & ML service
│   ├── middleware/       # JWT auth middleware
│   ├── utils/            # Helper functions
│   └── server.js         # Main server file
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── README.md
🚧 Development Status
✅ Completed:

Server setup dengan Hapi.js
Authentication & Authorization (JWT)
User management
Product CRUD operations
Recommendation endpoints
Database models & relations
⏳ In Progress:

ML model integration (waiting for ML team)
Unit testing
API documentation (Swagger)
🔜 Planned:

Rate limiting
Caching (Redis)
Logging system
Deployment ke cloud (GCP/Render)
🤝 Integration dengan Frontend & ML
Untuk Frontend Team:
Base URL: http://localhost:5000/api
Authentication: JWT di header Authorization: Bearer TOKEN
Response format sudah standardized
CORS sudah dikonfigurasi
Untuk ML Team:
Buat service dengan endpoints sesuai mlService.js
Format request/response sudah didefinisikan
Backend akan handle error fallback
📞 Contact
Muhammad Ariq Fadhil
Email: [your-email]
GitHub: [@username]
Tim: A25-CS024

📄 License
This project is part of Bangkit Academy 2024 Capstone Project.

Happy Coding! 🚀

