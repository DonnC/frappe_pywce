# Local WhatsApp Emulator Bridge

**⚠️ IMPORTANT:** You must run it separately on your local machine or server.


The bridge works in a way which is easy to add more supported whatsapp messages.

It converts the webhooks messages into a simple basic contract that the `emulator` will use.

It will also translate back this simple contract from `emulator` into a full whatsapp webhook payload and respond to the bot.


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
        "text": "pywce"
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
        "text": "Author GitHub"
      },
      "body": {
        "text": "Thank you for checking out my work. Check more exciting projects on my GitHub profile below"
      },
      "action": {
        "parameters": {
          "display_text": "Visit GitHub",
          "url": "https://github.com/DonnC"
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
