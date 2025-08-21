# App Store Integration Configuration Guide

## Environment Variables Setup

### Frontend Environment Variables (`.env.local`)
```bash
# RevenueCat public API key (safe for frontend)
VITE_REVENUECAT_API_KEY=your_revenuecat_public_key_here
```

### Supabase Secrets (Server-side only)
```bash
# App Store Connect API credentials (PRIVATE - never expose to frontend)
APPSTORE_PRIVATE_KEY=your_appstore_private_key_here
APPSTORE_KEY_ID=your_appstore_key_id_here
APPSTORE_ISSUER_ID=your_appstore_issuer_id_here
```

## Setting Up Supabase Secrets

Run these commands to set the sensitive keys in Supabase:

```bash
# Set the secrets in Supabase (these are server-side only)
supabase secrets set APPSTORE_PRIVATE_KEY="your_private_key_here" --project-ref YOUR_PROJECT_REF
supabase secrets set APPSTORE_KEY_ID="your_key_id_here" --project-ref YOUR_PROJECT_REF
supabase secrets set APPSTORE_ISSUER_ID="your_issuer_id_here" --project-ref YOUR_PROJECT_REF
```

## Why This Separation?

- **`VITE_REVENUECAT_API_KEY`**: Public key used in React app to initialize RevenueCat
- **App Store keys**: Private credentials used only in Supabase edge functions for server-side operations like receipt verification and webhook handling

## 📱 RevenueCat Setup

### 1. Create RevenueCat Account
- Go to [RevenueCat](https://www.revenuecat.com/)
- Sign up for an account
- Create a new project

### 2. Configure iOS App
- Add your iOS app to RevenueCat
- Get your API key from the project settings
- Set up your App Store Connect products

### 3. Configure Products
In RevenueCat, create these products:
- `premium_monthly` - Premium Monthly Subscription
- `premium_yearly` - Premium Yearly Subscription  
- `pro_monthly` - Pro Monthly Subscription
- `pro_yearly` - Pro Yearly Subscription

## 🍎 App Store Connect Setup

### 1. Generate API Key
- Go to [App Store Connect](https://appstoreconnect.apple.com/)
- Navigate to Users and Access > Keys
- Click the "+" button to generate a new key
- Download the `.p8` file
- Note the Key ID and Issuer ID

### 2. Configure App Store Connect
- Go to your app in App Store Connect
- Navigate to Features > In-App Purchases
- Create the same products as in RevenueCat
- Set up subscription groups and pricing

### 3. Get Shared Secret
- Go to App Store Connect > My Apps
- Select your app
- Go to App Information > App-Specific Shared Secret
- Generate a new shared secret

## 🔧 Supabase Configuration

### 1. Environment Variables
Add these to your Supabase project environment:

```bash
APPSTORE_PRIVATE_KEY=your_appstore_private_key_here
APPSTORE_KEY_ID=your_appstore_key_id_here
APPSTORE_ISSUER_ID=your_appstore_issuer_id_here
APPSTORE_SHARED_SECRET=your_appstore_shared_secret_here
APPSTORE_ENVIRONMENT=sandbox
```

### 2. Deploy Edge Functions
Deploy the new edge functions:

```bash
supabase functions deploy appstore-store-transaction
supabase functions deploy appstore-webhook
supabase functions deploy appstore-verify-receipt
```

### 3. Run Database Migration
Apply the database migration:

```bash
supabase db push
```

## 🌐 Webhook Configuration

### 1. App Store Connect Webhook
- Go to App Store Connect > My Apps > Your App
- Navigate to App Information > App Store Server Notifications
- Add your webhook URL: `https://ynvnzmkpifwteyuxondc.supabase.co/functions/v1/appstore-webhook`

### 2. Test Webhook
- Send a test notification from App Store Connect
- Check your Supabase logs for webhook processing

## 📱 iOS Configuration

### 1. Capacitor Sync
After configuration, sync your iOS project:

```bash
npx cap sync ios
```

### 2. Xcode Configuration
- Open `ios/App/App.xcworkspace` in Xcode
- Ensure RevenueCat framework is linked
- Configure your bundle identifier
- Set up App Store Connect capabilities

## 🧪 Testing

### 1. Sandbox Testing
- Use App Store Connect sandbox environment
- Create sandbox test accounts
- Test in-app purchases in iOS Simulator

### 2. Production Testing
- Switch to production environment
- Test with real App Store accounts
- Verify webhook processing

## 🔄 Migration from Stripe

### 1. Keep Existing Pages
All your existing payment pages remain unchanged. The backend logic is replaced while maintaining the same user experience.

### 2. Update Hooks
Replace Stripe hooks with App Store hooks:
- `useStripePayment` → `useAppStorePayment`
- Update subscription management logic

### 3. Test Thoroughly
- Test all payment flows
- Verify subscription status updates
- Check webhook processing

## 🚨 Important Notes

### Security
- Never commit private keys to version control
- Use environment variables for all sensitive data
- Implement proper JWT verification for webhooks

### Compliance
- Follow App Store Review Guidelines
- Implement proper receipt validation
- Handle subscription status changes correctly

### Support
- App Store subscriptions can only be cancelled through App Store settings
- Implement proper error handling for failed purchases
- Provide clear user guidance for subscription management

## 📚 Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
- [Capacitor Documentation](https://capacitorjs.com/docs)

## ✅ Verification Checklist

- [ ] RevenueCat API key configured
- [ ] App Store Connect API keys set up
- [ ] Shared secret configured
- [ ] Environment variables set
- [ ] Edge functions deployed
- [ ] Database migration applied
- [ ] Webhook URL configured
- [ ] iOS project synced
- [ ] Test purchases working
- [ ] Webhook processing verified
- [ ] Subscription status updates working
- [ ] Error handling tested

Your ZapArounds project is now configured for App Store Connect integration! 🎉
