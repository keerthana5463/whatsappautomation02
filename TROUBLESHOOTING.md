# 🐛 WhatsApp Cloud Bot Troubleshooting Guide

This guide will help you resolve common issues while setting up your WhatsApp automation bridge.

---

## 🚩 Problem: "Single Tick" (Message Sent but Not Delivered)

When you send a message, it has a single grey tick and the bot does not respond. Since we are in **Development Mode**, WhatsApp handles deliveries differently.

### 1. Check Recipient Number (CRITICAL)
Your bot can **ONLY** reply to numbers that you have explicitly added to the allowed phone number list in the Meta Developer Dashboard.
- Go to [Meta Developers Dashboard](https://developers.facebook.com/apps/) -> WhatsApp -> API Setup.
- Scroll down to **"Recipient phone numbers"**.
- Ensure **YOUR phone number** (the one sending "Hi") is in this list.
- If not, **Add it** and verify the OTP code.

### 2. Check Webhook Disabled
If the webhook failed multiple times previously, Meta may have disabled it.
- Go to [Meta Developers Dashboard](https://developers.facebook.com/apps/) -> WhatsApp -> Configuration.
- Locate the "Webhook" section. If there is a red warning icon, click to re-enable or re-verify.

### 3. Check Payment Method
Meta sometimes requires a valid payment method on your Business Account, even if you are using the free tier for development.
- Go to **WhatsApp Manager** -> **Account Settings**.
- Check for any "Payment method missing" alerts.

---

## 🚩 Problem: "403 Forbidden" on Webhook Verification

This means the `VERIFY_TOKEN` sent by Meta does not match the one expected by your server.
- Ensure the `VERIFY_TOKEN` in your `.env` file matches exactly with what you typed into the Meta Configuration field.
- Check if your server was actually running and accessible via Ngrok when you clicked "Verify and Save".

---

## 🚩 Problem: Typebot Connection Errors

- **Error: `TYPEBOT_PUBLIC_ID` is missing**: You must specify the ID of a published bot in your `.env` file.
- **Error: `404 Not Found`**: Either your `TYPEBOT_API_URL` is wrong or your `TYPEBOT_PUBLIC_ID` does not exist on that server.

---

## 🔗 How to use the Test Scripts

We have provided two test scripts to help you isolate connection problems:

1. **Test WhatsApp API**:
   ```bash
   node test-send.js
   ```
   *If successful, you will receive a message on your phone.*

2. **Test Typebot API**:
   ```bash
   node test-typebot.js
   ```
   *If successful, you will see a JSON response from Typebot in the terminal.*
