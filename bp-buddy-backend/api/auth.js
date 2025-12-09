// Authentication API endpoints for BP Buddy
// Handles user registration, login, logout, and token verification

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BPDatabase } from '../lib/database.js';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Initialize database
const db = new BPDatabase();

// Helper function to generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Main handler function
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    // Route requests based on pathname
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      return await handleRegister(req, res);
    }
    
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      return await handleLogin(req, res);
    }
    
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      return await handleLogout(req, res);
    }
    
    if (pathname === '/api/auth/verify' && req.method === 'GET') {
      return await handleVerifyToken(req, res);
    }
    
    if (pathname === '/api/auth/profile' && req.method === 'PUT') {
      return await handleUpdateProfile(req, res);
    }

    // Route not found
    return res.status(404).json({
      success: false,
      error: 'Authentication endpoint not found'
    });

  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Register new user
async function handleRegister(req, res) {
  try {
    const { email, password, name, profile } = req.body;

    // Validation
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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = await db.createUser({
      userId,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      profile: profile || {},
      createdAt: new Date(),
      lastLogin: new Date()
    });

    // Generate token
    const token = generateToken(userId, email);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}

// Login user
async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
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
    const token = generateToken(user.userId, user.email);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.lastLogin = new Date();

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

// Logout user
async function handleLogout(req, res) {
  try {
    // In a more advanced implementation, you might want to:
    // - Add token to blacklist
    // - Update user's last activity
    // - Log the logout event

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}

// Verify token
async function handleVerifyToken(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Optionally verify user still exists
    const user = await db.getUserByUserId(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: decoded.userId,
        email: decoded.email
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
}

// Update user profile
async function handleUpdateProfile(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile data is required'
      });
    }

    // Update user profile
    const updatedUser = await db.updateUserProfile(decoded.userId, profile);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return updated user data (without password)
    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Profile update failed'
    });
  }
}
