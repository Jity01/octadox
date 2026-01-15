/**
 * Octadox Stripe Payment Server
 *
 * This server handles Stripe Checkout sessions for pre-order payments.
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Add your Stripe secret key to .env
 * 3. Create a product and price in Stripe Dashboard
 * 4. Update the STRIPE_PRICE_ID in .env
 * 5. Run: npm install && npm start
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('../')); // Serve frontend files

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Create Stripe Checkout Session
 *
 * This endpoint creates a new checkout session for the pre-order.
 * The frontend redirects users to this session to complete payment.
 */
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { successUrl, cancelUrl, customerEmail } = req.body;

        // Validate required environment variables
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Stripe secret key not configured');
        }

        if (!process.env.STRIPE_PRICE_ID) {
            throw new Error('Stripe price ID not configured');
        }

        // Create checkout session options
        const sessionOptions = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl || `${process.env.FRONTEND_URL}?payment=success`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}?payment=cancelled`,
            // Collect billing address
            billing_address_collection: 'required',
            // Add custom fields for law firm info
            custom_fields: [
                {
                    key: 'firm_name',
                    label: {
                        type: 'custom',
                        custom: 'Law Firm Name',
                    },
                    type: 'text',
                },
                {
                    key: 'phone',
                    label: {
                        type: 'custom',
                        custom: 'Phone Number',
                    },
                    type: 'text',
                },
            ],
            // Metadata for tracking
            metadata: {
                product: 'octadox_preorder',
                price_per_client: '100',
            },
            // Allow promo codes if you set them up in Stripe
            allow_promotion_codes: true,
        };

        // Add customer email if provided
        if (customerEmail) {
            sessionOptions.customer_email = customerEmail;
        }

        // Create the session
        const session = await stripe.checkout.sessions.create(sessionOptions);

        // Return session ID to frontend
        res.json({
            id: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Error creating checkout session:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to create checkout session'
        });
    }
});

/**
 * Stripe Webhook Handler
 *
 * This endpoint receives events from Stripe when payment status changes.
 * Use this to:
 * - Send confirmation emails
 * - Create customer records
 * - Trigger onboarding workflows
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify webhook signature
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // For testing without signature verification
            event = JSON.parse(req.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;

            console.log('Payment successful!');
            console.log('Customer email:', session.customer_details?.email);
            console.log('Amount paid:', session.amount_total / 100);

            // Get custom fields
            const customFields = session.custom_fields || [];
            const firmName = customFields.find(f => f.key === 'firm_name')?.text?.value;
            const phone = customFields.find(f => f.key === 'phone')?.text?.value;

            console.log('Firm name:', firmName);
            console.log('Phone:', phone);

            // TODO: Add your business logic here
            // - Send confirmation email
            // - Add to CRM
            // - Schedule onboarding call
            // - etc.

            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            console.log('Payment failed:', paymentIntent.last_payment_error?.message);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success
    res.json({ received: true });
});

/**
 * Get product info
 * Returns the product details for display on the frontend
 */
app.get('/api/product', async (req, res) => {
    try {
        if (!process.env.STRIPE_PRICE_ID) {
            return res.json({
                name: 'Octadox Pre-Order',
                description: 'Per-client document automation service',
                price: 10000, // $100.00 in cents
                currency: 'usd'
            });
        }

        const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID, {
            expand: ['product']
        });

        res.json({
            name: price.product.name,
            description: price.product.description,
            price: price.unit_amount,
            currency: price.currency
        });
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).json({ error: 'Failed to fetch product info' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║           Octadox Payment Server                  ║
╠═══════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}         ║
║                                                   ║
║  Endpoints:                                       ║
║  • GET  /api/health              - Health check   ║
║  • POST /api/create-checkout-session - Checkout   ║
║  • POST /api/webhook             - Stripe webhook ║
║  • GET  /api/product             - Product info   ║
╚═══════════════════════════════════════════════════╝

${process.env.STRIPE_SECRET_KEY ? '✓ Stripe configured' : '✗ Missing STRIPE_SECRET_KEY'}
${process.env.STRIPE_PRICE_ID ? '✓ Price ID configured' : '✗ Missing STRIPE_PRICE_ID'}
${process.env.STRIPE_WEBHOOK_SECRET ? '✓ Webhook secret configured' : '○ Webhook secret not set (optional for local dev)'}
    `);
});
