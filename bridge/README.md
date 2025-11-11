# Bridge Server Code

**⚠️ IMPORTANT:** This bridge server cannot run inside Lovable. You must run it separately on your local machine or server.

## Quick Start

1. Create a new folder for the bridge server (outside this project)
2. Copy the code below into the appropriate files
3. Run `npm install` then `npm start`

---

## File Structure

```
bridge-server/
├── package.json
├── index.js
├── utils/
│   ├── payloadParser.js
│   └── webhookConstructor.js
```

---

## package.json

```json
{
  "name": "whatsapp-bridge-server",
  "version": "1.0.0",
  "description": "Bridge server that translates WhatsApp API payloads",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "body-parser": "^1.20.2"
  }
}
```

---

## index.js

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { parseWhatsAppPayload } = require('./utils/payloadParser');
const { constructWebhookPayload } = require('./utils/webhookConstructor');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// CONFIGURATION: Change this to your bot's webhook URL
const YOUR_BOT_WEBHOOK_URL = 'http://localhost:8000/webhook';

app.use(cors());
app.use(bodyParser.json());

// Endpoint: Receive full WhatsApp payload from bot, translate, and send to UI
app.post('/send-to-emulator', (req, res) => {
  try {
    const fullPayload = req.body;
    console.log('📥 Received WhatsApp payload from bot:', JSON.stringify(fullPayload, null, 2));

    // Parse the full WhatsApp payload into Simple UI Contract
    const simpleMessage = parseWhatsAppPayload(fullPayload);
    console.log('✨ Translated to Simple UI Contract:', JSON.stringify(simpleMessage, null, 2));

    // Emit to all connected UI clients
    io.emit('ui_message', simpleMessage);
    console.log('📤 Sent to UI clients');

    res.status(200).json({ status: 'ok', message: 'Message sent to emulator' });
  } catch (error) {
    console.error('❌ Error processing payload:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Socket.io: Listen for replies from UI, translate, and POST to bot
io.on('connection', (socket) => {
  console.log('✅ UI client connected:', socket.id);

  socket.on('ui_reply', async (simpleReply) => {
    try {
      console.log('📥 Received reply from UI:', JSON.stringify(simpleReply, null, 2));

      // Construct full WhatsApp webhook payload
      const fullWebhookPayload = constructWebhookPayload(simpleReply);
      console.log('✨ Constructed webhook payload:', JSON.stringify(fullWebhookPayload, null, 2));

      // Send to bot's webhook
      const response = await axios.post(YOUR_BOT_WEBHOOK_URL, fullWebhookPayload);
      console.log('📤 Sent to bot webhook. Response:', response.status);
    } catch (error) {
      console.error('❌ Error sending to bot:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ UI client disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 WhatsApp Bridge Server Running       ║
║                                            ║
║   Port: ${PORT}                              ║
║   Bot sends to: POST /send-to-emulator     ║
║   Bot receives at: ${YOUR_BOT_WEBHOOK_URL.padEnd(24)} ║
╚════════════════════════════════════════════╝
  `);
});
```

---

## utils/payloadParser.js

```javascript
/**
 * Parses full WhatsApp "Send Message" payloads into Simple UI Contract
 */
function parseWhatsAppPayload(payload) {
  const type = payload.type;

  // Generate a mock WAMID for context tracking
  const id = `wamid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        payload: {
          body: payload.text?.body || '',
        },
      };

    case 'text_preview':
      return {
        id,
        type: 'text_preview',
        payload: {
          body: payload.text?.body || '',
          preview: payload.text?.preview_url || '',
        },
      };

    case 'location':
      return {
        id,
        type: 'location',
        payload: {
          latitude: payload.location?.latitude || 0,
          longitude: payload.location?.longitude || 0,
          name: payload.location?.name || '',
          address: payload.location?.address || '',
        },
      };

    case 'image':
      return {
        id,
        type: 'image',
        payload: {
          link: payload.image?.link || '',
          caption: payload.image?.caption || null,
        },
      };

    case 'video':
      return {
        id,
        type: 'video',
        payload: {
          link: payload.video?.link || '',
          caption: payload.video?.caption || null,
        },
      };

    case 'document':
      return {
        id,
        type: 'document',
        payload: {
          link: payload.document?.link || '',
          filename: payload.document?.filename || 'document',
          caption: payload.document?.caption || null,
        },
      };

    case 'interactive':
      const interactiveType = payload.interactive?.type;

      if (interactiveType === 'button') {
        return {
          id,
          type: 'interactive_button',
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || '',
            footer: payload.interactive.footer?.text || null,
            buttons: (payload.interactive.action?.buttons || []).map((btn) => ({
              id: btn.reply?.id || '',
              title: btn.reply?.title || '',
            })),
          },
        };
      }

      if (interactiveType === 'list') {
        return {
          id,
          type: 'interactive_list',
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || '',
            footer: payload.interactive.footer?.text || null,
            buttonText: payload.interactive.action?.button || 'View Options',
            sections: (payload.interactive.action?.sections || []).map((section) => ({
              title: section.title || null,
              rows: (section.rows || []).map((row) => ({
                id: row.id || '',
                title: row.title || '',
                description: row.description || null,
              })),
            })),
          },
        };
      }

      if (interactiveType === 'cta_url') {
        return {
          id,
          type: 'interactive_cta',
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || '',
            footer: payload.interactive.footer?.text || null,
            displayText: payload.interactive.action?.parameters?.display_text || 'Visit',
            url: payload.interactive.action?.parameters?.url || '',
          },
        };
      }

      if (interactiveType === 'location_request_message') {
        return {
          id,
          type: 'interactive_location_request',
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || '',
            footer: payload.interactive.footer?.text || null,
          },
        };
      }

      throw new Error(`Unknown interactive type: ${interactiveType}`);

    default:
      throw new Error(`Unsupported message type: ${type}`);
  }
}

module.exports = { parseWhatsAppPayload };
```

---

## utils/webhookConstructor.js

```javascript
/**
 * Constructs full WhatsApp webhook payloads from Simple UI Replies
 */
function constructWebhookPayload(simpleReply) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const messageId = `wamid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const from = '1234567890'; // Mock user phone number

  const baseWebhook = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550000000',
                phone_number_id: 'PHONE_NUMBER_ID',
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User',
                  },
                  wa_id: from,
                },
              ],
              messages: [],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  let message = {
    from,
    id: messageId,
    timestamp,
    type: '',
  };

  switch (simpleReply.type) {
    case 'text':
      message.type = 'text';
      message.text = {
        body: simpleReply.payload.body,
      };
      break;

    case 'button_reply':
      message.type = 'interactive';
      message.interactive = {
        type: 'button_reply',
        button_reply: {
          id: simpleReply.payload.id,
          title: simpleReply.payload.title,
        },
      };
      if (simpleReply.contextMessageId) {
        message.context = {
          id: simpleReply.contextMessageId,
        };
      }
      break;

    case 'list_reply':
      message.type = 'interactive';
      message.interactive = {
        type: 'list_reply',
        list_reply: {
          id: simpleReply.payload.id,
          title: simpleReply.payload.title,
          description: simpleReply.payload.description || null,
        },
      };
      if (simpleReply.contextMessageId) {
        message.context = {
          id: simpleReply.contextMessageId,
        };
      }
      break;

    case 'location':
      message.type = 'location';
      message.location = {
        latitude: simpleReply.payload.latitude,
        longitude: simpleReply.payload.longitude,
        name: simpleReply.payload.name,
        address: simpleReply.payload.address || null,
      };
      if (simpleReply.contextMessageId) {
        message.context = {
          id: simpleReply.contextMessageId,
        };
      }
      break;

    case 'image':
      message.type = 'image';
      message.image = {
        link: simpleReply.payload.link,
        caption: simpleReply.payload.caption || null,
      };
      break;

    case 'video':
      message.type = 'video';
      message.video = {
        link: simpleReply.payload.link,
        caption: simpleReply.payload.caption || null,
      };
      break;

    case 'document':
      message.type = 'document';
      message.document = {
        link: simpleReply.payload.link,
        filename: simpleReply.payload.filename,
        caption: simpleReply.payload.caption || null,
      };
      break;

    default:
      throw new Error(`Unsupported reply type: ${simpleReply.type}`);
  }

  baseWebhook.entry[0].changes[0].value.messages.push(message);
  return baseWebhook;
}

module.exports = { constructWebhookPayload };
```

---

## Testing the Bridge Server

### 1. Test Text Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "text": {
      "body": "Hello from the bot!"
    }
  }'
```

### 2. Test Button Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "interactive",
    "interactive": {
      "type": "button",
      "header": {
        "text": "Choose an Action"
      },
      "body": {
        "text": "Please select one of the options below."
      },
      "footer": {
        "text": "Powered by WhatsApp"
      },
      "action": {
        "buttons": [
          {
            "type": "reply",
            "reply": {
              "id": "btn-yes",
              "title": "Yes"
            }
          },
          {
            "type": "reply",
            "reply": {
              "id": "btn-no",
              "title": "No"
            }
          }
        ]
      }
    }
  }'
```

### 3. Test List Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "interactive",
    "interactive": {
      "type": "list",
      "header": {
        "text": "Main Menu"
      },
      "body": {
        "text": "Choose from the options below."
      },
      "footer": {
        "text": "Select an option"
      },
      "action": {
        "button": "View Menu",
        "sections": [
          {
            "title": "Category A",
            "rows": [
              {
                "id": "opt-1",
                "title": "Option 1",
                "description": "First option"
              },
              {
                "id": "opt-2",
                "title": "Option 2",
                "description": "Second option"
              }
            ]
          }
        ]
      }
    }
  }'
