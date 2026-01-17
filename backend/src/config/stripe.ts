import Stripe from 'stripe';

// Validate Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

if (!STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_WEBHOOK_SECRET is not set for production environment');
}

// Initialize Stripe client with API version
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  typescript: true,
});

// Log Stripe initialization status
if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.log('Stripe client initialized in TEST mode');
} else {
  console.log('Stripe client initialized in PRODUCTION mode');
}

export { stripe, STRIPE_WEBHOOK_SECRET };
