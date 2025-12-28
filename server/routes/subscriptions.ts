import express, { Request, Response } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { getSubscriptionByUserId, updateSubscription } from '../models/Subscription.js';
import Stripe from 'stripe';

const router = express.Router();

// Initialize Stripe (if API key is provided)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
  : null;

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_placeholder';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * POST /api/subscriptions/checkout
 * Create a Stripe checkout session for upgrading to Pro
 */
router.post('/checkout', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!stripe) {
      return res.status(503).json({
        error: 'Payment processing is not configured',
        message: 'Stripe is not set up. Please configure STRIPE_SECRET_KEY and STRIPE_PRICE_ID environment variables.'
      });
    }

    // Get user's subscription
    const subscription = getSubscriptionByUserId(req.user.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if already on Pro plan
    if (subscription.tier === 'pro' && subscription.status === 'active') {
      return res.status(400).json({
        error: 'Already subscribed',
        message: 'You already have an active Pro subscription'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripe_customer_id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/upgrade?canceled=true`,
      metadata: {
        user_id: req.user.id.toString(),
      },
      subscription_data: {
        metadata: {
          user_id: req.user.id.toString(),
        },
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/webhook
 * Handle Stripe webhook events
 * Note: Raw body parsing is handled at the server level for this route
 */
router.post('/webhook', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (userId && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

          // Get subscription from Stripe to get full details
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Update subscription in database
          const subscription = getSubscriptionByUserId(parseInt(userId));
          if (subscription) {
            updateSubscription(subscription.id, {
              stripe_subscription_id: subscriptionId,
              tier: 'pro',
              status: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' ? stripeSubscription.status : 'active',
              current_period_start: stripeSubscription.current_period_start * 1000,
              current_period_end: stripeSubscription.current_period_end * 1000,
              trial_start: stripeSubscription.trial_start ? stripeSubscription.trial_start * 1000 : null,
              trial_end: stripeSubscription.trial_end ? stripeSubscription.trial_end * 1000 : null,
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const userId = stripeSubscription.metadata?.user_id;

        if (userId) {
          const subscription = getSubscriptionByUserId(parseInt(userId));
          if (subscription) {
            if (event.type === 'customer.subscription.deleted') {
              // Downgrade to free tier
              updateSubscription(subscription.id, {
                tier: 'free',
                status: 'canceled',
                stripe_subscription_id: null,
              });
            } else {
              // Update subscription status
              updateSubscription(subscription.id, {
                tier: 'pro',
                status: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' ? stripeSubscription.status : 'active',
                current_period_start: stripeSubscription.current_period_start * 1000,
                current_period_end: stripeSubscription.current_period_end * 1000,
                cancel_at_period_end: stripeSubscription.cancel_at_period_end ? 1 : 0,
              });
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * GET /api/subscriptions/status
 * Get current subscription status
 */
router.get('/status', authenticateUser, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = getSubscriptionByUserId(req.user.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      success: true,
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end,
        cancel_at_period_end: subscription.cancel_at_period_end === 1,
      },
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    res.status(500).json({
      error: 'Failed to get subscription status',
      message: error.message,
    });
  }
});

export default router;

