# Octadox Landing Page

A pre-order landing page for Octadox - automated client document collection for family lawyers.

## Quick Start

### Option 1: Static Preview (No Payments)
Simply open `index.html` in your browser to preview the landing page. The checkout button will show a demo modal.

### Option 2: Full Setup with Stripe Payments

#### 1. Get Stripe API Keys
1. Create a Stripe account at https://stripe.com
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your **Publishable key** and **Secret key**

#### 2. Create a Product in Stripe
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Set the name: "Octadox Pre-Order - Per Client"
4. Set the price: $100 (one-time)
5. Save and copy the **Price ID** (starts with `price_`)

#### 3. Configure the Server
```bash
cd server
cp .env.example .env
```

Edit `.env` with your keys:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_PRICE_ID=price_YOUR_PRICE_ID
FRONTEND_URL=http://localhost:3000
```

#### 4. Configure the Frontend
Edit `app.js` and update:
```javascript
const CONFIG = {
    stripePublishableKey: 'pk_test_YOUR_KEY',
    backendUrl: 'http://localhost:3000/api',
    // ...
};
```

#### 5. Run the Server
```bash
cd server
npm install
npm start
```

Visit http://localhost:3000 to see the page with working payments.

## Project Structure

```
landing_page_octadox/
├── index.html          # Main landing page
├── styles.css          # All styles (blue/white theme)
├── app.js             # Frontend JavaScript & Stripe integration
├── README.md          # This file
└── server/
    ├── server.js      # Express server with Stripe API
    ├── package.json   # Server dependencies
    └── .env.example   # Environment variables template
```

## Features

- **Responsive Design**: Works on all device sizes
- **Blue & White Theme**: Professional, trust-building color scheme
- **Stripe Integration**: Secure payment processing
- **Compliance Messaging**: HIPAA, GLBA, FERPA, PII status display
- **Document Categories**: Clear breakdown of supported documents
- **FAQ Section**: Addresses common concerns
- **Success Modal**: Shows contact info after payment

## Deployment

### Frontend (Static Hosting)
Deploy to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Backend (Node.js Hosting)
Deploy the server folder to:
- Heroku
- Railway
- Render
- AWS Lambda + API Gateway
- DigitalOcean App Platform

Remember to:
1. Set environment variables on your hosting platform
2. Update `FRONTEND_URL` to your production domain
3. Update `CONFIG.backendUrl` in `app.js`
4. Set up Stripe webhooks for production

## Stripe Webhook Setup (Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret to your `.env`

## Customization

### Contact Information
Update in `app.js`:
```javascript
contactEmail: 'your-email@example.com',
contactPhone: '(555) 123-4567'
```

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --color-primary: #1E3A5F;      /* Navy blue */
    --color-secondary: #3B82F6;    /* Accent blue */
    /* ... */
}
```

### Compliance Timeline
Update the timeline text in `index.html` compliance section.

## Support

For questions about Octadox, contact us after your pre-order purchase.
