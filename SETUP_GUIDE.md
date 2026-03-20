# 🚀 WhatsApp Cloud API Setup Guide

Complete this setup to connect your automation system to WhatsApp.

---

## Step 1: Create Meta Business Account (If you don't have one)

1. Go to: **https://business.facebook.com/**
2. Click **Create Account**
3. Enter your business name and complete the simple form.

---

## Step 2: Create a Facebook App for WhatsApp

1. Go to: **https://developers.facebook.com/apps/**
2. Click **Create App**
3. Select **"Other"** → **Next**
4. Select **"Business"** → **Next**
5. Enter an app name (e.g., "My WhatsApp Automation")
6. Select your Business Account and click **Create App**.

---

## Step 3: Add WhatsApp to your App

1. In your app dashboard, find **"Add products to your app"**.
2. Find **WhatsApp** and click **Set up**.

---

## Step 4: Get Your Credentials (Test Mode)

Go to **WhatsApp → API Setup**. You will need:

| Credential | Description |
| :--- | :--- |
| **Phone Number ID** | The unique ID of the virtual phone number in Meta. |
| **Temporary Access Token** | A token valid for 24 hours. |

> ⚠️ **Note**: Use the temporary token for testing. For production, you will need a **Permanent Access Token** (Step 7).

---

## Step 5: Add Your Own Number for Testing

1. In the **API Setup** page, find the **"To"** field.
2. Click **Manage phone number list**.
3. Add your personal WhatsApp number (include country code).
4. Verify your number with the OTP received on WhatsApp.

---

## Step 6: Configure your Webhook

1. Start your local server (`npm start`).
2. Expose it via Ngrok: `ngrok http 3000`.
3. Go to **WhatsApp → Configuration** in the Meta dashboard.
4. Click **Edit** on the Webhook section:
    - **Callback URL**: `https://YOUR-NGROK-URL/webhook`
    - **Verify Token**: Must match `VERIFY_TOKEN` in your `.env`.
5. Click **Verify and Save**.
6. **Subscribe** to the `messages` webhook field in the table below.

---

## Step 7: Get a Permanent Access Token (Recommended)

1. Go to **Business Settings** → **System Users**.
2. Click **Add** to create a new system user (set role to **Admin**).
3. Click **Generate New Token**.
4. Select your WhatsApp App.
5. Check the following permissions:
    - `whatsapp_business_messaging`
    - `whatsapp_business_management`
6. Copy the generated token and save it to `WHATSAPP_TOKEN` in `.env`.

---

## Step 8: Configure Typebot

1. Log in to [Typebot.io](https://typebot.io).
2. Create or select a bot.
3. Get the **Public ID** from the bot's URL (e.g., `https://typebot.io/my-bot-123`).
4. Update `TYPEBOT_PUBLIC_ID` in your `.env`.

---

Send a message to your WhatsApp test number, and see the magic happen! 🚀
