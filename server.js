const path = require('path');
const dotenv = require('dotenv');

// Load .env from current directory (optional - Render uses dashboard env vars)
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

console.log('--- ENV LOADING DEBUG ---');
console.log('Environment file path:', envPath);
if (result.error) {
    console.log('ℹ️ No .env file found - using system environment variables (normal on Render/production)');
} else {
    console.log('✅ Dotenv loaded successfully');
    console.log('Parsed keys:', Object.keys(result.parsed || {}));
}

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ============================================
// Configuration
// ============================================

const {
    WHATSAPP_TOKEN,
    PHONE_NUMBER_ID,
    VERIFY_TOKEN,
    TYPEBOT_PUBLIC_ID,
    TYPEBOT_API_URL = 'https://typebot.io',
    PORT = 3000
} = process.env;

console.log('------------------------------------------------');
console.log('DEBUG: Configuration Loaded');
console.log(`WHATSAPP_TOKEN: ${WHATSAPP_TOKEN ? '✅ SET (' + WHATSAPP_TOKEN.substring(0, 10) + '...)' : '❌ MISSING'}`);
console.log(`PHONE_NUMBER_ID: '${PHONE_NUMBER_ID}'`);
console.log(`VERIFY_TOKEN: '${VERIFY_TOKEN}'`);
console.log(`TYPEBOT_PUBLIC_ID: '${TYPEBOT_PUBLIC_ID}'`);
console.log(`TYPEBOT_API_URL: '${TYPEBOT_API_URL}'`);
console.log(`PORT: '${PORT}'`);
console.log('------------------------------------------------');

// Basic validation for critical environment variables
if (!WHATSAPP_TOKEN || WHATSAPP_TOKEN === 'undefined' || WHATSAPP_TOKEN === 'your_permanent_access_token_here') {
    console.error('❌ CRITICAL ERROR: WHATSAPP_TOKEN is not defined or is set to default!');
}

if (!TYPEBOT_PUBLIC_ID || TYPEBOT_PUBLIC_ID === 'undefined' || TYPEBOT_PUBLIC_ID === 'your-typebot-id-here') {
    console.error('❌ CRITICAL ERROR: TYPEBOT_PUBLIC_ID is not defined or is set to default!');
}

if (!PHONE_NUMBER_ID || PHONE_NUMBER_ID === 'undefined' || PHONE_NUMBER_ID === 'your_phone_number_id_here') {
    console.error('❌ CRITICAL ERROR: PHONE_NUMBER_ID is not defined or is set to default!');
}

if (!VERIFY_TOKEN || VERIFY_TOKEN === 'undefined') {
    console.error('❌ CRITICAL ERROR: VERIFY_TOKEN is not defined!');
}

// User sessions mapping: Phone Number -> Typebot Session ID
const sessions = new Map();

// ============================================
// WhatsApp Cloud API Helpers
// ============================================

/**
 * Send request to Meta's WhatsApp Message Endpoint
 * @param {Object} data - Payload for WhatsApp API
 */
async function sendWhatsAppEndpoint(data) {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
    try {
        console.log(`📡 Calling WhatsApp API: ${url}`);
        const result = await axios.post(
            url,
            data,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ WhatsApp API Response:', JSON.stringify(result.data));
    } catch (error) {
        console.error('❌ WhatsApp API Error Status:', error.response?.status);
        console.error('❌ WhatsApp API Error Data:', JSON.stringify(error.response?.data || error.message));
    }
}

async function sendWhatsAppText(to, text) {
    console.log(`📤 Sending Text to ${to}: ${text}`);
    await sendWhatsAppEndpoint({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
    });
}

async function sendWhatsAppImage(to, url) {
    console.log(`📤 Sending Image to ${to}: ${url}`);
    await sendWhatsAppEndpoint({
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: { link: url }
    });
}

async function sendWhatsAppAudio(to, url) {
    console.log(`📤 Sending Audio to ${to}: ${url}`);
    await sendWhatsAppEndpoint({
        messaging_product: 'whatsapp',
        to: to,
        type: 'audio',
        audio: { link: url }
    });
}

async function sendWhatsAppVideo(to, url) {
    console.log(`📤 Sending Video to ${to}: ${url}`);
    await sendWhatsAppEndpoint({
        messaging_product: 'whatsapp',
        to: to,
        type: 'video',
        video: { link: url }
    });
}

// Interactive Buttons (Max 3)
async function sendWhatsAppButtons(to, text, buttons) {
    console.log(`📤 Sending Buttons to ${to}`);
    // Meta allows at most 3 buttons of reply type
    const validButtons = buttons.slice(0, 3).map((btn, index) => ({
        type: 'reply',
        reply: {
            id: `btn_${index}_${btn.replace(/\s+/g, '_')}`, // Unique ID
            title: btn.substring(0, 20) // Max 20 characters for button title
        }
    }));

    await sendWhatsAppEndpoint({
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: text || 'Please select an option:' },
            action: { buttons: validButtons }
        }
    });
}

