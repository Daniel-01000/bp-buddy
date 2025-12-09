# BP Buddy Backend

Blood Pressure tracking application backend built with Node.js, Express, and MongoDB.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  server-express.js                                          │
│  "Web framework that speaks with users"                     │
│                                                             │
│  - Receives HTTP requests from frontend                     │
│  - Routes requests to correct handlers                      │
│  - Talks to database.js to get/save data                   │
│  - Sends responses back to users                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Uses/Calls
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  database.js                                                │
│  "Has all the information/methods we need"                  │
│                                                             │
│  - Methods: getUserByEmail(), createReading(), etc.         │
│  - Knows what collections to use                           │
│  - Knows how to structure queries                          │
│  - Handles fallback to local database                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Uses/Connects
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  mongodb.js                                                 │
│  "Helps us connect to the database"                         │
│                                                             │
│  - Creates ONE MongoDB connection                           │
│  - Manages connection pooling                              │
│  - Handles environment variables                           │
│  - Keeps connection alive and shared                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Connects to
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  MongoDB Atlas ☁️                                           │
│  "The actual database in the cloud"                         │
│                                                             │
│  - Stores all data (users, readings, goals)                │
│  - Collections: users, bp_readings, bp_goals               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify JWT token

### Blood Pressure Readings
- `GET /api/readings/:userId` - Get all readings for user
- `POST /api/readings` - Create new reading

### Goals
- `GET /api/goals/:userId` - Get user goals
- `POST /api/goals` - Create new goal

### Users
- `GET /api/users/:userId` - Get user profile
- `POST /api/users` - Create/update user profile

### Health Check
- `GET /api/test` - Test endpoint to verify server is running

## 🗂️ Project Structure

