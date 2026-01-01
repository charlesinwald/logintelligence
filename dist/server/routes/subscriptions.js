import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
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
router.post('/checkout', authenticateUser, async (req, res) => {
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
        let subscription = getSubscriptionByUserId(req.user.id);
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
        // Check if we need to create a real Stripe customer (if using placeholder)
        let stripeCustomerId = subscription.stripe_customer_id;
        if (stripeCustomerId.startsWith('cus_local_')) {
            // Create a real Stripe customer
            const customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.name || undefined,
                metadata: {
                    user_id: req.user.id.toString()
                }
            });
            stripeCustomerId = customer.id;
            // Update subscription with real customer ID
            subscription = updateSubscription(subscription.id, {
                stripe_customer_id: stripeCustomerId
            });
        }
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
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
    }
    catch (error) {
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
router.post('/webhook', async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
    }
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
        return res.status(400).json({ error: 'Missing webhook signature or secret' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    try {
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
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
                            trial_start: stripeSubscription.trial_start ? stripeSubscription.trial_start * 1000 : null,
                            trial_end: stripeSubscription.trial_end ? stripeSubscription.trial_end * 1000 : null,
                        });
                    }
                }
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const stripeSubscription = event.data.object;
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
                        }
                        else {
                            // Update subscription status
                            updateSubscription(subscription.id, {
                                tier: 'pro',
                                status: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' ? stripeSubscription.status : 'active',
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
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});
/**
 * POST /api/subscriptions/verify-session
 * Verify checkout session and update subscription if needed
 */
router.post('/verify-session', authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!stripe) {
            return res.status(503).json({ error: 'Stripe not configured' });
        }
        const { session_id } = req.body;
        if (!session_id) {
            return res.status(400).json({ error: 'session_id is required' });
        }
        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        // Verify this session belongs to the authenticated user
        if (session.metadata?.user_id !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Session does not belong to this user' });
        }
        // Check if payment was successful
        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                error: 'Payment not completed',
                payment_status: session.payment_status
            });
        }
        // Get the subscription from the session
        if (session.subscription) {
            const subscriptionId = typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id;
            // Get full subscription details from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
            // Update our database subscription
            const subscription = getSubscriptionByUserId(req.user.id);
            if (subscription) {
                updateSubscription(subscription.id, {
                    stripe_subscription_id: subscriptionId,
                    tier: 'pro',
                    status: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' ? stripeSubscription.status : 'active',
                    trial_start: stripeSubscription.trial_start ? stripeSubscription.trial_start * 1000 : null,
                    trial_end: stripeSubscription.trial_end ? stripeSubscription.trial_end * 1000 : null,
                });
                // Return updated subscription
                const updatedSubscription = getSubscriptionByUserId(req.user.id);
                return res.json({
                    success: true,
                    subscription: {
                        tier: updatedSubscription.tier,
                        status: updatedSubscription.status,
                        trial_end: updatedSubscription.trial_end,
                    }
                });
            }
        }
        res.status(500).json({ error: 'Failed to update subscription' });
    }
    catch (error) {
        console.error('Session verification error:', error);
        res.status(500).json({
            error: 'Failed to verify session',
            message: error.message
        });
    }
});
/**
 * POST /api/subscriptions/sync
 * Manually sync subscription from Stripe
 */
router.post('/sync', authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!stripe) {
            return res.status(503).json({ error: 'Stripe not configured' });
        }
        const subscription = getSubscriptionByUserId(req.user.id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        // Get all subscriptions for this customer from Stripe (any status)
        const stripeSubscriptions = await stripe.subscriptions.list({
            customer: subscription.stripe_customer_id,
            limit: 1
        });
        if (stripeSubscriptions.data.length > 0) {
            const stripeSubscription = stripeSubscriptions.data[0];
            console.log(`[Sync] Found Stripe subscription: ${stripeSubscription.id}, status: ${stripeSubscription.status}`);
            // Update our database
            updateSubscription(subscription.id, {
                stripe_subscription_id: stripeSubscription.id,
                tier: 'pro',
                status: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' ? stripeSubscription.status : 'active',
                trial_start: stripeSubscription.trial_start ? stripeSubscription.trial_start * 1000 : null,
                trial_end: stripeSubscription.trial_end ? stripeSubscription.trial_end * 1000 : null,
            });
            console.log(`[Sync] Updated subscription ${subscription.id} to Pro tier`);
            const updatedSubscription = getSubscriptionByUserId(req.user.id);
            return res.json({
                success: true,
                message: 'Subscription synced successfully',
                subscription: {
                    tier: updatedSubscription.tier,
                    status: updatedSubscription.status,
                }
            });
        }
        else {
            return res.json({
                success: false,
                message: 'No active subscription found in Stripe',
                subscription: {
                    tier: subscription.tier,
                    status: subscription.status,
                }
            });
        }
    }
    catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            error: 'Failed to sync subscription',
            message: error.message
        });
    }
});
/**
 * GET /api/subscriptions/status
 * Get current subscription status
 */
router.get('/status', authenticateUser, (req, res) => {
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
    }
    catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({
            error: 'Failed to get subscription status',
            message: error.message,
        });
    }
});
export default router;
//# sourceMappingURL=subscriptions.js.map