// Interactive List (Max 10)
async function sendWhatsAppList(to, text, items) {
    console.log(`📤 Sending List to ${to}`);
    const validRows = items.slice(0, 10).map((item, index) => ({
        id: `list_${index}_${item.replace(/\s+/g, '_')}`,
        title: item.substring(0, 24), // Max 24 characters
        description: '' 
    }));

    await sendWhatsAppEndpoint({
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: 'Menu' },
            body: { text: text || 'Please select an option:' },
            footer: { text: 'Choose from the options above' },
            action: {
                button: 'Options',
                sections: [
                    {
                        title: 'Choices',
                        rows: validRows
                    }
                ]
            }
        }
    });
}

// ============================================
// Typebot Integration logic
// ============================================

/**
 * Extracts plain text from the structured bot message (richText or content)
 */
function extractTextFromRichText(richText) {
    if (!richText) return '';
    if (Array.isArray(richText)) {
        return richText.map(block => {
            if (block.children && Array.isArray(block.children)) {
                return block.children.map(child => {
                    if (typeof child === 'string') return child;
                    if (child.text) return child.text;
                    if (child.children) return extractTextFromRichText([child]);
                    return '';
                }).join('');
            }
            if (typeof block === 'string') return block;
            if (block.text) return block.text;
            return '';
        }).join('\n').trim();
    }
    if (typeof richText === 'string') return richText.trim();
    return '';
}

/**
 * Main function to communicate with the Typebot API
 * @param {string} userId - User's unique identifier (phone number)
 * @param {string} userMessage - User's input message
 */
async function processWithTypebot(userId, userMessage) {
    try {
        let response;
        let sessionId = sessions.get(userId);

        // 1. Start or Continue Session
        if (!sessionId) {
            const startUrl = `${TYPEBOT_API_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/startChat`;
            console.log(`✨ Starting new Typebot session at: ${startUrl}`);
            response = await axios.post(startUrl, {
                isStreamEnabled: false,
                prefilledVariables: {
                    "Phone Number": userId
                }
            });
        } else {
            const continueUrl = `${TYPEBOT_API_URL}/api/v1/sessions/${sessionId}/continueChat`;
            console.log(`🔄 Continuing session ${sessionId} at: ${continueUrl}`);
            response = await axios.post(continueUrl, { message: userMessage });
        }

        const data = response.data;
        console.log('🤖 Typebot full response received');

        if (data.sessionId) sessions.set(userId, data.sessionId);

        const messagesToSend = [];

        // 2. Parse out messages from Typebot (Text bubbles, images, videos, etc.)
        if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
                console.log(`  📝 Processing bot message type: ${msg.type}`);
                if (msg.type === 'text') {
                    let text = '';
                    if (msg.content.richText) {
                        text = extractTextFromRichText(msg.content.richText);
                    } else if (msg.content.children) {
                        text = extractTextFromRichText(msg.content.children);
                    } else if (msg.content.plainText) {
                        text = msg.content.plainText;
                    }
                    
                    // Cleanup HTML tags if any remain
                    text = text.replace(/<[^>]*>/g, '').trim();
                    if (text) {
                        messagesToSend.push({ type: 'text', content: text });
                    }
                }
                else if (msg.type === 'image') {
                    messagesToSend.push({ type: 'image', url: msg.content.url });
                }
                else if (msg.type === 'video') {
                    messagesToSend.push({ type: 'video', url: msg.content.url });
                }
                else if (msg.type === 'audio') {
                    messagesToSend.push({ type: 'audio', url: msg.content.url });
                }
            }
        }

        // 3. Process additional choices if requested by the bot
        const input = data.input;
        if (input) {
            console.log(`  🔘 Input type: ${input.type}`);
            if (input.type === 'choice input') {
                const items = input.items.map(item => item.content);
                messagesToSend.push({
                    type: 'choice',
                    items: items,
                    bodyText: "Please select an option:"
                });
            }
        }

        console.log(`  📦 Total messages produced for WhatsApp: ${messagesToSend.length}`);
        return messagesToSend;

    } catch (error) {
        console.error('❌ Typebot API Interaction Error:', error.response?.status);
        console.error('❌ Error details:', JSON.stringify(error.response?.data || error.message));
        return [{ type: 'text', content: 'Apologies, I encountered an internal error. Please try again later.' }];
    }
}

