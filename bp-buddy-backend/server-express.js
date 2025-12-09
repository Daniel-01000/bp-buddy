import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { BPDatabase } from './lib/database.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // lets the front and backend speak 
app.use(express.json()); // helps the server uderstand what is being sent by the frontend. whithout it the server seees rubbish 

// Initialize database
const db = new BPDatabase(); // this just creates the connection to the database and lets us do things like db.createUser() db.getReadings() db.deleteGoal(). 
console.log('🔗 Database initialized (will connect on first request)');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'BP Buddy Backend is running!', timestamp: new Date() });
});

// Authentication routes - handle directly in Express
import bcrypt from 'bcryptjs'; // Takes passwords and scrambles them beyond recognition
import jwt from 'jsonwebtoken'; //Creates temporary ID cards (tokens) for logged-in users Like a hotel room key that expires after checkout

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'; // Change this to a strong secret in production
const JWT_EXPIRES_IN = '7d'; // After 7 days → Token expires → User must login again

// 400 = Bad Request (user did something wrong)
// 401 = Unauthorized (not logged in)
// 500 = Server Error (we messed up)
// 200 = OK (everything good!)
// 201 = Created (new thing made!)

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, profile } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // Input: "mypassword123" bcrypt.hash() processes for ~0.1 seconds... Output: "$2a$10$XrTu...R0hVe" (scrambled forever!) 

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // generate a simple unique user ID Date.now()  
// Current time in milliseconds: 1733529600000

//Math.random()
// Random number: 0.123456789

//.toString(36)
// Convert to base-36 (0-9, a-z): "4fzyo82"

//.substr(2, 9)
// Take 9 characters starting at position 2: "zyo82mvxq"

//Final result: "user_1733529600000_zyo82mvxq"

    const newUser = await db.createUser({
      userId,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      profile: profile || {},
      createdAt: new Date(),
      lastLogin: new Date()
    });

    // Generate Auth token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser; // so password is not sent to the frontend

    res.status(201).json({
      success: true,
      data: { user: userWithoutPassword, token }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await db.getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await db.updateUserLastLogin(user.userId);

    // Generate token
    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.lastLogin = new Date();

    res.status(200).json({
      success: true,
      data: { user: userWithoutPassword, token }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token endpoint
app.get('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists
    const user = await db.getUserByUserId(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { userId: decoded.userId, email: decoded.email }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Get all readings for a user
app.get('/api/readings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const readings = await db.getReadings(userId);
    res.json({ success: true, data: readings });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new reading
app.post('/api/readings', async (req, res) => {
  try {
    const { userId, reading } = req.body;
    const newReading = await db.createReading(userId, reading);
    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    console.error('Error creating reading:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await db.getUserProfile(userId);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user profile
app.post('/api/users', async (req, res) => {
  try {
    const { userId, profile } = req.body;
    const newUser = await db.createUserProfile(userId, profile);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user goals
app.get('/api/goals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const goals = await db.getGoals(userId);
    res.json({ success: true, data: goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update goal
app.post('/api/goals', async (req, res) => {
  try {
    const { userId, goal } = req.body;
    const newGoal = await db.createGoal(userId, goal);
    res.status(201).json({ success: true, data: newGoal });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 BP Buddy Backend is running on port ${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});
