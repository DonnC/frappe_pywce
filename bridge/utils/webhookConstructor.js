/**
 * Constructs full WhatsApp webhook payloads from Simple UI Replies
 */
function constructWebhookPayload(simpleReply) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const messageId = `wamid-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const from = "1234567890";

  const baseWebhook = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550000000",
                phone_number_id: "PHONE_NUMBER_ID",
              },
              contacts: [
                {
                  profile: {
                    name: "Test User",
                  },
                  wa_id: from,
                },
              ],
              messages: [],
            },
            field: "messages",
          },
        ],
      },
    ],
  };

  let message = {
    from,
    id: messageId,
    timestamp,
    type: "",
  };

  switch (simpleReply.type) {
    case "text":
      message.type = "text";
      message.text = {
        body: simpleReply.payload.body,
      };
      break;

    case "button_reply":
      message.type = "interactive";
      message.interactive = {
        type: "button_reply",
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

    case "list_reply":
      message.type = "interactive";
      message.interactive = {
        type: "list_reply",
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

    case "location":
      message.type = "location";
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

    case "image":
      message.type = "image";
      message.image = {
        link: simpleReply.payload.link,
        caption: simpleReply.payload.caption || null,
      };
      break;

    case "video":
      message.type = "video";
      message.video = {
        link: simpleReply.payload.link,
        caption: simpleReply.payload.caption || null,
      };
      break;

    case "document":
      message.type = "document";
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