// ============================================
// Webhook Routes
// ============================================

// Verify Webhook (GET requirement from Meta)
app.get('/webhook', (req, res) => {
    console.log('--- Webhook Verification Request Received ---');
    console.log('Query parameters:', JSON.stringify(req.query, null, 2));

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook successfully verified by Meta');
        res.status(200).send(challenge);
    } else {
        console.warn('⚠️ Webhook verification failed!');
        console.warn(`Expected Token: ${VERIFY_TOKEN}`);
        console.warn(`Received Token: ${token}`);
        res.sendStatus(403);
    }
});

// Root route (Health Check)
app.get('/', (req, res) => {
    res.status(200).send('WhatsApp Bot Bridge is active 🚀');
});

// Handle Incoming WhatsApp Messages (POST)
app.post('/webhook', async (req, res) => {
    console.log('--- Incoming POST Request Received ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Ack knowledge immediately to Meta
    res.sendStatus(200);

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') {
            return;
        }

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) return;

        const message = messages[0];
        const from = message.from;

        let userText = '';

        // Extract input text based on what the user sent
        if (message.type === 'text') {
            userText = message.text.body;
        } else if (message.type === 'interactive') {
            const interactive = message.interactive;
            if (interactive.type === 'button_reply') {
                userText = interactive.button_reply.title;
            } else if (interactive.type === 'list_reply') {
                userText = interactive.list_reply.title;
            }
        } else {
            console.log(`📩 Ignoring unsupported message type: ${message.type}`);
            return;
        }

        console.log(`📩 Incoming message from ${from}: "${userText}"`);

        // Get responses from Typebot
        const outboundMessages = await processWithTypebot(from, userText);

        // Deliver all responses to WhatsApp sequentially
        for (const msg of outboundMessages) {
            // Slight delay (500ms) to preserve order in WhatsApp UI
            await new Promise(resolve => setTimeout(resolve, 500));

            switch (msg.type) {
                case 'text':
                    await sendWhatsAppText(from, msg.content);
                    break;
                case 'image':
                    await sendWhatsAppImage(from, msg.url);
                    break;
                case 'video':
                    await sendWhatsAppVideo(from, msg.url);
                    break;
                case 'audio':
                    await sendWhatsAppAudio(from, msg.url);
                    break;
                case 'choice':
                    const items = msg.items || [];
                    if (items.length > 0) {
                        if (items.length <= 3) {
                            await sendWhatsAppButtons(from, msg.bodyText, items);
                        } else {
                            await sendWhatsAppList(from, msg.bodyText, items);
                        }
                    }
                    break;
            }
        }

    } catch (error) {
        console.error('❌ Error in Webhook processing:', error);
    }
});

// ============================================
// Server Execution
// ============================================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 WhatsApp Bot Server running on port ${PORT}`);
    console.log(`🔗 Typebot ID: ${TYPEBOT_PUBLIC_ID}`);
    console.log('='.repeat(50));
});
