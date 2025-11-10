# Bridge Server Code
The main brains of the mock whatsapp emulator

## Quick Start

1. Create a new folder for the bridge server (outside this project)
2. Copy the code below into the appropriate files
3. Run `npm install` then `npm start`

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