```
bp-buddy-backend/
├── lib/
│   ├── mongodb.js         # MongoDB connection manager
│   ├── database.js        # Database operations & methods
│   └── local-database.js  # Local fallback database
├── server-express.js      # Main Express server & API routes
├── package.json           # Dependencies
└── README.md             # This file
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT authentication
- CORS enabled
- Input validation
- Error handling with try-catch blocks

## 🛠️ Technologies Used

- **Express** - Web framework
- **MongoDB** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication tokens
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 3000) | No |

## 🔄 Connection Pooling

The backend uses connection pooling via `mongodb.js` to:
- Create ONE MongoDB connection on server start
- Reuse that connection for all requests
- Improve performance (21x faster than creating new connections)
- Prevent connection limit errors

## 🎯 Three-Layer Architecture

1. **Presentation Layer** (`server-express.js`)
   - Handles HTTP requests/responses
   - Routes and middleware
   - Authentication logic

2. **Business Logic Layer** (`database.js`)
   - Data operations (CRUD)
   - Query logic
   - Fallback handling

3. **Data Access Layer** (`mongodb.js`)
   - Connection management
   - Connection pooling
   - Environment configuration

## 🚨 Error Handling

The backend includes:
- Try-catch blocks for all async operations
- Automatic fallback to local database if MongoDB fails
- Meaningful error messages
- Proper HTTP status codes

## 📊 Database Collections

- **users** - User accounts and profiles
- **bp_readings** - Blood pressure measurements
- **bp_goals** - User health goals
- **medications** - User medications (future feature)

## 🧪 Testing

Test the server is running:
```bash
curl http://localhost:3000/api/test
```

Expected response:
```json
{
  "message": "BP Buddy Backend is running!",
  "timestamp": "2025-12-07T..."
}
```

## 📄 License

This project is part of a Year 4 university project.






┌─────────────────────────────────────────────────────┐
│  1️⃣ USER REGISTERS                                  │
│     Email: john@test.com                            │
│     Password: secret123                             │
│                                                     │
│     ✅ Server hashes password with bcrypt           │
│     ✅ Stores in database                           │
│     ❌ NO TOKEN YET                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  2️⃣ USER LOGS IN                                    │
│     Email: john@test.com                            │
│     Password: secret123                             │
│                                                     │
│     ✅ Server verifies password with bcrypt         │
│     ✅ Creates JWT token (unique to this user)      │
│     ✅ Token expires in 7 days                      │
│     ✅ Sends token to user                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  3️⃣ USER ACCESSES PROTECTED ROUTES                 │
│     Request: "Show me my readings"                  │
│     Header: Authorization: Bearer eyJhbGci...       │
│                                                     │
│     ✅ Server checks token signature (is it real?)  │
│     ✅ Server checks expiration (still valid?)      │
│     ✅ Server extracts userId from token            │
│     ✅ Returns data for that user                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  4️⃣ USER LOGS OUT                                   │
│     Frontend deletes token from storage             │
│                                                     │
│     ✅ Token removed from device                    │
│     ❌ Can't make authenticated requests anymore    │
│     ℹ️ Server doesn't need to do anything          │
└─────────────────────────────────────────────────────┘


Security 
JWT Authentication 
so basicaly i implemented jwt so when a user logins in the are given their own uniqe token contains the email address and the userid which lasts 7 days. so when a user wants to use the app like ask to show readings the server cheacks the uinque jwt token and gets the data from the databse based of the unique jwt. and when you log out you will need to login in to generate a new jwt but the the session is still valid ontill the 7 days are over

It is set for 7 days because what is a theif steals your phone they will have access to the account. 

Password 
I implemented hashed password. so when a user registered the passwored is hashed using bycryped before it is stored. 

this is inportant so that hackesrs can not access your password. 


Cors
i also implemented cors which basically lets lets my front and back end talk spesifically. This is inportant because it stopes ofther website from accessing my backend and accessing sencitive data

imput validation 
i aslos implemented input validation from user for example making sure a user"s pass word is 6 charachters and above or make ining sure every field is fielled or an error will be shown 



eroro handeling 
this is inpurtant so hackers cant learn about database structure 


enviroment variables 
Secrets never committed to Git/GitHub


Nodejs 
nodejs is a runtime enviroment that lets use run javascript on the backend 


GDPR
"My backend follows GDPR principles for data protection, including:

Data minimization (only collect necessary information)
Secure storage (password hashing, encrypted connections)
User consent (authentication required)
Data access control (JWT tokens)
Right to be forgotten (user data can be deleted)"


what is an API
an api basically is the connection to the server we want to get data from for example the server-express.js is the api ass it s what handdles out https requests and respons. 


┌─────────────────────────────────────────────────────┐
│  1. User wants to see readings                      │
│     Taps "Show My Readings" button                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  2. Frontend sends HTTP request                     │
│     GET /api/readings/user_123                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  3. server-express.js (ROUTER) 📬                   │
│     "I received a request for /api/readings"        │
│     "Let me send it to the readings handler!"       │
│                                                     │
│     Routes to → api/readings.js ✅                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  4. api/readings.js (HANDLER) 🎯                    │
│     "I handle all readings requests!"               │
│     - Validates input                               │
│     - Checks JWT token                              │
│     - Calls database to get data                    │
│                                                     │
│     Calls → db.getReadings(userId) ✅               │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  5. lib/database.js (DATABASE OPERATIONS) 🗄️        │
│     "I talk to MongoDB!"                            │
│     - Executes MongoDB query                        │
│     - Gets readings from database                   │
│     - Returns data to handler                       │
│                                                     │
│     Returns → readings array ✅                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  6. api/readings.js formats response                │
│     { success: true, readings: [...] }              │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  7. Response sent back to frontend                  │
│     Frontend displays readings                      │
└─────────────────────────────────────────────────────┘

run backend npm start 







for styling im usin th ereactative style sheet 

AsyncStorage stores data on device 


"My frontend is built with React Native, which allows me to build a real mobile app using JavaScript that works on both iOS and Android.

Key features:

Components like View, Text, and TextInput instead of HTML
StyleSheet for styling (JavaScript objects, not CSS)
React Navigation for moving between screens
AsyncStorage to store the JWT token locally
useState and useEffect hooks for managing state and side effects
fetch API to communicate with my Express backend
Authentication flow:

User logs in through LoginScreen
Frontend sends credentials to backend API
Backend returns JWT token
Token saved in AsyncStorage
Token included in all subsequent API requests
User can navigate to protected screens (Home, Readings, Profile)
The app makes HTTP requests to my backend API at http://localhost:3000/api, includes the JWT token in the Authorization header, and displays the data returned."



HTTP Request = How frontend talks to backend

Think of it like sending a letter:
┌─────────────────────────────────────┐
│  HTTP REQUEST (The Letter)          │
├─────────────────────────────────────┤
│  From: Frontend (React Native app)  │
│  To: Backend (Express server)       │
│  Method: GET/POST/DELETE             │
│  Address: /api/readings/user_123    │
│  Contents: { email, password }      │
│  Stamp: Authorization: Bearer token │
└─────────────────────────────────────┘



HTTP (Development):
- http://localhost:3000
- NOT encrypted
- OK for testing on your computer
- What you're using now ✅

HTTPS (Production):
- https://yourapp.com
- Encrypted with SSL/TLS
- Required for real apps
- What you'd use when deployed


FETCH API  HTTP REQUEST

1. Fetch API (Tool) makes the HTTP request
   ↓
2. Browser sends request to backend
   ↓
3. CORS (Security) checks if request is allowed
   ↓
4. If allowed → Backend processes request
   ↓
5. Fetch API (Tool) receives the response

Fetch API:
✅ JavaScript tool to make HTTP requests
✅ Sends requests from frontend to backend
✅ Receives responses

CORS:
✅ Security policy on backend
✅ Controls which origins can access API
✅ Prevents unauthorized websites from stealing data

Development (What you're using):
http://localhost:3000
- No encryption
- Only accessible on your computer
- OK for testing

Production (When deployed):
https://yourapp.com
- Encrypted with SSL/TLS
- Accessible on internet
- Required for security

useState:
- Manages component state
- Data that changes
- Causes re-renders

AsyncStorage:
- Persistent storage on device
- Survives app restarts
- For JWT tokens, settings

Example:
const [readings, setReadings] = useState([]);  // ← State
const token = await AsyncStorage.getItem('token');  // ← Storage


## 🌐 Frontend-Backend Communication

### How Frontend and Backend Talk

The frontend communicates with the backend using **HTTP requests** via the **Fetch API**.

```
Frontend → HTTP Request (Fetch API) → Backend
Backend → HTTP Response → Frontend
```

---

### Fetch API (The Communication Tool)

**Fetch API** is a JavaScript function that sends HTTP requests to the backend.

```javascript
// Example: Login request
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',  // HTTP method
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@test.com',
    password: 'secret123'
  })
});

