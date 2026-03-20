# WhatsApp Cloud Bot & Typebot Integration 🤖

A professional WhatsApp automation system connecting **Meta's WhatsApp Business Cloud API** with **Typebot.io**.

## 🚀 Overview

This project provides a bridge between WhatsApp and Typebot, allowing you to:
- ✅ **Automate Conversations**: Use Typebot's drag-and-drop builder to design your bot logic.
- ✅ **Official Integration**: Uses the official Meta WhatsApp Cloud API (no QR codes/phone dependencies).
- ✅ **Real-time Interaction**: Messages are processed instantly via webhooks.
- ✅ **Rich Media Support**: Supports text, images, videos, and interactive elements (buttons/lists).

## 🛠️ Architecture

1.  **WhatsApp Cloud API**: Receives messages from your customers.
2.  **Node.js Server (`server.js`)**: The "Bridge". It receives webhooks from WhatsApp, processes them, sends them to Typebot, and forwards the bot's response back to WhatsApp.
3.  **Typebot.io**: The brain of your bot. It manages the conversation flow and logic.
4.  **Ngrok / Deployment**: Exposes your local server to the internet so Meta can send webhook events.

---

## 📦 Prerequisites

*   **Node.js** (v18 or higher)
*   **Meta Developer Account**: To access the WhatsApp Business Cloud API.
*   **Typebot Account**: Either [Typebot.io Cloud](https://typebot.io) or a self-hosted instance.
*   **Ngrok**: For local testing (exposing your localhost to the internet).

---

## ⚡ Quick Start

### 1. Initialize the Project
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Update the `.env` file with your credentials:
- `WHATSAPP_TOKEN`: Your Meta Permanent Access Token.
- `PHONE_NUMBER_ID`: Found in your Meta Developer App settings.
- `VERIFY_TOKEN`: A secret string of your choice to verify webhooks.
- `TYPEBOT_PUBLIC_ID`: The ID of your Typebot (e.g., `my-chatbot-123`).

### 3. Start the Server
```bash
npm start
```
By default, the server runs on `http://localhost:3000`.

### 4. Set up the Webhook
1.  Start Ngrok: `ngrok http 3000`.
2.  Copy the `https://xxxx.ngrok-free.app` URL.
3.  Go to **Meta Developers > WhatsApp > Configuration**.
4.  Set **Callback URL** to `https://YOUR-NGROK-URL/webhook`.
5.  Set **Verify Token** to match your `.env`.
6.  **Subscribe** to the `messages` webhook field.

---

## 🧪 Testing
1.  Send a message (e.g., "Hi") to your registered WhatsApp Business number.
2.  Verify the logs in your Node.js console.
3.  The bot should respond based on your Typebot flow.

---

## 📂 Project Structure

| File | Description |
| :--- | :--- |
| `server.js` | Core Bridge logic (Webhooks & API calls) |
| `.env.example` | Template for required configuration |
| `package.json` | Project dependencies and scripts |

---
*Created by Antigravity AI - ML Engineer Edition*
