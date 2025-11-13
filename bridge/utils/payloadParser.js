/**
 * Parses full WhatsApp "Send Message" payloads into Simple UI Contract
 */
function parseWhatsAppPayload(payload) {
  const type = payload.type;

  // Generate a mock WAMID for context tracking
  const id = `wamid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        payload: {
          body: payload.text?.body || "",
        },
      };

    case "text_preview":
      return {
        id,
        type: "text_preview",
        payload: {
          body: payload.text?.body || "",
          preview: payload.text?.preview_url || "",
        },
      };

    case "location":
      return {
        id,
        type: "location",
        payload: {
          latitude: payload.location?.latitude || 0,
          longitude: payload.location?.longitude || 0,
          name: payload.location?.name || "",
          address: payload.location?.address || "",
        },
      };

    case "image":
      return {
        id,
        type: "image",
        payload: {
          link: payload.image?.link || "",
          caption: payload.image?.caption || null,
        },
      };

    case "video":
      return {
        id,
        type: "video",
        payload: {
          link: payload.video?.link || "",
          caption: payload.video?.caption || null,
        },
      };

    case "document":
      return {
        id,
        type: "document",
        payload: {
          link: payload.document?.link || "",
          filename: payload.document?.filename || "document",
          caption: payload.document?.caption || null,
        },
      };

    case "interactive":
      const interactiveType = payload.interactive?.type;

      if (interactiveType === "button") {
        return {
          id,
          type: "interactive_button",
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || "",
            footer: payload.interactive.footer?.text || null,
            buttons: (payload.interactive.action?.buttons || []).map((btn) => ({
              id: btn.reply?.id || "",
              title: btn.reply?.title || "",
            })),
          },
        };
      }

      if (interactiveType === "list") {
        return {
          id,
          type: "interactive_list",
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || "",
            footer: payload.interactive.footer?.text || null,
            buttonText: payload.interactive.action?.button || "View Options",
            sections: (payload.interactive.action?.sections || []).map(
              (section) => ({
                title: section.title || null,
                rows: (section.rows || []).map((row) => ({
                  id: row.id || "",
                  title: row.title || "",
                  description: row.description || null,
                })),
              })
            ),
          },
        };
      }

      if (interactiveType === "cta_url") {
        return {
          id,
          type: "interactive_cta",
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || "",
            footer: payload.interactive.footer?.text || null,
            displayText:
              payload.interactive.action?.parameters?.display_text || "Visit",
            url: payload.interactive.action?.parameters?.url || "",
          },
        };
      }

      if (interactiveType === "location_request_message") {
        return {
          id,
          type: "interactive_location_request",
          payload: {
            header: payload.interactive.header?.text || null,
            body: payload.interactive.body?.text || "",
            footer: payload.interactive.footer?.text || null,
          },
        };
      }

      throw new Error(`Unknown interactive type: ${interactiveType}`);

    // TODO: add more supported message types

    default:
      throw new Error(`Unsupported message type: ${type}`);
  }
}

module.exports = { parseWhatsAppPayload };
