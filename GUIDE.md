Are you an iOS developer looking for a simple way to monitor your app's in-app purchases and subscriptions? In this guide, I'll show you how to set up a notification system that sends real-time App Store purchase events directly to your Discord, Slack and Telegram channels. Perfect for indie developers and small teams!

> 🚀 **Get Started Quickly**: Check out the [GitHub repository](https://github.com/kdrmlhcn/ios-iap-events-notification) for ready-to-deploy code and detailed setup instructions.

The repository includes:
- Serverless function code for both Google Cloud Functions and Cloudflare Workers
- Configuration templates for Discord, Telegram, and Slack
- Example notification payloads and testing scripts
- Comprehensive documentation and troubleshooting guides

## Table of Contents 📑

1. [What We'll Build 🛠️](#what-well-build-id)
2. [Setting Up Your Notification Channel 📢](#setting-up-notification-channel-id)
   - [Discord Setup](#for-discord)
   - [Telegram Setup](#for-telegram)
3. [Setting Up and Deploying to Google Cloud Function ☁️](#setting-up-cloud-function-id)
4. [Setting Up and Deploying to Cloudflare Workers ⚡️](#setting-up-cloudflare-id)
5. [Connecting to App Store Connect 🔗](#connecting-to-app-store-id)
   - [Using Adapty](#using-adapty)
   - [Using RevenueCat](#using-revenuecat)
   - [Direct Setup](#direct-app-store-connect-setup)
6. [What You'll Get 📱](#what-youll-get-id)
   - [Example Notifications](#example-notifications-by-platform)
7. [Advanced Features 🔧](#advanced-features-id)
   - [Customizing Notifications](#customizing-notifications)
   - [Error Handling](#error-handling)
   - [Timezone Support](#timezone-support)
8. [Troubleshooting 🔍](#troubleshooting-id)
9. [Platform Comparison 🤔](#platform-comparison-id)
10. [Cost Considerations 💰](#cost-considerations-id)
    - [Free Tier Comparison](#google-cloud-functions-free-tier)
    - [Cost Examples](#cost-estimation-examples)
    - [Optimization Tips](#cost-optimization-tips)
11. [Security Best Practices 🔒](#security-best-practices-id)
12. [Technical Details and Examples 🔧](#technical-details-id)
       - [Example App Store Notification](#example-app-store-notification)
       - [Understanding the Notification Fields](#understanding-the-notification-fields)
       - [Processing Best Practices](#processing-best-practices)
13. [Testing with cURL Examples 🧪](#testing-with-curl-id)
14. [What's Next 🚀](#whats-next-id)
15. [Need Help 🤝](#need-help-id)

<a id="what-well-build-id"></a>
## What We'll Build 🛠️
We'll create a serverless function that:
1. Receives App Store Server-to-Server notifications
2. Processes the purchase events
3. Sends beautifully formatted notifications to your preferred platform

<a id="setting-up-notification-channel-id"></a>
## Setting Up Your Notification Channel 📢
### For Discord:
**1. Open your Discord server**

_Launch Discord and open the server where you want to create the webhook._

**2. Create a new Channel**

_If you don't have a channel already, create one by clicking on the "+" sign next to your server’s channel list._

![create a new channel](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/eyoyurpenua34ai9l4yn.png)

**3. Access Channel Settings**

_Hover over the channel you want to create a webhook for. Click the gear icon (⚙️) to open Channel Settings._

![channel settings](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ymnc1qfzc64c4i4h5lk4.png)

**4. Go to Integrations**

_In the left sidebar, scroll down and click on Integrations. Under the "Integrations" section, click on Create Webhook._

![Integrations](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vk1lkfl1lffmlthxkmzx.png)

**5. Configure Your Webhook**

_Name your webhook and customize its settings if needed. Afterward, click Copy Webhook URL to save the URL for later use._

![Copy webhook url](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gv1z521y1cth160nxw45.png)

### For Telegram:
**1. Message [@BotFather](https://t.me/botfather) on Telegram**

_Open Telegram and search for @BotFather. This is the official bot used to create and manage bots on Telegram._

**2. Create a new bot with `/newbot`**

_Start a chat with @BotFather and type /newbot to begin the process of creating a new bot._

![create a new bot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ysamrxpxd04swwx4b519.png)

**3. Copy your bot token**

_After creating your bot, you’ll receive a token. Copy the token by clicking on the red highlighted area in the message from BotFather._

![Telegram Bot Token](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ytcmugql0tixfqyh944a.png)

**4. Create a channel and add your bot as an admin**

_If you don’t already have a Telegram channel, create one by going to the Telegram app and selecting New Channel. Once the channel is created, add your bot as an admin so it can send and receive messages._

![New Channel](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hjo69c5z0z1t20v5nqr7.png)

![Channel Info](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gopcva7ztomddkgdr2s5.png)

![Channel Administrators](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vtwd7f9wpq5jxetkgma9.png)

![Add Admin](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zhnuo77g1vtdshqzyt54.png)

![Add your bot as admin](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/klblwkkkqh2i3lcnl0sv.png)

**5. Get your channel ID**

_Send a message to your channel first. Then forward that message to
[@userinfobot](https://t.me/userinfobot)_

![Channel Message](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dursyddp9ufccvth82z1.png)

_Write userinfobot in search, select the bot and forward the message._

![Forward message to userinfobot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1go5a2jka0ok54etluhp.png)

_Check message that UserInfoBot's sent you. (Eg. Your chat id: "-1002328487593")_

![Get Chat ID](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a8rihoainvkizwg7xtra.png)

<a id="setting-up-cloud-function-id"></a>
## Setting Up and Deploying to Google Cloud Function ☁️
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a [new project](https://console.cloud.google.com/projectcreate) or select an existing one
3. Go to [Cloud Run Functions](https://console.cloud.google.com/functions/list)
4. Click "Create Function"

![Create Function](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/boi1s5zp7sao4ne4mtuv.png)

If you did not enable required APIs previously, you will see this modal. You should click Enable button. After enabled APIs, you will be redirected the creating new function page.

![Enable APIs](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mo1h2vwdnn0dre4v3ggy.png)

Enter a name (1), choose HTTPS (2), select Allow unauthenticated invocations (3)
![Fill function page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ph4qduamt6yf6k76go3y.png)

5. After you created function you will see the Code Editor
6. You will have 2 files: `index.js` and `package.json`
7. Copy the following code into `package.json`:
```javascript
{
  "name": "iap-notifications",
  "version": "1.0.0",
  "description": "App Store server-to-server (S2S) notifications handler for in-app purchases",
  "main": "index.js",
  "dependencies": {
    "@google-cloud/functions-framework": "^3.4.4",
    "axios": "^1.7.9",
    "base64url": "^3.0.1",
    "country-iso-3-to-2": "^1.1.1",
    "date-fns-tz": "^3.2.0",
    "jsonwebtoken": "^9.0.2"
  },
  "scripts": {
    "start": "functions-framework --target=main --port=8080",
    "deploy:gcf": "gcloud functions deploy iap-notifications --gen2 --runtime=nodejs20 --region=us-central1 --memory=256MB --timeout=60s --min-instances=0 --max-instances=10 --trigger-http --allow-unauthenticated",
    "deploy:cf": "wrangler deploy"
  },
  "keywords": [
    "app-store",
    "server-to-server",
    "notifications",
    "telegram-bot",
    "discord-webhook",
    "slack-webhook"
  ],
  "author": "Kadir Melih Can",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

![Package.json code](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f6czcss4hv0tqiv1j2bl.png)

8. Copy the [source code](https://github.com/kdrmlhcn/ios-iap-events-notification/blob/master/google_cloud/index.js) into `index.js` and configure your notification settings:
```javascript
const CONFIG = {
  general: {
    allowSandboxNotifications: true,
    timezone: "Europe/Istanbul",
    dateFormat: "dd.MM.yyyy HH:mm:ss"
  },
  telegram: {
    enabled: true,
    botToken: "YOUR_BOT_TOKEN",
    chatId: "YOUR_CHAT_ID"
  },
  discord: {
    enabled: true,
    webhookUrl: "YOUR_DISCORD_WEBHOOK_URL"
  },
  slack: {
    enabled: true,
    webhookUrl: "YOUR_SLACK_WEBHOOK_URL",
    channel: "#app-store-notifications"
  }
};
```

Do not forget to change Entry point field's value as main as in screenshot.
![Index.js code](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1u9joeu751euxba9gstb.png)

9. Click "Deploy" and wait for the deployment to complete
10. Copy your function's URL from the "Trigger" tab

![Trigger URL](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/o24sjvrd0jf648z47sam.png)

<a id="setting-up-cloudflare-id"></a>
## Setting Up and Deploying to Cloudflare Workers ⚡️
**1.** Create a Cloudflare Account:
   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Sign up for a free account if you don't have one
   - Verify your email address

**2.** Create a New Worker:
   - Click on "Workers & Pages" in the left sidebar
![Workers & Pages](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/26n3rwv0cz7u6k0wgoqz.png)
   - Click "Create" button
![Create Application](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/usv73omu6q16zx4zt61x.png)
   - Select "Create Worker"
![Create Worker](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kbp0h8qvugpkxq1faon0.png)
   - Choose a name for your worker and deploy (e.g., "iap-notifications")
![First deploy](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/geaepllnljnvduyfgu6t.png)
   - After deployed successfully click the "Edit Code" button
![Edit Code](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2efcf70ceoks2b5pqlmo.png)
   - Paste code in [`worker.js`](https://github.com/kdrmlhcn/ios-iap-events-notification/blob/master/cloudflare/worker.js) file into the code editor.
![Deployed](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mjh2ln7qtyns8dqsj39n.png)

**3.** Save and Deploy:
   - Click "Save and deploy"
   - Wait for deployment to complete
   - Copy your worker's URL (format: `https://iap-notifications.your-username.workers.dev`)

<a id="connecting-to-app-store-id"></a>
## Connecting to App Store Connect 🔗
### Using Adapty:
1. Log in to [Adapty](https://app.adapty.io)
2. Navigate to App settings > Apps in the Adapty dashboard
3. Click to the iOS SDK section, scroll to **App Store server notifications**
4. Enter your the _Cloud Function or CloudFlare Worker's URL_ to URL for forwarding raw Apple events
5. Click Save in the bottom left corner.

![Adapty](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fkdpxq1bw8rbq2iq4cbt.png)

### Using RevenueCat:
1. Log in to [RevenueCat](https://app.revenuecat.com/overview)
2. Navigate to your iOS app under Project settings > Apps in the RevenueCat dashboard
3. Scroll to the **Apple Server to Server** notification settings section, and enter your the _Cloud Function or CloudFlare Worker URL_  in **Apple Server Notification Forwarding URL**
4. Click Save Changes in the top right corner.
![RevenueCat URL](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/id0f7fiyvn0l26lwkb56.png)

### Direct App Store Connect Setup:
_If you are using an internal solution, your own backend url is probably added here. Therefore, you can prepare an endpoint for your own backend and give it to the Google Cloud function or CloudFlare worker we prepared as the raw event arrives._

1. Open [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to App Information
4. Scroll to "App Store Server Notifications"
5. Enter your Cloud Function or CloudFlare URL
6. Save changes

<a id="what-youll-get-id"></a>
## What You'll Get 📱
Once set up, you'll receive beautifully formatted notifications for events like:
- New purchases
- Subscription renewals
- Refunds
- Consumption requests
- Billing issues

### Example Notifications by Platform

#### Telegram Notification

![Telegram Notification Example 1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qo64039l0w0byn9isnn4.jpg)

![Telegram Notification Example 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uvefhelpkujerlyqw4b0.PNG)

```
MyApp.bundle.id
🔔 DID_RENEW $99.99 💵

📊 Event: AUTO_RENEW_ENABLED
🏷 Product: premium_yearly
🌍 Country: 🇺🇸 USA
💰 Price: 99.99 USD

ℹ️ Additional Info:
• Environment: Production
• ID: 2000000000000000
• Type: Auto-Renewable Subscription
• Expires Date: 15.03.2025 14:30:00
```

#### Discord Notification

![Discord Notification 1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ifu48ssnwgw2az32d62a.jpg)

![Discord Notification 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rc5qqpfwws2gjt40vgrp.PNG)

Discord notifications use rich embeds with:
- Color-coded status
- App Store icon thumbnail
- Clickable app link
- Organized fields for event details
- Footer with transaction details

<a id="advanced-features-id"></a>
## Advanced Features 🔧
### Customizing Notifications
You can customize the notification format by modifying the respective service classes in `index.js`:
- `TelegramNotification` for Telegram
- `DiscordNotification` for Discord
- `SlackNotification` for Slack

### Error Handling
The system includes:
- Automatic retries for failed API calls
- Rate limiting protection
- Sandbox environment filtering
- Detailed error logging

### Timezone Support
Configure your preferred timezone in the CONFIG object:
```javascript
general: {
  timezone: "Your/Timezone",
  dateFormat: "dd.MM.yyyy HH:mm:ss"
}
```

#### Common Timezone Examples:
```javascript
// United States
timezone: "America/New_York"     // Eastern Time
timezone: "America/Chicago"      // Central Time
timezone: "America/Denver"       // Mountain Time
timezone: "America/Los_Angeles"  // Pacific Time

// Europe
timezone: "Europe/London"        // British Time
timezone: "Europe/Paris"         // Central European Time
timezone: "Europe/Istanbul"      // Turkish Time

// Asia
timezone: "Asia/Dubai"          // Gulf Time
timezone: "Asia/Singapore"      // Singapore Time
timezone: "Asia/Tokyo"          // Japan Time

// Australia
timezone: "Australia/Sydney"    // Australian Eastern Time
```

#### Date Format Examples:
```javascript
// Common Formats
dateFormat: "dd.MM.yyyy HH:mm:ss"    // 31.12.2024 14:30:00
dateFormat: "MM/dd/yyyy hh:mm:ss a"  // 12/31/2024 02:30:00 PM
dateFormat: "yyyy-MM-dd HH:mm:ss"    // 2024-12-31 14:30:00
dateFormat: "dd MMM yyyy HH:mm"      // 31 Dec 2024 14:30

// Format Tokens
// dd    - Day of month (01-31)
// MM    - Month (01-12)
// yyyy  - Full year
// HH    - Hours in 24h format (00-23)
// hh    - Hours in 12h format (01-12)
// mm    - Minutes (00-59)
// ss    - Seconds (00-59)
// a     - AM/PM marker
```

<a id="troubleshooting-id"></a>
## Troubleshooting 🔍
1. **No notifications received:**
   - Check if your webhook URLs are correct
   - Verify your Cloud Function is deployed and accessible
   - Ensure the correct URL is set in App Store Connect

2. **Webhook errors:**
   - Verify your bot/webhook permissions
   - Check if the channel/chat IDs are correct
   - Ensure your notification service is enabled in CONFIG

3. **Invalid timestamps:**
   - Update the timezone in CONFIG to match your location
   - Verify the dateFormat string is correct

<a id="platform-comparison-id"></a>
## Comparison of Google Cloud Functions vs Cloudflare Workers: Free vs Paid Tiers 🤔

![Platform comparison](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kzhsjwyl4yfts5jj9h5w.png)

### Which One Should You Choose?

**Choose Google Cloud Functions if you:**
- Need more free tier requests
- Want deeper integration with other Google services
- Require more computing resources
- Need detailed logging and monitoring

**Choose Cloudflare Workers if you:**
- Want global edge deployment
- Need better cold start performance
- Prefer simpler deployment process
- Want built-in DDoS protection

Both platforms are excellent choices for this project. For most indie developers, either option will work great as both offer generous free tiers and reliable performance.

<a id="cost-considerations-id"></a>
## Cost Considerations 💰

### Google Cloud Functions Free Tier
- 2 million invocations per month
- 400,000 GB-seconds of compute time
- 200,000 GHz-seconds of compute time
- 5GB network egress per month
- No credit card required to start

**Paid Tier (if you exceed free tier):**
- $0.40 per million invocations
- $0.0000025 per GB-second
- $0.0000100 per GHz-second

### Cloudflare Workers Free Tier
- 100,000 requests per day (~3 million/month)
- Unlimited scripts/workers
- 128MB memory limit per worker
- 10ms CPU time per request
- Workers KV: 100,000 reads per day
- Global edge deployment included

**Paid Tier (Workers Paid Plan):**
- $5/month for 10 million requests
- Increased CPU limits (50ms)
- 1GB memory limit per worker
- Workers KV: 1 million reads per day

### Cost Estimation Examples

![Cost Estimation Examples](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p6ov4cqx2xm437gay273.png)

**For a typical indie app (5,000 monthly active users):**
- Average 1-2 events per user per month
- Total: ~10,000 events/month
- Easily covered by both platforms' free tiers

**For a growing app (50,000 monthly active users):**
- Average 1-2 events per user per month
- Total: ~100,000 events/month
- Google Cloud Functions: Still within free tier
- Cloudflare Workers: May need paid plan depending on daily distribution

**For a large app (500,000 monthly active users):**
- Average 1-2 events per user per month
- Total: ~1,000,000 events/month
- Google Cloud Functions: 
  - Still within free tier
  - Minimal cost if exceeded (~$0.40)
- Cloudflare Workers:
  - Paid plan recommended ($5/month)
  - Better global performance

### Cost Optimization Tips

1. **Monitor Usage**
   - Set up billing alerts
   - Track daily/monthly usage
   - Monitor error rates

2. **Reduce Costs**
   - Filter unnecessary notifications
   - Batch events when possible
   - Optimize code execution time

3. **Choose the Right Plan**
   - Start with free tier
   - Upgrade only when needed
   - Consider your app's growth rate

Both platforms offer excellent value for money, especially for indie developers and small teams. The free tiers are typically sufficient for apps with up to 100,000 monthly active users, making them perfect for getting started and scaling up.

<a id="security-best-practices-id"></a>
## Security Best Practices 🔒
1. Keep your webhook URLs private
2. Enable Cloud Function authentication if needed
3. Regularly rotate webhook URLs
4. Monitor function logs for unusual activity
5. Set up billing alerts in Google Cloud

<a id="technical-details-id"></a>
## Technical Details and Examples 🔧
### Example App Store Notification

Here's an example of the raw JSON data you'll receive from Apple (with randomized sensitive information):

```json
{
  "data": {
    "appAppleId": 9876543210,
    "bundleId": "com.example.myapp",
    "bundleVersion": "4",
    "environment": "Production",
    "renewalInfo": {
      "autoRenewProductId": "myapp_premium_annual",
      "autoRenewStatus": 1,
      "currency": "USD",
      "environment": "Production",
      "originalTransactionId": "200001234567890",
      "productId": "myapp_premium_annual",
      "recentSubscriptionStartDate": 1729488392000,
      "renewalDate": 1761283592000,
      "renewalPrice": 99990,
      "signedDate": 1735414243588
    },
    "transactionInfo": {
      "bundleId": "com.example.myapp",
      "currency": "USD",
      "environment": "Production",
      "expiresDate": 1761283592000,
      "inAppOwnershipType": "PURCHASED",
      "originalTransactionId": "200001234567890",
      "price": 99990,
      "productId": "myapp_premium_annual",
      "purchaseDate": 1729747592000,
      "storefront": "USA",
      "storefrontId": "143441",
      "transactionId": "200009876543210",
      "type": "Auto-Renewable Subscription"
    }
  },
  "notificationType": "DID_CHANGE_RENEWAL_STATUS",
  "subtype": "AUTO_RENEW_ENABLED",
  "version": "2.0"
}
```

### Understanding the Notification Fields

Key fields in the notification:

1. **Top Level**
   - `notificationType`: The main event type (e.g., DID_CHANGE_RENEWAL_STATUS)
   - `subtype`: Specific event subtype (e.g., AUTO_RENEW_ENABLED)
   - `version`: API version (currently 2.0)

2. **Renewal Info**
   - `autoRenewProductId`: Product identifier for the subscription
   - `autoRenewStatus`: Current auto-renewal status (1 = enabled, 0 = disabled)
   - `renewalDate`: Next renewal date in milliseconds
   - `renewalPrice`: Price in minor units (e.g., 99990 = $99.99)

3. **Transaction Info**
   - `inAppOwnershipType`: Purchase type (PURCHASED, FAMILY_SHARED, etc.)
   - `originalTransactionId`: Original purchase identifier
   - `transactionId`: Current transaction identifier
   - `purchaseDate`: Purchase timestamp in milliseconds
   - `expiresDate`: Subscription expiration timestamp

### Processing Best Practices

1. **Validation**
   - Always verify the notification's signature
   - Check environment (Production vs. Sandbox)
   - Validate bundle ID matches your app

2. **Error Handling**
   - Implement exponential backoff for retries
   - Log failed notification processing
   - Set up alerts for repeated failures

3. **Data Storage**
   - Store raw notifications for debugging
   - Index by transactionId and originalTransactionId
   - Keep audit logs of processed notifications

### cURL Examples App Store Notification

Here's an example of the raw JSON data you'll receive from Apple (with randomized sensitive information):

```json
{
  "signedPayload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFwcEFwcGxlSWQiOjEyMzQ1Njc4OTAsImJ1bmRsZUlkIjoiY29tLmx1bmFyLmZpdG5lc3Nwcm8iLCJidW5kbGVWZXJzaW9uIjoiMS4wIiwiZW52aXJvbm1lbnQiOiJQcm9kdWN0aW9uIiwidHJhbnNhY3Rpb25JbmZvIjp7ImJ1bmRsZUlkIjoiY29tLmx1bmFyLmZpdG5lc3Nwcm8iLCJjdXJyZW5jeSI6IktSVyIsImVudmlyb25tZW50IjoiUHJvZHVjdGlvbiIsImV4cGlyZXNEYXRlIjoxNzk5OTk5OTk5MDAwLCJpbkFwcE93bmVyc2hpcFR5cGUiOiJQVVJDSEFTRUQiLCJvcmlnaW5hbFRyYW5zYWN0aW9uSWQiOiI0ODAwMDIwNTc0ODk0ODMiLCJwcmljZSI6MjkwMDAsInByb2R1Y3RJZCI6ImZpdG5lc3Nwcm9fcHJlbWl1bV95ZWFybHkiLCJwdXJjaGFzZURhdGUiOjE3MDM4MDY1MjAwMDAsInN0b3JlZnJvbnQiOiJLT1IiLCJ0eXBlIjoiQXV0by1SZW5ld2FibGUgU3Vic2NyaXB0aW9uIn19LCJub3RpZmljYXRpb25UeXBlIjoiRElEX0NIQU5HRV9SRU5FV0FMX1BSRUYiLCJzdWJ0eXBlIjoiVVBHUkFERSIsInZlcnNpb24iOiIyLjAifQ.secret"
}
```

<a id="testing-with-curl-id"></a>
### Testing with CURL Examples 🧪

Here are some example CURL commands to test your notification system with different scenarios. Replace `YOUR_FUNCTION_URL` with your actual Cloud Function or Cloudflare Worker URL.

#### 1. Subscription Renewal (Korean Market)
```bash
curl -X POST "YOUR_FUNCTION_URL" \
-H "Content-Type: application/json" \
-d '{
  "signedPayload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFwcEFwcGxlSWQiOjEyMzQ1Njc4OTAsImJ1bmRsZUlkIjoiY29tLmx1bmFyLmZpdG5lc3Nwcm8iLCJidW5kbGVWZXJzaW9uIjoiMS4wIiwiZW52aXJvbm1lbnQiOiJQcm9kdWN0aW9uIiwidHJhbnNhY3Rpb25JbmZvIjp7ImJ1bmRsZUlkIjoiY29tLmx1bmFyLmZpdG5lc3Nwcm8iLCJjdXJyZW5jeSI6IktSVyIsImVudmlyb25tZW50IjoiUHJvZHVjdGlvbiIsImV4cGlyZXNEYXRlIjoxNzk5OTk5OTk5MDAwLCJpbkFwcE93bmVyc2hpcFR5cGUiOiJQVVJDSEFTRUQiLCJvcmlnaW5hbFRyYW5zYWN0aW9uSWQiOiI0ODAwMDIwNTc0ODk0ODMiLCJwcmljZSI6MjkwMDAsInByb2R1Y3RJZCI6ImZpdG5lc3Nwcm9fcHJlbWl1bV95ZWFybHkiLCJwdXJjaGFzZURhdGUiOjE3MDM4MDY1MjAwMDAsInN0b3JlZnJvbnQiOiJLT1IiLCJ0eXBlIjoiQXV0by1SZW5ld2FibGUgU3Vic2NyaXB0aW9uIn19LCJub3RpZmljYXRpb25UeXBlIjoiRElEX0NIQU5HRV9SRU5FV0FMX1BSRUYiLCJzdWJ0eXBlIjoiVVBHUkFERSIsInZlcnNpb24iOiIyLjAifQ.secret"
}'
```

#### 2. Subscription Refund (German Market)
```bash
curl -X POST "YOUR_FUNCTION_URL" \
-H "Content-Type: application/json" \
-d '{
  "signedPayload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFwcEFwcGxlSWQiOjEyMzQ1Njc4OTAsImJ1bmRsZUlkIjoiY29tLnplbml0aC5tZWRpdGF0ZSIsImJ1bmRsZVZlcnNpb24iOiIxLjAiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJ0cmFuc2FjdGlvbkluZm8iOnsiYnVuZGxlSWQiOiJjb20uemVuaXRoLm1lZGl0YXRlIiwiY3VycmVuY3kiOiJFVVIiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJleHBpcmVzRGF0ZSI6MTc5OTk5OTk5OTAwMCwiaW5BcHBPd25lcnNoaXBUeXBlIjoiUFVSQ0hBU0VEIiwib3JpZ2luYWxUcmFuc2FjdGlvbklkIjoiMzcwMDAxODU4MzM3NzcxIiwicHJpY2UiOjE0OTksInByb2R1Y3RJZCI6Im1lZGl0YXRlX3VubGltaXRlZF95ZWFybHkiLCJwdXJjaGFzZURhdGUiOjE3MDM4MjI2NTkwMDAsInN0b3JlZnJvbnQiOiJERVUiLCJ0eXBlIjoiQXV0by1SZW5ld2FibGUgU3Vic2NyaXB0aW9uIn19LCJub3RpZmljYXRpb25UeXBlIjoiUkVGVU5EIiwic3VidHlwZSI6bnVsbCwidmVyc2lvbiI6IjIuMCJ9.secret"
}'
```

#### 3. Subscription Renewal (Brazilian Market)
```bash
curl -X POST "YOUR_FUNCTION_URL" \
-H "Content-Type: application/json" \
-d '{
  "signedPayload": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFwcEFwcGxlSWQiOjEyMzQ1Njc4OTAsImJ1bmRsZUlkIjoiY29tLnNreXdhdmUucGhvdG9tYWdpYyIsImJ1bmRsZVZlcnNpb24iOiIxLjAiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJ0cmFuc2FjdGlvbkluZm8iOnsiYnVuZGxlSWQiOiJjb20uc2t5d2F2ZS5waG90b21hZ2ljIiwiY3VycmVuY3kiOiJCUkwiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJleHBpcmVzRGF0ZSI6MTc5OTk5OTk5OTAwMCwiaW5BcHBPd25lcnNoaXBUeXBlIjoiUFVSQ0hBU0VEIiwib3JpZ2luYWxUcmFuc2FjdGlvbklkIjoiNDEwMDAyMjYzNTMxNjA2IiwicHJpY2UiOjY5OTAsInByb2R1Y3RJZCI6InBob3RvbWFnaWNfcHJvX2FubnVhbF90aWVyMSIsInB1cmNoYXNlRGF0ZSI6MTcwMzg3MjYwOTAwMCwic3RvcmVmcm9udCI6IkJSQSIsInR5cGUiOiJBdXRvLVJlbmV3YWJsZSBTdWJzY3JpcHRpb24ifX0sIm5vdGlmaWNhdGlvblR5cGUiOiJESURfUkVORVciLCJzdWJ0eXBlIjpudWxsLCJ2ZXJzaW9uIjoiMi4wIn0.secret"
}'
```

These examples demonstrate different notification types (renewal, refund, upgrade) across various markets with different currencies. The payloads are base64-encoded JWTs that will be decoded by the notification handler. You can use these to test your notification system's handling of:

1. **Different Currencies & Regions**
   - Korean Won (KRW)
   - Euro (EUR)
   - Brazilian Real (BRL)

2. **Various Notification Types**
   - DID_CHANGE_RENEWAL_PREF with UPGRADE subtype
   - REFUND
   - DID_RENEW

3. **Price Formats**
   - Whole numbers (29 KRW)
   - Decimal prices (6.99 BRL)
   - Four-digit prices (14.99 EUR)

To use these examples:
1. Replace `YOUR_FUNCTION_URL` with your actual endpoint URL
2. Run the CURL command in your terminal
3. Check your configured notification channels (Discord/Telegram/Slack) for the formatted notification

<a id="whats-next-id"></a>
## What's Next 🚀
Now that you have real-time purchase notifications set up, you can:
- Monitor your app's revenue in real-time
- Quickly respond to refund requests
- Track subscription patterns
- Identify potential issues early
- Make data-driven decisions for your app

Remember to star the repository if you found it helpful! ⭐️

<a id="need-help-id"></a>
## Need Help 🤝
- Create an issue on [GitHub](https://github.com/kdrmlhcn/ios-iap-events-notification/issues)
- Write me on [Telegram](https://t.me/kdrmlhcn)

## Acknowledgments 🙏

Special thanks to [Ramazan Arslan](https://github.com/ramazanarslan) for his initial implementation that inspired this project. I started by using his published version and then further developed it to make it simpler and more accessible for everyone to implement their own App Store server notifications handler.

This project is built with these amazing open-source packages:
- [@google-cloud/functions-framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs) - For serverless function development
- [Axios](https://github.com/axios/axios) - For HTTP requests
- [base64url](https://github.com/brianloveswords/base64url) - For URL-safe base64 encoding
- [country-iso-3-to-2](https://github.com/vtex/country-iso-3-to-2) - For country code conversion
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - For JWT handling
- [date-fns-tz](https://github.com/marnusw/date-fns-tz) - For timezone-aware date formatting

Happy coding! 🎉