```

### 4. Test CTA URL Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "interactive",
    "interactive": {
      "type": "cta_url",
      "header": {
        "text": "Visit Our Site"
      },
      "body": {
        "text": "Click the button to learn more."
      },
      "footer": {
        "text": "Thank you"
      },
      "action": {
        "parameters": {
          "display_text": "Visit Now",
          "url": "https://www.google.com"
        }
      }
    }
  }'
```

### 5. Test Location Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "location",
    "location": {
      "latitude": -17.8216,
      "longitude": 31.0492,
      "name": "Harare",
      "address": "Capital of Zimbabwe"
    }
  }'
```

### 6. Test Image Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "image": {
      "link": "https://picsum.photos/400/300",
      "caption": "This is a sample image from the bot"
    }
  }'
```

### 7. Test Video Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "video": {
      "link": "https://www.w3schools.com/html/mov_bbb.mp4",
      "caption": "Sample video message"
    }
  }'
```

### 8. Test Document Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "document",
    "document": {
      "link": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      "filename": "sample-document.pdf",
      "caption": "Here is a document for you"
    }
  }'
```

### 9. Test Location Request Message

```bash
curl -X POST http://localhost:3001/send-to-emulator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "interactive",
    "interactive": {
      "type": "location_request_message",
      "header": {
        "text": "Share Your Location"
      },
      "body": {
        "text": "Please share your location so we can find nearby stores."
      },
      "footer": {
        "text": "Your privacy is important to us"
      },
      "action": {
        "name": "send_location"
      }
    }
  }'
```
