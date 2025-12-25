import express, { Request, Response } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import {
  createUser,
  getUserByEmail,
  getUserByResetToken,
  updateUser,
  emailExists
} from '../models/User.js';
import { createSubscription, getSubscriptionByUserId } from '../models/Subscription.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import Stripe from 'stripe';
import crypto from 'crypto';

const router = express.Router();

// Initialize Stripe (if API key is provided)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
  : null;

// Initialize Google OAuth client
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client()
  : null;

// Validation schemas
const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required')
});
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = registerSchema.parse(req.body);

    // Check password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Check if email already exists
    if (emailExists(data.email)) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = createUser({
      email: data.email,
      password_hash: passwordHash,
      name: data.name
    });

    // Create Stripe customer
    let stripeCustomerId = 'cus_placeholder'; // Fallback if Stripe not configured
    if (stripe) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            user_id: user.id.toString()
          }
        });
        stripeCustomerId = customer.id;
      } catch (error) {
        console.error('Failed to create Stripe customer:', error);
        // Continue anyway - customer can be created later
      }
    }

    // Create free subscription
    const subscription = createSubscription({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      tier: 'free',
      status: 'active'
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      subscription: {
        tier: subscription.tier,
        status: subscription.status
      },
      accessToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = loginSchema.parse(req.body);

    // Get user by email
    const user = getUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const passwordValid = await comparePassword(data.password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Get subscription
    const subscription = getSubscriptionByUserId(user.id);
    if (!subscription) {
      return res.status(500).json({
        error: 'Subscription not found'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        trialEnd: subscription.trial_end
      },
      accessToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/google
 * Authenticate with Google Sign-In
 */
router.post('/google', async (req: Request, res: Response) => {
  console.log('[/api/auth/google] Received request');
  try {
    // Check if Google OAuth is configured
    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      console.error('[/api/auth/google] Google auth is not configured');
      return res.status(503).json({
        error: 'Google authentication is not configured'
      });
    }
    console.log('[/api/auth/google] Google auth is configured');

    // Validate input
    const data = googleAuthSchema.parse(req.body);
    console.log('[/api/auth/google] Input validated', data);

    // Verify the Google ID token
    console.log('[/api/auth/google] Verifying token with Google...');
    const ticket = await googleClient.verifyIdToken({
      idToken: data.credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    console.log('[/api/auth/google] Token verified');

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      console.error('[/api/auth/google] Invalid Google token payload', payload);
      return res.status(401).json({
        error: 'Invalid Google token'
      });
    }
    console.log('[/api/auth/google] Google token payload:', payload);

    const { email, name, email_verified } = payload;

    // Check if user exists
    console.log(`[/api/auth/google] Checking for user with email: ${email}`);
    let user = getUserByEmail(email);
    let subscription;

    if (!user) {
      console.log('[/api/auth/google] User not found, creating new user');
      // Create new user with a random placeholder password hash
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);

      user = createUser({
        email,
        password_hash: passwordHash,
        name: name || undefined
      });
      console.log('[/api/auth/google] New user created:', user);

      // Mark email as verified (Google has already verified it)
      if (email_verified) {
        console.log('[/api/auth/google] Marking email as verified');
        updateUser(user.id, { email_verified: 1 });
      }

      // Create Stripe customer
      let stripeCustomerId = `cus_local_${user.id}_${Date.now()}`;
      if (stripe) {
        console.log('[/api/auth/google] Creating Stripe customer');
        try {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
              user_id: user.id.toString()
            }
          });
          stripeCustomerId = customer.id;
          console.log('[/api/auth/google] Stripe customer created:', stripeCustomerId);
        } catch (error) {
          console.error('[/api/auth/google] Failed to create Stripe customer:', error);
        }
      }

      // Create free subscription
      console.log('[/api/auth/google] Creating free subscription');
      subscription = createSubscription({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        tier: 'free',
        status: 'active'
      });
      console.log('[/api/auth/google] Free subscription created:', subscription);
    } else {
      console.log('[/api/auth/google] Existing user found:', user);
      // Get existing subscription
      subscription = getSubscriptionByUserId(user.id);
      if (!subscription) {
        console.warn(`[/api/auth/google] Subscription not found for user ID: ${user.id}. Assigning default free tier.`);
        // Assign a default free tier subscription if not found
        subscription = {
          id: -1, // Placeholder ID
          user_id: user.id,
          stripe_customer_id: 'N/A', // No Stripe customer for default
          tier: 'free',
          status: 'active',
          current_period_start: Date.now(),
          current_period_end: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000), // 10 years from now
          trial_end: null,
          created_at: Date.now(),
          updated_at: Date.now()
        };
      }
      console.log('[/api/auth/google] Existing subscription found:', subscription);
    }

    // Generate tokens
    console.log('[/api/auth/google] Generating tokens');
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    console.log('[/api/auth/google] Tokens generated');

    // Set refresh token in httpOnly cookie
    console.log('[/api/auth/google] Setting refresh token cookie');
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('[/api/auth/google] Authentication successful, sending response');
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        trialEnd: subscription.trial_end
      },
      accessToken
    });
  } catch (error) {
    console.error('[/api/auth/google] Google auth error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Google authentication failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (clear refresh token cookie)
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token not found'
      });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new access token
    const newAccessToken = generateAccessToken(payload.userId, payload.email);

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Invalid refresh token'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = getUserByEmail(data.email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);
    const resetTokenExpires = Date.now() + 3600000; // 1 hour

    // Save reset token
    updateUser(user.id, {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires
    });

    // TODO: Send email with reset link
    // For now, just log it (in production, use email service)
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process request'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Check password strength
    const passwordValidation = validatePasswordStrength(data.newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Get user by reset token
    const user = getUserByResetToken(data.token);
    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(data.newPassword);

    // Update password and clear reset token
    updateUser(user.id, {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Failed to reset password'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateUser, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      subscription: req.user.subscription
    }
  });
});

export default router;