const data = await response.json();  // Parse response
```

**What Fetch API does:**
- ✅ Sends HTTP requests (GET, POST, DELETE)
- ✅ Includes headers (Authorization, Content-Type)
- ✅ Sends data in request body
- ✅ Receives and parses responses

---

### CORS (The Security Guard)

**CORS (Cross-Origin Resource Sharing)** is a security mechanism on the backend that controls which origins can access the API.

```javascript
// Backend - Enable CORS
app.use(cors());  // Allows cross-origin requests
```

**Why CORS?**

```
Without CORS:
❌ Any website can access your API
❌ Malicious sites can steal user data

With CORS:
✅ Only authorized origins can access API
✅ Blocks unauthorized websites
✅ Protects sensitive data
```

**CORS vs Fetch API:**

| Aspect | Fetch API | CORS |
|--------|-----------|------|
| **What it is** | JavaScript tool | Security policy |
| **Location** | Frontend code | Backend middleware |
| **Purpose** | Make HTTP requests | Control access |
| **Analogy** | Phone (makes call) | Security guard (allows call) |

---

### HTTP Requests (Development)

In development, the app uses **HTTP** (not HTTPS):

```
Development: http://localhost:3000
- No encryption
- Local only
- OK for testing

Production: https://yourapp.com
- Encrypted (SSL/TLS)
- Secure
- Required for deployment
```

---

### Complete Communication Flow

```
1. User Action
   ↓
2. Frontend gets JWT token from AsyncStorage
   ↓
3. Fetch API creates HTTP request
   ↓
4. Browser sends request to backend
   ↓
5. CORS middleware checks origin (allowed?)
   ↓
6. Backend processes request
   ↓
7. Backend returns HTTP response
   ↓
8. Fetch API receives response
   ↓
9. Frontend updates state (useState)
   ↓
10. UI re-renders with new data
```

**Example:**

```javascript
// Frontend - Get readings
const loadReadings = async () => {
  // 1. Get token from storage
  const token = await AsyncStorage.getItem('userToken');
  
  // 2. Use Fetch API to make HTTP request
  const response = await fetch('http://localhost:3000/api/readings/user_123', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,  // JWT authentication
      'Content-Type': 'application/json'
    }
  });
  
  // 3. Parse response
  const data = await response.json();
  
  // 4. Update state (causes UI to re-render)
  setReadings(data.readings);
};

// Backend - CORS allows the request
app.use(cors());  // Security guard says "OK, allowed"

// Backend - Handle request
app.get('/api/readings/:userId', async (req, res) => {
  // Verify JWT token
  // Get data from MongoDB
  // Return response
  res.json({ readings: [...] });
});
```

---

### State Management

The frontend uses **useState** to manage data that changes:

```javascript
import React, { useState } from 'react';

function ReadingsScreen() {
  // State: Data that causes UI to update
  const [readings, setReadings] = useState([]);  // Initially empty
  const [loading, setLoading] = useState(false);
  
  // When state changes, component re-renders
  const loadReadings = async () => {
    setLoading(true);  // Show loading spinner
    
    const data = await fetch('...');
    
    setReadings(data.readings);  // Update UI with readings
    setLoading(false);  // Hide loading spinner
  };
  
  return (
    <View>
      {loading ? <Text>Loading...</Text> : <FlatList data={readings} />}
    </View>
  );
}
```

**State vs Storage:**

| Feature | useState (State) | AsyncStorage (Storage) |
|---------|------------------|------------------------|
| **Purpose** | Temporary UI data | Persistent data |
| **Lifetime** | While component exists | Survives app restarts |
| **Examples** | readings, loading, form input | JWT token, settings |
| **Updates UI?** | Yes (re-renders) | No |

---

### Summary

```
┌─────────────────────────────────────────────────────┐
│  Communication Stack                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Fetch API (Tool)                                   │
│  ↓ Makes HTTP requests                              │
│                                                     │
│  CORS (Security)                                    │
│  ↓ Checks if origin is allowed                      │
│                                                     │
│  Backend API (Express)                              │
│  ↓ Processes request                                │
│                                                     │
│  Database (MongoDB)                                 │
│  ↓ Returns data                                     │
│                                                     │
│  Response flows back up                             │
│  ↓                                                  │
│                                                     │
│  useState (State Management)                        │
│  ↓ Updates UI                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```