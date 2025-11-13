const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const { parseWhatsAppPayload } = require("./utils/payloadParser");
const { constructWebhookPayload } = require("./utils/webhookConstructor");


const PORT = 3001;

// CONFIGURATION: Change this to your bot's webhook URL
// simplex.local:8000
const BOT_WEBHOOK_URL =
  process.env.BOT_WEBHOOK_URL ||
  "http://localhost:8000/api/method/frappe_pywce.webhook.webhook";
console.log(`Forwarding replies to: ${BOT_WEBHOOK_URL}`);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());

// Receive full WhatsApp payload from bot, translate, and send to UI
app.post("/send-to-emulator", (req, res) => {
  try {
    const fullPayload = req.body;
    console.log(
      "📥 Received WhatsApp payload from bot:",
      JSON.stringify(fullPayload, null, 2)
    );

    const simpleMessage = parseWhatsAppPayload(fullPayload);
    console.log(
      "✨ Translated to Simple UI Contract:",
      JSON.stringify(simpleMessage, null, 2)
    );

    io.emit("ui_message", simpleMessage);
    console.log("📤 Sent to UI clients");

    res.status(200).json({ status: "ok", message: "Message sent to emulator" });
  } catch (error) {
    console.error("❌ Error processing payload:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Socket.io: Listen for replies from UI, translate, and POST to bot
io.on("connection", (socket) => {
  console.log("✅ UI client connected:", socket.id);

  socket.on("ui_reply", async (simpleReply) => {
    try {
      console.log(
        "📥 Received reply from UI:",
        JSON.stringify(simpleReply, null, 2)
      );

      const fullWebhookPayload = constructWebhookPayload(simpleReply);
      console.log(
        "✨ Constructed webhook payload:",
        JSON.stringify(fullWebhookPayload, null, 2)
      );

      const response = await axios.post(BOT_WEBHOOK_URL, fullWebhookPayload);
      console.log("📤 Sent to bot webhook. Response:", response.status);
    } catch (error) {
      console.error("❌ [conn] Error sending to bot:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ UI client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🚀 WhatsApp Bridge Server Running                   ║
║                                                       ║
║   Port: ${PORT}                                          ║
║   Bot sends to: POST /send-to-emulator                ║
║   Bot receives at: ${BOT_WEBHOOK_URL}      ║
╚═══════════════════════════════════════════════════════╝
  `);
});
