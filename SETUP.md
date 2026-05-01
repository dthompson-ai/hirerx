# HireRx — Setup Guide

## What you need before you can run this

Four services. All have free tiers to start.

---

## 1. Supabase (database + auth)

1. Go to supabase.com → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Also copy your **service_role key** (same page — keep this secret)
4. Go to the SQL editor → paste the entire contents of `supabase-schema.sql` → Run
5. Fill in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=` your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` your anon key
   - `SUPABASE_SERVICE_ROLE_KEY=` your service role key

---

## 2. Stripe (payments)

1. Go to stripe.com → Create account
2. Go to Products → Create a product called "HireRx" → Add a price: $20/month recurring
3. Copy the **Price ID** (starts with `price_`)
4. Go to Developers → API keys → copy **Publishable key** and **Secret key**
5. Go to Developers → Webhooks → Add endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - Copy the **Signing secret**
6. For the billing portal link in settings, go to Stripe → Settings → Billing → Customer portal → Enable it → copy the link and replace the placeholder in `src/app/dashboard/settings/page.tsx`
7. Fill in `.env.local`:
   - `STRIPE_SECRET_KEY=` your secret key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` your publishable key
   - `STRIPE_WEBHOOK_SECRET=` your signing secret
   - `STRIPE_PRICE_ID=` your price ID

---

## 3. Anthropic (Claude API)

1. Go to console.anthropic.com → API Keys → Create key
2. Fill in `.env.local`:
   - `ANTHROPIC_API_KEY=` your key

---

## 4. Deploy to Vercel

1. Go to vercel.com → New project → Import from GitHub (push this folder to a GitHub repo first)
2. Add all your `.env.local` values as Environment Variables in Vercel
3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL (e.g. `https://hirerx.vercel.app`)
4. Update the Stripe webhook URL to your Vercel URL
5. Deploy

---

## Granting free access (for social proof prospects)

Run this from your terminal — replace the values:

```bash
curl -X POST https://your-domain.com/api/admin/grant-access \
  -H "Authorization: Bearer your_ADMIN_SECRET_value" \
  -H "Content-Type: application/json" \
  -d '{"email": "prospect@theiragency.com"}'
```

The prospect must have created an account first (without paying). This flips their status to "gifted" and gives them full access.

---

## Running locally

```bash
cd /Users/dannythompson/Projects/hirerx
npm run dev
```

Open http://localhost:3000

For Stripe webhooks locally, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
