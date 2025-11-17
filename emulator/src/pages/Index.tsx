import { useState, useEffect } from "react";
import { SocketProvider, useSocket } from "@/context/SocketProvider";
import { ChatWindow } from "@/components/ChatWindow";
import { DemoToolbar } from "@/components/DemoToolbar";
import { ChatMessage, SimpleUIMessage, UIReply } from "@/types/message";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <SocketProvider>
      <WhatsAppEmulator />
    </SocketProvider>
  );
};

const WhatsAppEmulator = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for messages from the bridge
    socket.on("ui_message", (simpleMessage: SimpleUIMessage) => {
      console.log("📨 Received message from bridge:", simpleMessage);

      // TODO: fix handling of special message types
      if ("status" in simpleMessage && simpleMessage.status === "read") {
        toast.info("Bot marked message as read");
        return;
      }

      if ("typing_indicator" in simpleMessage) {
        toast.info("Bot is typing...");
        return;
      }

      if ("type" in simpleMessage && simpleMessage.type === "reaction") {
        const emoji = "👍";
        toast.info(`Bot reacted: ${emoji}`);
        return;
      }

      if ("context" in simpleMessage && simpleMessage.context) {
        toast.info("Bot replied to a message");
      }

      addMessage(simpleMessage, "out");
      // toast.success("New message from bot");
    });

    return () => {
      socket.off("ui_message");
    };
  }, [socket]);

  const addMessage = (data: SimpleUIMessage, direction: "in" | "out") => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      direction,
      data,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleReply = (reply: UIReply) => {
    console.log("📤 Sending reply to bridge:", reply);

    // Show the user's reply in the UI
    if (reply.type === "text") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "text",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "button_reply") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "text",
          payload: { body: `✓ ${reply.payload.title}` },
        },
        "in"
      );
    } else if (reply.type === "list_reply") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "text",
          payload: { body: `✓ ${reply.payload.title}` },
        },
        "in"
      );
    } else if (reply.type === "location") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "location",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "image") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "image",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "video") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "video",
          payload: reply.payload,
        },
        "in"
      );
    } else if (reply.type === "document") {
      addMessage(
        {
          id: `reply-${Date.now()}`,
          type: "document",
          payload: reply.payload,
        },
        "in"
      );
    }

    // Send to bridge
    if (socket) {
      socket.emit("ui_reply", reply);
      // toast.success("Reply sent to bot");
    } else {
      toast.error("Not connected to bridge server");
    }
  };

  const handleAddDemoMessage = (demoMessage: SimpleUIMessage) => {
    addMessage(demoMessage, "out");
    // toast.info("Demo message added");
  };

  const handleClearMessages = () => {
    setMessages([]);
    toast.info("Messages cleared");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[700px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-card border">
        {/* Connection Status Badge */}
        <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">WhatsApp UI Emulator</span>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className="text-xs"
          >
            {isConnected ? "🟢 Connected" : "🔴 Bridge Offline"}
          </Badge>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} onReply={handleReply} />
        </div>

        {/* Demo Toolbar */}
        <DemoToolbar
          onAddMessage={handleAddDemoMessage}
          onClear={handleClearMessages}
        />
      </div>
    </div>
  );
};

export default Index;
